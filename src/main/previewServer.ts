import * as fs from 'fs'
import * as path from 'path'
import * as net from 'net'
import { utilityProcess } from 'electron'
import { collectAllScreens } from './fileSystem'

let viteProcess: ReturnType<typeof utilityProcess.fork> | null = null
let previewPort: number | null = null
let currentProjectPath: string | null = null
const previewLogs: string[] = []
const allLogs: string[] = []

const ANSI_RE = /\x1B\[[0-9;]*m/g

function pushLog(raw: string): void {
  const lines = raw.replace(ANSI_RE, '').split('\n')
  for (const line of lines) {
    if (line.trim()) {
      const logLine = `[vite] ${line}`
      previewLogs.push(line)
      allLogs.push(logLine)
    }
  }
  if (previewLogs.length > 1000) previewLogs.splice(0, previewLogs.length - 1000)
  if (allLogs.length > 2000) allLogs.splice(0, allLogs.length - 2000)
}

export function addLog(source: string, message: string): void {
  const logLine = `[${source}] ${message}`
  allLogs.push(logLine)
  if (allLogs.length > 2000) allLogs.splice(0, allLogs.length - 2000)
}

export function getPreviewLogs(): string[] {
  return [...previewLogs]
}

export function getAllLogs(): string[] {
  return [...allLogs]
}

export function getPreviewPort(): number | null {
  return previewPort
}

async function findFreePort(start = 5200): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', () => resolve(findFreePort(start + 1)))
    server.listen(start, () => {
      server.close(() => resolve(start))
    })
  })
}

function getPreviewDir(projectPath: string): string {
  return path.join(projectPath, '.prototoy', 'preview')
}

// Returns the app's node_modules directory, redirecting into .asar.unpacked in production
// so native tools (rolldown, esbuild) that can't read asar archives get real filesystem paths.
function getAppNodeModules(): string {
  let p = path.resolve(__dirname, '../../node_modules')
  if (p.includes(path.sep + 'app.asar' + path.sep)) {
    p = p.replace(path.sep + 'app.asar' + path.sep, path.sep + 'app.asar.unpacked' + path.sep)
  }
  return p
}

function writePreviewScaffold(previewDir: string, projectPath: string): void {
  fs.mkdirSync(path.join(previewDir, 'src'), { recursive: true })

  // Symlink node_modules so Vite's resolver and optimizer find react/react-dom normally.
  // Using 'junction' works as a regular symlink on Linux/macOS and avoids admin rights on Windows.
  const appNodeModules = getAppNodeModules()
  const nodeModulesLink = path.join(previewDir, 'node_modules')
  try {
    const lstat = fs.lstatSync(nodeModulesLink)
    if (lstat.isSymbolicLink()) {
      if (fs.readlinkSync(nodeModulesLink) !== appNodeModules) {
        fs.unlinkSync(nodeModulesLink)
        fs.symlinkSync(appNodeModules, nodeModulesLink, 'junction')
      }
    } else {
      fs.rmSync(nodeModulesLink, { recursive: true })
      fs.symlinkSync(appNodeModules, nodeModulesLink, 'junction')
    }
  } catch {
    fs.symlinkSync(appNodeModules, nodeModulesLink, 'junction')
  }

  // Clear stale optimizer cache whenever we (re)scaffold so Vite starts clean.
  const viteCache = path.join(previewDir, '.vite')
  if (fs.existsSync(viteCache)) fs.rmSync(viteCache, { recursive: true })

  // Minimal package.json so Vite treats files as ES modules.
  fs.writeFileSync(
    path.join(previewDir, 'package.json'),
    JSON.stringify({ name: 'prototoy-preview', private: true, type: 'module' }, null, 2) + '\n'
  )

  fs.writeFileSync(
    path.join(previewDir, 'index.html'),
    `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Prototoy Preview</title>\n  <style>* { margin: 0; padding: 0; box-sizing: border-box; }</style>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>\n`
  )

  fs.writeFileSync(
    path.join(previewDir, 'src', 'main.tsx'),
    `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\n\nReactDOM.createRoot(document.getElementById('root')!).render(<App />)\n`
  )

  writePreviewApp(previewDir, projectPath)
}

export function writePreviewApp(previewDir: string, projectPath: string): void {
  const screens = collectAllScreens(projectPath)
  const srcDir = path.join(previewDir, 'src')
  const relVars = path
    .relative(srcDir, path.join(projectPath, '_include', 'assets', 'variables.css'))
    .replace(/\\/g, '/')

  if (screens.length === 0) {
    fs.writeFileSync(
      path.join(srcDir, 'App.tsx'),
      `import React from 'react'\nexport default function App(): React.ReactElement {\n  return (\n    <div style={{ width: 390, height: 844, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#aaa', fontFamily: 'system-ui', fontSize: 13 }}>\n      No screens yet — create one in the sidebar\n    </div>\n  )\n}\n`
    )
    return
  }

  const imports = screens
    .map((s, i) => {
      const rel = path.relative(srcDir, s.fsPath).replace(/\\/g, '/')
      return `import Screen${i} from '${rel}'`
    })
    .join('\n')

  const routeEntries = screens.map((s, i) => `  '${s.urlPath}': Screen${i}`).join(',\n')

  const content = `import React from 'react'
${imports}
import '${relVars}'

const ROUTES: Record<string, React.ComponentType> = {
${routeEntries}
}

export default function App(): React.ReactElement {
  const screenPath = window.location.pathname
  const Screen = ROUTES[screenPath]

  if (!Screen) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#aaa', fontFamily: 'system-ui', fontSize: 13 }}>
        Select a screen from the sidebar
      </div>
    )
  }

  return <Screen />
}
`
  fs.writeFileSync(path.join(srcDir, 'App.tsx'), content)
}

export function regeneratePreviewApp(): void {
  if (!currentProjectPath) return
  const previewDir = getPreviewDir(currentProjectPath)
  if (!fs.existsSync(path.join(previewDir, 'src'))) return
  writePreviewApp(previewDir, currentProjectPath)
}

export async function startPreviewServer(
  projectPath: string,
  onStatus: (status: string, port?: number) => void
): Promise<number> {
  if (viteProcess) {
    stopPreviewServer()
  }

  currentProjectPath = projectPath
  const previewDir = getPreviewDir(projectPath)
  const port = await findFreePort(5200)
  previewPort = port

  previewLogs.length = 0
  writePreviewScaffold(previewDir, projectPath)
  onStatus('starting')

  const runnerPath = path.join(__dirname, 'vite-runner.js')
  const appNodeModules = getAppNodeModules()

  return new Promise((resolve, reject) => {
    let settled = false

    viteProcess = utilityProcess.fork(runnerPath, [String(port), projectPath, appNodeModules], {
      stdio: 'pipe',
      serviceName: 'vite-preview'
    })

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        viteProcess?.kill()
        viteProcess = null
        previewPort = null
        reject(new Error('Vite server timed out'))
      }
    }, 30000)

    viteProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      pushLog(text)
      if (!settled && text.includes(`ready:${port}`)) {
        settled = true
        clearTimeout(timeout)
        onStatus('ready', port)
        resolve(port)
      }
    })

    viteProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString()
      pushLog(text)
      console.error('[vite-runner]', text.trim())
    })

    viteProcess.on('exit', (code) => {
      clearTimeout(timeout)
      viteProcess = null
      previewPort = null
      if (!settled && code !== null && code !== 0) {
        settled = true
        reject(new Error(`Vite runner exited with code ${code}`))
      }
    })
  })
}

export function stopPreviewServer(): void {
  if (viteProcess) {
    viteProcess.kill()
    viteProcess = null
    previewPort = null
    currentProjectPath = null
  }
}

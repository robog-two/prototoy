import { createServer, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const [,, portStr, projectPath, appNodeModules] = process.argv
const port = parseInt(portStr, 10)
const previewDir = path.join(projectPath, '.prototoy', 'preview')
const includePath = path.join(projectPath, '_include')

function resolveAppModules(): Plugin {
  return {
    name: 'resolve-app-modules',
    enforce: 'pre',
    resolveId(id: string) {
      if (id.startsWith('@include/')) {
        const base = path.join(includePath, id.slice('@include/'.length))
        const exts = ['.tsx', '.ts', '.jsx', '.js']
        for (const ext of exts) {
          if (fs.existsSync(base + ext)) return base + ext
        }
        for (const ext of exts) {
          const idx = path.join(base, 'index' + ext)
          if (fs.existsSync(idx)) return idx
        }
        return base
      }
      return null
    }
  }
}

async function main(): Promise<void> {
  const server = await createServer({
    configFile: false,
    root: previewDir,
    cacheDir: path.join(previewDir, '.vite'),
    appType: 'spa',
    plugins: [resolveAppModules(), react()],
    server: {
      port,
      strictPort: true,
      fs: { allow: [projectPath, appNodeModules] }
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js']
    },
    logLevel: 'info'
  })

  await server.listen()
  process.stdout.write(`ready:${port}\n`)
}

main().catch(err => {
  process.stderr.write(`${err.message}\n`)
  process.exit(1)
})

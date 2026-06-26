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

// Injects a tiny script that forwards cursor events to the parent Electron renderer
// via postMessage — needed because the iframe is cross-origin (different port).
function cursorBridge(): Plugin {
  const script = `<style>*,*::before,*::after{cursor:none!important}</style><script>
(function(){
  function send(type,x,y){window.parent.postMessage({__prototoy:true,type,x,y},'*')}
  document.addEventListener('mousemove',function(e){send('move',e.clientX,e.clientY)})
  document.addEventListener('mousedown',function(e){send('down',e.clientX,e.clientY)})
  document.addEventListener('mouseup',function(e){send('up',e.clientX,e.clientY)})
  document.addEventListener('mouseleave',function(){send('leave',0,0)})
})()
</script>`
  return {
    name: 'cursor-bridge',
    transformIndexHtml(html: string) {
      return html.replace('</head>', script + '</head>')
    }
  }
}

async function main(): Promise<void> {
  const server = await createServer({
    configFile: false,
    root: previewDir,
    cacheDir: path.join(previewDir, '.vite'),
    appType: 'spa',
    plugins: [resolveAppModules(), react(), cursorBridge()],
    server: {
      host: '0.0.0.0',
      port,
      strictPort: true,
      fs: { allow: [projectPath, appNodeModules] }
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.svg', '.woff', '.woff2'],
      alias: {
        '@include': includePath
      }
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

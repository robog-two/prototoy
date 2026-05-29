import { app, BrowserWindow, shell, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import * as fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers } from './ipc'

function setupUpdater(): void {
  if (is.dev) return

  autoUpdater.checkForUpdatesAndNotify()
}

function registerLinuxDesktop(): void {
  if (process.platform !== 'linux' || !process.env.APPIMAGE) return

  const iconDir = join(homedir(), '.local/share/icons/hicolor/256x256/apps')
  const iconDest = join(iconDir, 'prototoy.png')
  const desktopDir = join(homedir(), '.local/share/applications')
  const desktopDest = join(desktopDir, 'prototoy.desktop')
  const iconSrc = join(process.resourcesPath, 'icon.png')

  try {
    if (!fs.existsSync(iconDest)) {
      fs.mkdirSync(iconDir, { recursive: true })
      fs.copyFileSync(iconSrc, iconDest)
    }

    if (!fs.existsSync(desktopDest)) {
      fs.mkdirSync(desktopDir, { recursive: true })
      fs.writeFileSync(desktopDest, [
        '[Desktop Entry]',
        'Name=Prototoy',
        'Comment=UI mockup and wireframe organizer',
        `Exec=${process.env.APPIMAGE}`,
        'Icon=prototoy',
        'Type=Application',
        'Categories=Development;',
        'StartupWMClass=Prototoy',
      ].join('\n') + '\n')
    }
  } catch {
    // Non-fatal — icon just won't appear in compositor
  }
}

function createWindow(): void {
  const iconPath = is.dev
    ? join(__dirname, '../../build/icon/icon-256x256.png')
    : join(process.resourcesPath, 'icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  const mainWindow = new BrowserWindow({
    width: 640,
    height: 520,
    minWidth: 400,
    minHeight: 300,
    show: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#fffdf7',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.setName('Prototoy')
registerLinuxDesktop()

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.localify.prototoy')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  setupUpdater()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

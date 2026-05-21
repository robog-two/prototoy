import { ipcMain, BrowserWindow, clipboard, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import chokidar, { FSWatcher } from 'chokidar'
import {
  openProjectDialog,
  readProjectTree,
  createScreen,
  createSection,
  renameNode,
  deleteNode,
  moveNode,
  updateSectionDescription,
  ensureIncludeDir,
  ensureAllSectionSymlinks,
  listAssets,
  copyAssetsToInclude
} from './fileSystem'
import { writeSectionClaudeMd, regenerateAllClaudeMds } from './claudeMd'
import {
  startPreviewServer,
  stopPreviewServer,
  regeneratePreviewApp,
  getPreviewPort
} from './previewServer'

let watcher: FSWatcher | null = null
let currentProjectPath: string | null = null

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null
}

function sendTreeUpdate(): void {
  const win = getMainWindow()
  if (!win || !currentProjectPath) return
  const tree = readProjectTree(currentProjectPath)
  win.webContents.send('tree:changed', tree)
}

export function registerIpcHandlers(): void {
  ipcMain.handle('project:create', async (_, name: string, description: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Create New Project',
      nameFieldLabel: 'Project folder name',
      defaultPath: name,
      buttonLabel: 'Create Project'
    })
    if (canceled || !filePath) return null

    fs.mkdirSync(filePath, { recursive: true })
    const config = { name, description }
    fs.writeFileSync(path.join(filePath, 'project.json'), JSON.stringify(config, null, 2))

    return activateProject(filePath)
  })

  ipcMain.handle('project:open', async () => {
    const projectPath = await openProjectDialog()
    if (!projectPath) return null
    return activateProject(projectPath)
  })

  ipcMain.handle('project:getTree', () => {
    if (!currentProjectPath) return null
    return readProjectTree(currentProjectPath)
  })

  ipcMain.handle('screen:create', async (_, parentPath: string, name: string) => {
    const screenPath = createScreen(parentPath, name)
    const sectionPath = findSectionAncestor(parentPath)
    if (sectionPath && currentProjectPath) {
      writeSectionClaudeMd(sectionPath, currentProjectPath, getProjectName(), getPreviewPort())
    }
    regeneratePreviewApp()
    return screenPath
  })

  ipcMain.handle('section:create', async (_, parentPath: string, name: string, description: string) => {
    const sectionPath = createSection(parentPath, name, description, currentProjectPath ?? undefined)
    if (currentProjectPath) {
      writeSectionClaudeMd(sectionPath, currentProjectPath, getProjectName(), getPreviewPort())
      const parentSection = findSectionAncestor(parentPath)
      if (parentSection) {
        writeSectionClaudeMd(parentSection, currentProjectPath, getProjectName(), getPreviewPort())
      }
    }
    return sectionPath
  })

  ipcMain.handle('node:rename', async (_, nodePath: string, newName: string) => {
    const newPath = renameNode(nodePath, newName)
    refreshAffectedClaudeMd(path.dirname(newPath))
    return newPath
  })

  ipcMain.handle('node:delete', async (_, nodePath: string) => {
    const parentPath = path.dirname(nodePath)
    deleteNode(nodePath)
    refreshAffectedClaudeMd(parentPath)
    regeneratePreviewApp()
  })

  ipcMain.handle('node:move', async (_, srcPath: string, destSectionPath: string) => {
    const srcParent = path.dirname(srcPath)
    const newPath = moveNode(srcPath, destSectionPath)
    refreshAffectedClaudeMd(srcParent)
    refreshAffectedClaudeMd(destSectionPath)
    regeneratePreviewApp()
    return newPath
  })

  ipcMain.handle('section:updateDescription', async (_, sectionPath: string, description: string) => {
    updateSectionDescription(sectionPath, description)
    if (currentProjectPath) {
      writeSectionClaudeMd(sectionPath, currentProjectPath, getProjectName(), getPreviewPort())
    }
  })

  ipcMain.handle('screen:select', (_, screenPath: string) => {
    if (!currentProjectPath) return null
    const urlPath = '/' + path.relative(currentProjectPath, screenPath).replace(/\\/g, '/')
    return urlPath
  })

  ipcMain.handle('preview:getPort', () => getPreviewPort())

  ipcMain.handle('clipboard:write', (_, text: string) => {
    clipboard.writeText(text)
  })

  ipcMain.handle('screenshot:save', async () => {
    const win = getMainWindow()
    if (!win) return
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: 'screenshot.png',
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    })
    if (canceled || !filePath) return
    return filePath
  })

  ipcMain.handle('assets:list', () => {
    if (!currentProjectPath) return []
    return listAssets(currentProjectPath)
  })

  ipcMain.handle('assets:import', async () => {
    if (!currentProjectPath) return []
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Assets',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] },
        { name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (canceled || filePaths.length === 0) return []
    const names = copyAssetsToInclude(currentProjectPath, filePaths)
    regenerateAllClaudeMds(currentProjectPath, getProjectName(), getPreviewPort())
    return names
  })

  ipcMain.handle('assets:drop', async (_, filePaths: string[]) => {
    if (!currentProjectPath || filePaths.length === 0) return []
    const names = copyAssetsToInclude(currentProjectPath, filePaths)
    regenerateAllClaudeMds(currentProjectPath, getProjectName(), getPreviewPort())
    return names
  })
}

function activateProject(projectPath: string): ReturnType<typeof readProjectTree> {
  currentProjectPath = projectPath
  ensureIncludeDir(projectPath)
  ensureAllSectionSymlinks(projectPath)

  if (watcher) watcher.close()
  watcher = chokidar
    .watch(projectPath, {
      ignored: [/(^|[/\\])\./, /node_modules/, /\.prototoy/],
      persistent: true,
      ignoreInitial: true,
      depth: 8
    })
    .on('all', () => sendTreeUpdate())

  const tree = readProjectTree(projectPath)
  const win = getMainWindow()

  startPreviewServer(projectPath, (status, port) => {
    win?.webContents.send('preview:status', { status, port: port ?? null })
    if (status === 'ready' && port) {
      regenerateAllClaudeMds(projectPath, tree.config.name, port)
    }
  }).catch((err) => {
    win?.webContents.send('preview:status', { status: 'error', error: err.message })
  })

  return tree
}

function getProjectName(): string {
  if (!currentProjectPath) return 'Project'
  try {
    const config = JSON.parse(
      fs.readFileSync(path.join(currentProjectPath, 'project.json'), 'utf-8')
    )
    return config.name || 'Project'
  } catch {
    return 'Project'
  }
}

function findSectionAncestor(dirPath: string): string | null {
  if (!currentProjectPath) return null
  let current = dirPath
  while (current !== currentProjectPath && current.length > currentProjectPath.length) {
    if (fs.existsSync(path.join(current, 'folder.json'))) return current
    current = path.dirname(current)
  }
  return null
}

function refreshAffectedClaudeMd(parentPath: string): void {
  if (!currentProjectPath) return
  const sectionPath = findSectionAncestor(parentPath) ?? (
    fs.existsSync(path.join(parentPath, 'folder.json')) ? parentPath : null
  )
  if (sectionPath) {
    writeSectionClaudeMd(sectionPath, currentProjectPath, getProjectName(), getPreviewPort())
  }
}

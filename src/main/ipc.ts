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
  ensureSectionIncludeSymlink,
  listAssets,
  listAssetsTree,
  copyAssetsToInclude,
  createAssetFolder,
  moveAsset,
  deleteAsset,
  getAssetFilePath,
  readAssetText,
  writeAssetText
} from './fileSystem'
import type { ProjectIssue } from '../shared/types'
import { writeSectionClaudeMd, regenerateAllClaudeMds, regenerateAllSkills } from './claudeMd'
import {
  startPreviewServer,
  stopPreviewServer,
  regeneratePreviewApp,
  getPreviewPort,
  getPreviewLogs
} from './previewServer'
import { getRecentProjects, addRecentProject } from './recentProjects'

let watcher: FSWatcher | null = null
let currentProjectPath: string | null = null

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null
}

function sendTreeUpdate(): void {
  const win = getMainWindow()
  if (!win || !currentProjectPath) return
  try {
    const tree = readProjectTree(currentProjectPath)
    win.webContents.send('tree:changed', tree)
  } catch {
    // Non-fatal: skip this update (e.g. folder was deleted mid-watch)
  }
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

  ipcMain.handle('project:open', async (_, projectPath?: string) => {
    const path = projectPath || await openProjectDialog()
    if (!path) return null
    return activateProject(path)
  })

  ipcMain.handle('project:getTree', () => {
    if (!currentProjectPath) return null
    return readProjectTree(currentProjectPath)
  })

  ipcMain.handle('screen:create', async (_, parentPath: string, name: string) => {
    const screenPath = createScreen(parentPath, name)
    const sectionPath = findSectionAncestor(parentPath)
    if (sectionPath && currentProjectPath) {
      writeSectionClaudeMd(sectionPath, currentProjectPath, getProjectName())
    }
    regeneratePreviewApp()
    return screenPath
  })

  ipcMain.handle('section:create', async (_, parentPath: string, name: string, description: string) => {
    const sectionPath = createSection(parentPath, name, description, currentProjectPath ?? undefined)
    if (currentProjectPath) {
      writeSectionClaudeMd(sectionPath, currentProjectPath, getProjectName())
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
      writeSectionClaudeMd(sectionPath, currentProjectPath, getProjectName())
    }
  })

  ipcMain.handle('screen:select', (_, screenPath: string) => {
    if (!currentProjectPath) return null
    const urlPath = '/' + path.relative(currentProjectPath, screenPath).replace(/\\/g, '/')
    return urlPath
  })

  ipcMain.handle('preview:getPort', () => getPreviewPort())
  ipcMain.handle('preview:getLogs', () => getPreviewLogs())

  ipcMain.handle('clipboard:write', (_, text: string) => {
    clipboard.writeText(text)
  })

  ipcMain.handle('screenshot:save', async (_event, rect?: { x: number; y: number; width: number; height: number }) => {
    const win = getMainWindow()
    if (!win) return
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: 'screenshot.png',
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    })
    if (canceled || !filePath) return
    const image = await win.webContents.capturePage(rect)
    fs.writeFileSync(filePath, image.toPNG())
    return filePath
  })

  ipcMain.handle('assets:list', () => {
    if (!currentProjectPath) return []
    return listAssets(currentProjectPath)
  })

  ipcMain.handle('assets:tree', () => {
    if (!currentProjectPath) return []
    return listAssetsTree(currentProjectPath)
  })

  ipcMain.handle('assets:import', async (_, targetFolder?: string) => {
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
    const names = copyAssetsToInclude(currentProjectPath, filePaths, targetFolder)
    regenerateAllClaudeMds(currentProjectPath, getProjectName())
    return names
  })

  ipcMain.handle('assets:drop', async (_, filePaths: string[], targetFolder?: string) => {
    if (!currentProjectPath || filePaths.length === 0) return []
    const names = copyAssetsToInclude(currentProjectPath, filePaths, targetFolder)
    regenerateAllClaudeMds(currentProjectPath, getProjectName())
    return names
  })

  ipcMain.handle('assets:createFolder', async (_, folderRelPath: string) => {
    if (!currentProjectPath) return
    createAssetFolder(currentProjectPath, folderRelPath)
  })

  ipcMain.handle('assets:move', async (_, assetRelPath: string, newParentRelPath: string) => {
    if (!currentProjectPath) return
    moveAsset(currentProjectPath, assetRelPath, newParentRelPath)
  })

  ipcMain.handle('assets:delete', async (_, assetRelPath: string) => {
    if (!currentProjectPath) return
    deleteAsset(currentProjectPath, assetRelPath)
  })

  ipcMain.handle('assets:getPath', async (_, assetRelPath: string) => {
    if (!currentProjectPath) return ''
    return getAssetFilePath(currentProjectPath, assetRelPath)
  })

  ipcMain.handle('assets:readText', async (_, assetRelPath: string) => {
    if (!currentProjectPath) return ''
    return readAssetText(currentProjectPath, assetRelPath)
  })

  ipcMain.handle('assets:writeText', async (_, assetRelPath: string, content: string) => {
    if (!currentProjectPath) return
    writeAssetText(currentProjectPath, assetRelPath, content)
  })

  ipcMain.handle('recent:get', () => {
    return getRecentProjects()
  })

  ipcMain.handle('issue:repairAuto', (_, kind: string, targetPath: string) => {
    switch (kind) {
      case 'include-dir-missing':
        ensureIncludeDir(targetPath)
        break
      case 'symlink-failed':
        if (!currentProjectPath) throw new Error('No project open')
        ensureSectionIncludeSymlink(targetPath, currentProjectPath)
        break
      default:
        throw new Error(`Unknown auto-repair kind: ${kind}`)
    }
  })

  ipcMain.handle('issue:repairText', (_, sectionPath: string, description: string) => {
    const configPath = path.join(sectionPath, 'folder.json')
    let existing: Record<string, unknown> = {}
    if (fs.existsSync(configPath)) {
      try { existing = JSON.parse(fs.readFileSync(configPath, 'utf-8')) } catch { /* ignore — we overwrite */ }
    }
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, description }, null, 2))
  })
}

function activateProject(projectPath: string): ReturnType<typeof readProjectTree> | null {
  const win = getMainWindow()

  // Validate the path before touching any state or starting side effects
  try {
    const stat = fs.statSync(projectPath)
    if (!stat.isDirectory()) throw new Error('Not a folder')
  } catch (err) {
    const message =
      err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT'
        ? `Folder not found: "${path.basename(projectPath)}"`
        : err instanceof Error
          ? err.message
          : 'Could not access project folder'
    win?.webContents.send('project:error', { message, path: projectPath })
    return null
  }

  currentProjectPath = projectPath
  const issues: ProjectIssue[] = []

  try { ensureIncludeDir(projectPath) } catch (err) {
    issues.push({
      id: `issue-incl-${Date.now()}`,
      kind: 'include-dir-missing',
      title: 'Shared _include directory missing',
      detail: `Could not create the _include directory. ${err instanceof Error ? err.message : String(err)}`,
      path: path.join(projectPath, '_include'),
      repair: 'auto'
    })
  }

  try {
    const symlinkFailures = ensureAllSectionSymlinks(projectPath)
    for (const fp of symlinkFailures) {
      issues.push({
        id: `issue-sym-${fp}`,
        kind: 'symlink-failed',
        title: 'Section link broken',
        detail: `"${path.basename(fp)}" could not be linked to the shared _include directory.`,
        path: fp,
        repair: 'auto'
      })
    }
  } catch { /* non-fatal */ }

  if (watcher) watcher.close()
  watcher = chokidar
    .watch(projectPath, {
      ignored: [/(^|[/\\])\./, /node_modules/, /\.prototoy/],
      persistent: true,
      ignoreInitial: true,
      depth: 8
    })
    .on('all', () => sendTreeUpdate())

  let tree: ReturnType<typeof readProjectTree>
  try {
    tree = readProjectTree(projectPath, issues)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read project'
    win?.webContents.send('project:error', { message, path: projectPath })
    return null
  }

  // Generate CLAUDE.md and skills for all sections immediately
  try { regenerateAllClaudeMds(projectPath, tree.config.name ?? '') } catch { /* non-fatal */ }
  try { regenerateAllSkills(projectPath) } catch { /* non-fatal */ }

  // Resize window to full size for project view, keeping it centered
  if (win && !win.isMaximized()) {
    try {
      win.setMinimumSize(400, 300)
      const [oldX, oldY] = win.getPosition()
      const [oldWidth, oldHeight] = win.getSize()
      const newWidth = 1280
      const newHeight = 800

      // Calculate new position to keep window centered
      const newX = Math.floor(Math.max(0, oldX + (oldWidth - newWidth) / 2))
      const newY = Math.floor(Math.max(0, oldY + (oldHeight - newHeight) / 2))

      win.setPosition(newX, newY)
      win.setSize(newWidth, newHeight, true)
    } catch {
      // If positioning fails, just resize without repositioning
      try { win?.setSize(1280, 800, true) } catch { /* non-fatal */ }
    }
  }

  try { addRecentProject(tree) } catch { /* non-fatal */ }

  if (issues.length > 0) {
    win?.webContents.send('project:issues', issues)
  }

  startPreviewServer(projectPath, (status, port) => {
    win?.webContents.send('preview:status', { status, port: port ?? null })
    if (status === 'ready' && port) {
      try { regenerateAllClaudeMds(projectPath, tree.config.name ?? '') } catch { /* non-fatal */ }
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

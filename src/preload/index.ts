import { contextBridge, ipcRenderer } from 'electron'
import type { ProjectTree, PreviewState, ProjectIssue, AssetNode } from '../shared/types'

const api = {
  createProject: (name: string, description: string): Promise<ProjectTree | null> =>
    ipcRenderer.invoke('project:create', name, description),
  openProject: (projectPath?: string): Promise<ProjectTree | null> =>
    projectPath ? ipcRenderer.invoke('project:open', projectPath) : ipcRenderer.invoke('project:open'),
  getTree: (): Promise<ProjectTree | null> => ipcRenderer.invoke('project:getTree'),

  createScreen: (parentPath: string, name: string): Promise<string> =>
    ipcRenderer.invoke('screen:create', parentPath, name),
  createSection: (parentPath: string, name: string, description: string): Promise<string> =>
    ipcRenderer.invoke('section:create', parentPath, name, description),
  renameNode: (nodePath: string, newName: string): Promise<string> =>
    ipcRenderer.invoke('node:rename', nodePath, newName),
  deleteNode: (nodePath: string): Promise<void> => ipcRenderer.invoke('node:delete', nodePath),
  moveNode: (srcPath: string, destSectionPath: string): Promise<string> =>
    ipcRenderer.invoke('node:move', srcPath, destSectionPath),
  updateSectionDescription: (sectionPath: string, description: string): Promise<void> =>
    ipcRenderer.invoke('section:updateDescription', sectionPath, description),

  selectScreen: (screenPath: string): Promise<string | null> => ipcRenderer.invoke('screen:select', screenPath),
  getPreviewPort: (): Promise<number | null> => ipcRenderer.invoke('preview:getPort'),
  getPreviewLogs: (): Promise<string[]> => ipcRenderer.invoke('preview:getLogs'),

  copyToClipboard: (text: string): Promise<void> => ipcRenderer.invoke('clipboard:write', text),
  saveScreenshot: (rect?: { x: number; y: number; width: number; height: number }): Promise<string | undefined> => ipcRenderer.invoke('screenshot:save', rect),

  listAssets: (): Promise<string[]> => ipcRenderer.invoke('assets:list'),
  listAssetsTree: (): Promise<AssetNode[]> => ipcRenderer.invoke('assets:tree'),
  importAssets: (targetFolder?: string): Promise<string[]> => ipcRenderer.invoke('assets:import', targetFolder),
  dropAssets: (filePaths: string[], targetFolder?: string): Promise<string[]> => ipcRenderer.invoke('assets:drop', filePaths, targetFolder),
  createAssetFolder: (folderRelPath: string): Promise<void> => ipcRenderer.invoke('assets:createFolder', folderRelPath),
  moveAsset: (assetRelPath: string, newParentRelPath: string): Promise<void> => ipcRenderer.invoke('assets:move', assetRelPath, newParentRelPath),
  deleteAsset: (assetRelPath: string): Promise<void> => ipcRenderer.invoke('assets:delete', assetRelPath),
  getAssetPath: (assetRelPath: string): Promise<string> => ipcRenderer.invoke('assets:getPath', assetRelPath),
  readAssetText: (assetRelPath: string): Promise<string> => ipcRenderer.invoke('assets:readText', assetRelPath),
  writeAssetText: (assetRelPath: string, content: string): Promise<void> => ipcRenderer.invoke('assets:writeText', assetRelPath, content),

  getRecentProjects: (): Promise<any[]> => ipcRenderer.invoke('recent:get'),

  onTreeChanged: (callback: (tree: ProjectTree) => void) => {
    const handler = (_: unknown, tree: ProjectTree) => callback(tree)
    ipcRenderer.on('tree:changed', handler)
    return () => ipcRenderer.removeListener('tree:changed', handler)
  },

  onPreviewStatus: (callback: (state: PreviewState & { error?: string }) => void) => {
    const handler = (_: unknown, state: PreviewState) => callback(state)
    ipcRenderer.on('preview:status', handler)
    return () => ipcRenderer.removeListener('preview:status', handler)
  },

  onProjectError: (callback: (err: { message: string; path: string }) => void) => {
    const handler = (_: unknown, err: { message: string; path: string }) => callback(err)
    ipcRenderer.on('project:error', handler)
    return () => ipcRenderer.removeListener('project:error', handler)
  },

  onProjectIssues: (callback: (issues: ProjectIssue[]) => void) => {
    const handler = (_: unknown, issues: ProjectIssue[]) => callback(issues)
    ipcRenderer.on('project:issues', handler)
    return () => ipcRenderer.removeListener('project:issues', handler)
  },

  repairIssueAuto: (kind: string, targetPath: string): Promise<void> =>
    ipcRenderer.invoke('issue:repairAuto', kind, targetPath),

  repairIssueText: (sectionPath: string, description: string): Promise<void> =>
    ipcRenderer.invoke('issue:repairText', sectionPath, description)
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api

import { contextBridge, ipcRenderer } from 'electron'
import type { ProjectTree, PreviewState } from '../shared/types'

const api = {
  createProject: (name: string, description: string): Promise<ProjectTree | null> =>
    ipcRenderer.invoke('project:create', name, description),
  openProject: (): Promise<ProjectTree | null> => ipcRenderer.invoke('project:open'),
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

  copyToClipboard: (text: string): Promise<void> => ipcRenderer.invoke('clipboard:write', text),
  saveScreenshot: (): Promise<string | undefined> => ipcRenderer.invoke('screenshot:save'),

  listAssets: (): Promise<string[]> => ipcRenderer.invoke('assets:list'),
  importAssets: (): Promise<string[]> => ipcRenderer.invoke('assets:import'),
  dropAssets: (filePaths: string[]): Promise<string[]> => ipcRenderer.invoke('assets:drop', filePaths),

  onTreeChanged: (callback: (tree: ProjectTree) => void) => {
    const handler = (_: unknown, tree: ProjectTree) => callback(tree)
    ipcRenderer.on('tree:changed', handler)
    return () => ipcRenderer.removeListener('tree:changed', handler)
  },

  onPreviewStatus: (callback: (state: PreviewState & { error?: string }) => void) => {
    const handler = (_: unknown, state: PreviewState) => callback(state)
    ipcRenderer.on('preview:status', handler)
    return () => ipcRenderer.removeListener('preview:status', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api

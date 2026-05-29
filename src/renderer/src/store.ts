import { create } from 'zustand'
import type { ProjectTree, TreeNode, PreviewState, ProjectIssue, AssetNode } from '../../shared/types'

interface AppState {
  tree: ProjectTree | null
  selectedScreenPath: string | null
  selectedScreenUrlPath: string | null
  previewState: PreviewState
  expandedSections: Set<string>
  assetTree: AssetNode[]
  expandedAssetFolders: Set<string>
  activeAsset: AssetNode | null
  toast: string | null
  projectError: { message: string; path: string } | null
  projectIssues: ProjectIssue[] | null
  updateReady: boolean
  isUpdating: boolean

  setTree: (tree: ProjectTree | null) => void
  setSelectedScreen: (fsPath: string | null, urlPath: string | null) => void
  setPreviewState: (state: Partial<PreviewState>) => void
  toggleSection: (sectionPath: string) => void
  expandSection: (sectionPath: string) => void
  setAssetTree: (tree: AssetNode[]) => void
  toggleAssetFolder: (relPath: string) => void
  setActiveAsset: (asset: AssetNode | null) => void
  showToast: (message: string) => void
  clearToast: () => void
  setProjectError: (err: { message: string; path: string } | null) => void
  setProjectIssues: (issues: ProjectIssue[] | null) => void
  setUpdateReady: (ready: boolean) => void
  setIsUpdating: (updating: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  tree: null,
  selectedScreenPath: null,
  selectedScreenUrlPath: null,
  previewState: { port: null, status: 'idle' },
  expandedSections: new Set(),
  assetTree: [],
  expandedAssetFolders: new Set(),
  activeAsset: null,
  toast: null,
  projectError: null,
  projectIssues: null,
  updateReady: false,
  isUpdating: false,

  setTree: (tree) => set({ tree }),
  setSelectedScreen: (fsPath, urlPath) => set({ selectedScreenPath: fsPath, selectedScreenUrlPath: urlPath }),
  setPreviewState: (state) =>
    set((prev) => ({ previewState: { ...prev.previewState, ...state } })),
  toggleSection: (sectionPath) =>
    set((prev) => {
      const next = new Set(prev.expandedSections)
      if (next.has(sectionPath)) next.delete(sectionPath)
      else next.add(sectionPath)
      return { expandedSections: next }
    }),
  expandSection: (sectionPath) =>
    set((prev) => {
      const next = new Set(prev.expandedSections)
      next.add(sectionPath)
      return { expandedSections: next }
    }),
  setAssetTree: (tree) => set({ assetTree: tree }),
  toggleAssetFolder: (relPath) =>
    set((prev) => {
      const next = new Set(prev.expandedAssetFolders)
      if (next.has(relPath)) next.delete(relPath)
      else next.add(relPath)
      return { expandedAssetFolders: next }
    }),
  setActiveAsset: (asset) => set({ activeAsset: asset }),
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
  setProjectError: (err) => set({ projectError: err }),
  setProjectIssues: (issues) => set({ projectIssues: issues }),
  setUpdateReady: (updateReady) => set({ updateReady }),
  setIsUpdating: (isUpdating) => set({ isUpdating })
}))

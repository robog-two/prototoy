import { create } from 'zustand'
import type { ProjectTree, TreeNode, PreviewState, ProjectIssue } from '../../shared/types'

interface AppState {
  tree: ProjectTree | null
  selectedScreenPath: string | null
  selectedScreenUrlPath: string | null
  previewState: PreviewState
  expandedSections: Set<string>
  toast: string | null
  projectError: { message: string; path: string } | null
  projectIssues: ProjectIssue[] | null

  setTree: (tree: ProjectTree | null) => void
  setSelectedScreen: (fsPath: string | null, urlPath: string | null) => void
  setPreviewState: (state: Partial<PreviewState>) => void
  toggleSection: (sectionPath: string) => void
  expandSection: (sectionPath: string) => void
  showToast: (message: string) => void
  clearToast: () => void
  setProjectError: (err: { message: string; path: string } | null) => void
  setProjectIssues: (issues: ProjectIssue[] | null) => void
}

export const useStore = create<AppState>((set) => ({
  tree: null,
  selectedScreenPath: null,
  selectedScreenUrlPath: null,
  previewState: { port: null, status: 'idle' },
  expandedSections: new Set(),
  toast: null,
  projectError: null,
  projectIssues: null,

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
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
  setProjectError: (err) => set({ projectError: err }),
  setProjectIssues: (issues) => set({ projectIssues: issues })
}))

/**
 * Testing pattern for Zustand store hooks
 * Zustand stores must be tested differently than React components
 * Use the hook directly and check state changes
 */
import { describe, it, expect, beforeEach } from '@jest/globals'
import { useStore } from '../store'

describe('Store (useStore)', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    const { setState } = useStore
    setState({
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
    })
  })

  describe('Toast actions', () => {
    it('should show a toast message', () => {
      const message = 'Test toast message'
      const { showToast } = useStore.getState()
      showToast(message)

      expect(useStore.getState().toast).toBe(message)
    })

    it('should clear the toast', () => {
      const { showToast, clearToast } = useStore.getState()
      showToast('Test message')
      clearToast()

      expect(useStore.getState().toast).toBeNull()
    })

    it('should handle consecutive toasts', () => {
      const { showToast } = useStore.getState()
      showToast('First message')
      expect(useStore.getState().toast).toBe('First message')

      showToast('Second message')
      expect(useStore.getState().toast).toBe('Second message')
    })
  })

  describe('Section expansion actions', () => {
    it('should toggle section expansion', () => {
      const sectionPath = '/section/1'
      const { toggleSection } = useStore.getState()

      toggleSection(sectionPath)
      expect(useStore.getState().expandedSections.has(sectionPath)).toBe(true)

      toggleSection(sectionPath)
      expect(useStore.getState().expandedSections.has(sectionPath)).toBe(false)
    })

    it('should expand a section', () => {
      const sectionPath = '/section/2'
      const { expandSection } = useStore.getState()

      expandSection(sectionPath)
      expect(useStore.getState().expandedSections.has(sectionPath)).toBe(true)
    })

    it('should handle multiple expanded sections', () => {
      const { expandSection } = useStore.getState()
      const paths = ['/section/1', '/section/2', '/section/3']

      paths.forEach((path) => expandSection(path))

      const expanded = useStore.getState().expandedSections
      paths.forEach((path) => {
        expect(expanded.has(path)).toBe(true)
      })
    })
  })

  describe('Tree management', () => {
    it('should set tree to null initially', () => {
      expect(useStore.getState().tree).toBeNull()
    })

    it('should update selected screen', () => {
      const fsPath = '/path/to/screen.tsx'
      const urlPath = '/screen'
      const { setSelectedScreen } = useStore.getState()

      setSelectedScreen(fsPath, urlPath)

      const state = useStore.getState()
      expect(state.selectedScreenPath).toBe(fsPath)
      expect(state.selectedScreenUrlPath).toBe(urlPath)
    })

    it('should clear selected screen', () => {
      const { setSelectedScreen } = useStore.getState()
      setSelectedScreen('/path', '/url')
      setSelectedScreen(null, null)

      const state = useStore.getState()
      expect(state.selectedScreenPath).toBeNull()
      expect(state.selectedScreenUrlPath).toBeNull()
    })
  })

  describe('Update ready state', () => {
    it('should set update ready', () => {
      const { setUpdateReady } = useStore.getState()
      setUpdateReady(true)

      expect(useStore.getState().updateReady).toBe(true)
    })

    it('should set updating state', () => {
      const { setIsUpdating } = useStore.getState()
      setIsUpdating(true)

      expect(useStore.getState().isUpdating).toBe(true)
    })
  })
})

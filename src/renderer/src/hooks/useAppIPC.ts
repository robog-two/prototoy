import { useEffect } from 'react'
import type { ProjectTree, PreviewState, ProjectIssue } from '../../../shared/types'

interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

interface UseAppIPCProps {
  onTreeChanged: (tree: ProjectTree) => void
  onPreviewStatus: (state: PreviewState) => void
  onProjectError: (err: { message: string; path: string }) => void
  onProjectIssues: (issues: ProjectIssue[]) => void
  onUpdateReady: () => void
  onPrepareUpdate: () => void
  onUpdateProgress: (progress: UpdateProgress) => void
}

export function useAppIPC({
  onTreeChanged,
  onPreviewStatus,
  onProjectError,
  onProjectIssues,
  onUpdateReady,
  onPrepareUpdate,
  onUpdateProgress,
}: UseAppIPCProps): void {
  useEffect(() => {
    const unsubTree = window.api.onTreeChanged(onTreeChanged)
    const unsubPreview = window.api.onPreviewStatus(onPreviewStatus)
    const unsubError = window.api.onProjectError(onProjectError)
    const unsubIssues = window.api.onProjectIssues(onProjectIssues)
    const unsubUpdateReady = window.api.onUpdateReady(onUpdateReady)
    const unsubPrepareUpdate = window.api.onPrepareUpdate(onPrepareUpdate)
    const unsubProgress = window.api.onUpdateProgress(onUpdateProgress)

    return () => {
      unsubTree()
      unsubPreview()
      unsubError()
      unsubIssues()
      unsubUpdateReady()
      unsubPrepareUpdate()
      unsubProgress()
    }
  }, [
    onTreeChanged,
    onPreviewStatus,
    onProjectError,
    onProjectIssues,
    onUpdateReady,
    onPrepareUpdate,
    onUpdateProgress,
  ])
}

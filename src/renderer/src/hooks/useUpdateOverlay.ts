import { useState } from 'react'

export interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export function useUpdateOverlay(): {
  updateProgress: UpdateProgress | null
  setUpdateProgress: (progress: UpdateProgress | null) => void
} {
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null)

  return {
    updateProgress,
    setUpdateProgress,
  }
}

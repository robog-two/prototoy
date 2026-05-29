import React, { useState, useRef } from 'react'
import type { ProjectTree } from '../../../shared/types'

export interface RecentProject {
  name: string
  path: string
  screens: number
  sections: number
  openedAt: string
}

export function useProjectPicker(onDone: (tree: ProjectTree) => void): {
  activeTab: 'recent' | 'new'
  setActiveTab: (tab: 'recent' | 'new') => void
  recents: RecentProject[]
  name: string
  setName: (name: string) => void
  description: string
  setDescription: (description: string) => void
  error: string
  setError: (error: string) => void
  nameRef: React.RefObject<HTMLInputElement | null>
  handleOpenRecent: (path: string) => Promise<void>
  handleSubmit: (e: React.SyntheticEvent) => Promise<void>
} {
  const [activeTab, setActiveTab] = useState<'recent' | 'new'>('recent')
  const [recents, setRecents] = useState<RecentProject[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    void window.api.getRecentProjects().then((projects) => {
      setRecents(projects)
      if (projects.length === 0) {
        setActiveTab('new')
      }
    })
  }, [])

  React.useEffect(() => {
    nameRef.current?.focus()
  }, [activeTab])

  async function handleOpenRecent(path: string): Promise<void> {
    const tree = await window.api.openProject(path)
    if (tree) onDone(tree)
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required')
      return
    }
    const tree = await window.api.createProject(trimmed, description.trim())
    if (tree) onDone(tree)
  }

  return {
    activeTab,
    setActiveTab,
    recents,
    name,
    setName,
    description,
    setDescription,
    error,
    setError,
    nameRef,
    handleOpenRecent,
    handleSubmit,
  }
}

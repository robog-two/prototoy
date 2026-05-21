import React, { useEffect, useState } from 'react'
import { useStore } from './store'
import Sidebar from './components/LeftSidebar/Sidebar'
import PhoneView from './components/PhoneView/PhoneView'
import type { ProjectTree, PreviewState } from '../../shared/types'

export default function App(): React.ReactElement {
  const { tree, setTree, setPreviewState, toast, clearToast, previewState } = useStore()

  useEffect(() => {
    const unsubTree = window.api.onTreeChanged((updatedTree: ProjectTree) => setTree(updatedTree))
    const unsubPreview = window.api.onPreviewStatus((state: PreviewState) =>
      setPreviewState(state)
    )
    return () => {
      unsubTree()
      unsubPreview()
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 2500)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="app-window">
      {tree && (
        <div className="titlebar">
          <div className="tl-title">{tree.config.name}</div>
          <div className="tl-right">
            {previewState?.status && (
              <span className={`status-pill ${previewState.status === 'installing' ? 'installing' : ''}`}>
                {previewState.status === 'ready' ? 'Ready' : previewState.status === 'installing' ? 'Installing…' : 'Starting…'}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="app-body">
        {tree ? (
          <>
            <Sidebar />
            <PhoneView />
          </>
        ) : (
          <ProjectPicker onDone={(tree) => setTree(tree)} />
        )}
      </div>
      {toast && <Toast message={toast} />}
    </div>
  )
}

interface RecentProject {
  name: string
  path: string
  screens: number
  sections: number
  openedAt: string
}

function ProjectPicker({ onDone }: { onDone: (tree: ProjectTree) => void }): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<'recent' | 'new'>('recent')
  const [recents, setRecents] = React.useState<RecentProject[]>([])

  React.useEffect(() => {
    window.api.getRecentProjects().then((projects) => {
      setRecents(projects)
      if (projects.length === 0) {
        setActiveTab('new')
      }
    })
  }, [])

  async function handleOpenRecent(path: string): Promise<void> {
    const tree = await window.api.openProject(path)
    if (tree) onDone(tree)
  }

  const sectionColors = ['var(--color-cyan)', 'var(--color-green)', 'var(--color-yellow)', 'var(--color-pink)']

  const getRecentSwatchColors = (index: number) => {
    return [
      sectionColors[index % 4],
      sectionColors[(index + 1) % 4],
      sectionColors[(index + 2) % 4],
      sectionColors[(index + 3) % 4]
    ]
  }

  return (
    <div className="project-picker">
      <div className="pp-drag-bar" />
      <div className="pp-content-wrapper">
        <div className="pp-header">
          <h1>Prototoy<span className="period">.</span></h1>
          <p className="pp-lede">
            An organizer for mockups, wireframes, and prototypes of mobile UIs
            created with agentic programming.
          </p>
        </div>

        {recents.length > 0 && (
          <div className="pp-tabs">
            <button
              className={`pp-tab ${activeTab === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveTab('recent')}
            >
              Recent<span className="count">{recents.length}</span>
            </button>
            <button
              className={`pp-tab ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => setActiveTab('new')}
            >
              New project
            </button>
          </div>
        )}

        <div className="pp-content">
          {activeTab === 'recent' && recents.length > 0 ? (
            <div className="recent-list">
              {recents.map((p, i) => (
                <div
                  key={p.path}
                  className="recent-item"
                  onClick={() => handleOpenRecent(p.path)}
                >
                  <div className="recent-swatch">
                    {getRecentSwatchColors(i).map((c, idx) => (
                      <span key={idx} style={{ background: c }} />
                    ))}
                  </div>
                  <div className="recent-info">
                    <div className="recent-name">{p.name}</div>
                    <div className="recent-path">{p.path}</div>
                  </div>
                  <div className="recent-meta">
                    <div><span className="stat-num">{p.screens}</span> screens · <span className="stat-num">{p.sections}</span> sections</div>
                    <div>{p.openedAt}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <NewProjectForm onDone={onDone} />
          )}
        </div>

        {recents.length > 0 && activeTab === 'recent' && (
          <div className="pp-footer">
            <button className="tb-btn" onClick={() => window.api.openProject()}>Choose folder</button>
          </div>
        )}
      </div>
    </div>
  )
}

function NewProjectForm({ onDone }: { onDone: (tree: ProjectTree) => void }): React.ReactElement {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [error, setError] = React.useState('')
  const nameRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => { nameRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Name is required'); return }
    const tree = await window.api.createProject(trimmed, description.trim())
    if (tree) onDone(tree)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div style={{ fontWeight: 'bold', fontSize: 'var(--fs-lg)' }}>Create a new project</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-60)', fontWeight: 'bold', textTransform: 'uppercase' }}>Project name</label>
        <input ref={nameRef} value={name} onChange={(e) => { setName(e.target.value); setError('') }} placeholder="My App" />
        {error && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-pink)' }}>{error}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-60)', fontWeight: 'bold', textTransform: 'uppercase' }}>Description <span style={{ color: 'var(--color-ink-50)', fontWeight: 'normal' }}>(optional)</span></label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project?" rows={2} style={{ width: '100%', resize: 'none' }} />
      </div>

      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-60)' }}>You'll choose where to save the folder next.</div>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end' }}>
        <button type="submit" className="tb-btn primary">Choose Location…</button>
      </div>
    </form>
  )
}

function Toast({ message }: { message: string }): React.ReactElement {
  return <div className="toast">{message}</div>
}

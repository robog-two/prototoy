import React, { useEffect } from 'react'
import { useStore } from './store'
import Sidebar from './components/LeftSidebar/Sidebar'
import PhoneView from './components/PhoneView/PhoneView'
import type { ProjectTree, PreviewState } from '../../shared/types'

export default function App(): React.ReactElement {
  const { tree, setTree, setPreviewState, toast, clearToast } = useStore()

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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', flexDirection: 'column' }}>
      <TitleBar projectName={tree?.config.name} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', overflow: 'hidden' }}>
          {tree ? <PhoneView /> : <Welcome />}
        </main>
      </div>
      {toast && <Toast message={toast} />}
    </div>
  )
}

function TitleBar({ projectName }: { projectName?: string }): React.ReactElement {
  return (
    <div
      style={{
        height: 'var(--titlebar-height)',
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 80,
        WebkitAppRegion: 'drag',
        flexShrink: 0,
        userSelect: 'none'
      } as React.CSSProperties}
    >
      <span style={{ color: 'var(--text-2)', fontSize: 12 }}>
        {projectName ? projectName : 'Prototoy'}
      </span>
    </div>
  )
}

function Welcome(): React.ReactElement {
  const setTree = useStore((s) => s.setTree)
  const [showNew, setShowNew] = React.useState(false)

  async function handleOpen(): Promise<void> {
    const tree = await window.api.openProject()
    if (tree) setTree(tree)
  }

  return (
    <>
      <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Prototoy</div>
        <div style={{ marginBottom: 28, fontSize: 13 }}>Organize and preview your UI mockups</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => setShowNew(true)}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            New Project
          </button>
          <button
            onClick={handleOpen}
            style={{
              background: 'var(--bg-3)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              padding: '8px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Open Project
          </button>
        </div>
      </div>
      {showNew && <NewProjectModal onDone={(tree) => { setTree(tree); setShowNew(false) }} onCancel={() => setShowNew(false)} />}
    </>
  )
}

function NewProjectModal({ onDone, onCancel }: { onDone: (tree: import('../../shared/types').ProjectTree) => void; onCancel: () => void }): React.ReactElement {
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
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, width: 360, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div style={{ fontWeight: 600, fontSize: 15 }}>New Project</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-2)' }}>Project name</label>
          <input ref={nameRef} value={name} onChange={(e) => { setName(e.target.value); setError('') }} placeholder="My App" style={{ width: '100%' }} />
          {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-2)' }}>Description <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project?" rows={2} style={{ width: '100%', resize: 'none' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>You'll choose where to save the folder next.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 7, background: 'var(--bg-3)', color: 'var(--text-2)', fontSize: 13 }}>Cancel</button>
          <button type="submit" style={{ padding: '7px 16px', borderRadius: 7, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500 }}>Choose Location…</button>
        </div>
      </form>
    </div>
  )
}

function Toast({ message }: { message: string }): React.ReactElement {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        padding: '8px 16px',
        borderRadius: 8,
        fontSize: 13,
        color: 'var(--text)',
        pointerEvents: 'none',
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
      }}
    >
      {message}
    </div>
  )
}

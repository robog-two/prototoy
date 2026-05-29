import React, { useEffect, useState } from 'react'
import { useStore } from './store'
import Sidebar from './components/LeftSidebar/Sidebar'
import PhoneView from './components/PhoneView/PhoneView'
import ProjectIssuesModal from './components/Modals/ProjectIssuesModal'
import type { ProjectTree, PreviewState } from '../../shared/types'

class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export default function App(): React.ReactElement {
  const { tree, setTree, setPreviewState, toast, clearToast, previewState, projectError, setProjectError, projectIssues, setProjectIssues, updateReady, setUpdateReady, isUpdating, setIsUpdating } = useStore()
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Electron drag-and-drop requires document-level listeners
    const handleDocumentDragover = (e: DragEvent) => {
      e.preventDefault()
      e.dataTransfer!.dropEffect = 'copy'
    }

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault()
    }

    document.addEventListener('dragover', handleDocumentDragover)
    document.addEventListener('drop', handleDocumentDrop)

    const unsubTree = window.api.onTreeChanged((updatedTree: ProjectTree) => setTree(updatedTree))
    const unsubPreview = window.api.onPreviewStatus((state: PreviewState) =>
      setPreviewState(state)
    )
    const unsubError = window.api.onProjectError((err) => setProjectError(err))
    const unsubIssues = window.api.onProjectIssues((issues) => setProjectIssues(issues))
    const unsubUpdateReady = window.api.onUpdateReady(() => setUpdateReady(true))
    const unsubPrepareUpdate = window.api.onPrepareUpdate(() => setIsUpdating(true))
    return () => {
      document.removeEventListener('dragover', handleDocumentDragover)
      document.removeEventListener('drop', handleDocumentDrop)
      unsubTree()
      unsubPreview()
      unsubError()
      unsubIssues()
      unsubUpdateReady()
      unsubPrepareUpdate()
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 2500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleStatusClick(): Promise<void> {
    const lines = await window.api.getPreviewLogs()
    setLogs(lines)
    setShowLogs(true)
  }

  function handleCloseWindow(): void {
    if (updateReady) {
      window.close()
    }
  }

  return (
    <div className="app-window">
      {tree && (
        <div className="titlebar">
          <div className="tl-title">{tree.config.name}</div>
          <div className="tl-right">
            {previewState?.status && (
              <button
                className={`status-pill ${previewState.status === 'installing' ? 'installing' : ''}`}
                onClick={handleStatusClick}
              >
                {previewState.status === 'ready' ? 'Ready' : previewState.status === 'installing' ? 'Installing…' : 'Starting…'}
              </button>
            )}
            {updateReady && (
              <button className="status-pill update-ready" onClick={handleCloseWindow}>
                Update available
              </button>
            )}
          </div>
        </div>
      )}
      <div className="app-body">
        {tree ? (
          <ErrorBoundary
            fallback={
              <PanelError
                message="An unexpected error crashed the project view."
                onDismiss={() => setTree(null)}
                dismissLabel="Back to Projects"
              />
            }
          >
            <Sidebar />
            <PhoneView />
          </ErrorBoundary>
        ) : (
          <ProjectPicker onDone={(tree) => setTree(tree)} />
        )}
      </div>
      {toast && <Toast message={toast} />}
      {showLogs && <LogPanel logs={logs} onClose={() => setShowLogs(false)} />}
      {projectError && (
        <CorruptProjectDialog
          error={projectError}
          onClose={() => setProjectError(null)}
        />
      )}
      {projectIssues && projectIssues.length > 0 && (
        <ProjectIssuesModal
          issues={projectIssues}
          onClose={() => setProjectIssues(null)}
        />
      )}
      {isUpdating && <UpdatingOverlay />}
    </div>
  )
}

function LogPanel({ logs, onClose }: { logs: string[]; onClose: () => void }): React.ReactElement {
  const bottomRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxHeight: '60vh', background: '#1a1a1a', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #333', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#aaa' }}>Vite preview logs</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, flex: 1 }}>
          {logs.length === 0 ? (
            <span style={{ color: '#555' }}>No logs yet.</span>
          ) : (
            logs.map((line, i) => {
              const isError = /error|failed|cannot/i.test(line)
              const isWarn = /warn/i.test(line)
              return (
                <div key={i} style={{ color: isError ? '#f87171' : isWarn ? '#fbbf24' : '#d4d4d4', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {line}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
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

function CorruptProjectDialog({
  error,
  onClose
}: {
  error: { message: string; path: string }
  onClose: () => void
}): React.ReactElement {
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="create-modal-backdrop" onClick={onClose}>
      <div
        className="create-modal"
        style={{ width: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-modal-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-pink)" strokeWidth="1.8" style={{ flexShrink: 0 }}>
            <path d="M8 2 L14.5 13.5 L1.5 13.5 Z" />
            <line x1="8" y1="6.5" x2="8" y2="9.5" />
            <circle cx="8" cy="11.5" r="0.6" fill="var(--color-pink)" stroke="none" />
          </svg>
          Could not open project
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <p style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--fs-sm)', color: 'var(--color-ink-80)', margin: 0 }}>
            {error.message}
          </p>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--color-ink-60)',
            padding: '5px 8px',
            background: 'var(--color-paper-2)',
            border: '1px solid var(--color-paper-3)',
            overflowWrap: 'break-word',
            wordBreak: 'break-all'
          }}>
            {error.path}
          </div>
          <p style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--fs-xs)', color: 'var(--color-ink-60)', fontStyle: 'italic', margin: 0 }}>
            If the folder was moved or deleted, choose it again from the project picker.
          </p>
        </div>

        <div className="create-modal-footer">
          <button className="create-modal-footer-btn" onClick={onClose}>Dismiss</button>
          <button
            className="create-modal-footer-btn primary"
            onClick={() => { onClose(); window.api.openProject() }}
          >
            Choose Folder…
          </button>
        </div>
      </div>
    </div>
  )
}

function PanelError({ message, onDismiss, dismissLabel }: { message: string; onDismiss: () => void; dismissLabel: string }): React.ReactElement {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-paper)',
      padding: 'var(--sp-8)'
    }}>
      <div style={{
        maxWidth: 400,
        background: 'var(--color-paper)',
        border: '2px solid var(--color-ink)',
        padding: 'var(--sp-7)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-5)',
        boxShadow: 'var(--shadow-hard)'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: 'var(--fs-lg)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-pink)" strokeWidth="1.8" style={{ flexShrink: 0 }}>
            <path d="M8 2 L14.5 13.5 L1.5 13.5 Z" />
            <line x1="8" y1="6.5" x2="8" y2="9.5" />
            <circle cx="8" cy="11.5" r="0.6" fill="var(--color-pink)" stroke="none" />
          </svg>
          Something went wrong
        </div>
        <p style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--fs-sm)', color: 'var(--color-ink-80)', margin: 0 }}>
          {message}
        </p>
        <div>
          <button className="tb-btn" onClick={onDismiss}>{dismissLabel}</button>
        </div>
      </div>
    </div>
  )
}

function Toast({ message }: { message: string }): React.ReactElement {
  return <div className="toast">{message}</div>
}

function UpdatingOverlay(): React.ReactElement {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--color-paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--sp-5)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: 'var(--fs-lg)',
          fontWeight: 'bold',
          color: 'var(--color-ink)'
        }}>
          Updating Prototoy…
        </div>
        <div style={{
          display: 'flex',
          gap: 'var(--sp-2)'
        }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-cyan)',
            animation: 'pulse 1.4s infinite'
          }} />
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-green)',
            animation: 'pulse 1.4s infinite 0.2s'
          }} />
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-yellow)',
            animation: 'pulse 1.4s infinite 0.4s'
          }} />
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}

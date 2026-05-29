import React, { useEffect, useState } from 'react'
import { useStore } from './store'
import Sidebar from './components/LeftSidebar/Sidebar'
import PhoneView from './components/PhoneView/PhoneView'
import ProjectIssuesModal from './components/Modals/ProjectIssuesModal'
import { useAppIPC, useUpdateOverlay, useProjectPicker, ErrorBoundaryComponent } from './hooks'
import type { ProjectTree, PreviewState } from '../../shared/types'
import {
  LogPanelBackdrop as StyledLogPanelBackdrop,
  LogPanelContainer as StyledLogPanelContainer,
  LogPanelHeader as StyledLogPanelHeader,
  LogPanelTitle as StyledLogPanelTitle,
  LogPanelCloseBtn as StyledLogPanelCloseBtn,
  LogPanelContent as StyledLogPanelContent,
  LogLine as StyledLogLine,
  PanelErrorContainer,
  PanelErrorBox,
  PanelErrorTitle,
  PanelErrorMessage,
  ToastContainer,
  UpdatingOverlayBackdrop,
  UpdatingOverlayBox,
  UpdatingOverlayTitle,
  UpdatingOverlayProgressBar,
  UpdatingOverlayProgressFill,
  UpdatingOverlayPercent,
  CorruptProjectDialogBackdrop,
  CorruptProjectDialogContent,
  ErrorPathBox,
  ErrorNote,
} from './styles/AppStyles'

export default function App(): React.ReactElement {
  const {
    tree,
    setTree,
    setPreviewState,
    toast,
    clearToast,
    previewState,
    projectError,
    setProjectError,
    projectIssues,
    setProjectIssues,
    updateReady,
    setUpdateReady,
    isUpdating,
    setIsUpdating,
  } = useStore()
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const { updateProgress, setUpdateProgress } = useUpdateOverlay()

  // Set up IPC listeners
  useAppIPC({
    onTreeChanged: setTree,
    onPreviewStatus: setPreviewState,
    onProjectError: setProjectError,
    onProjectIssues: setProjectIssues,
    onUpdateReady: () => setUpdateReady(true),
    onPrepareUpdate: () => setIsUpdating(true),
    onUpdateProgress: setUpdateProgress,
  })

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

    return () => {
      document.removeEventListener('dragover', handleDocumentDragover)
      document.removeEventListener('drop', handleDocumentDrop)
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
                {previewState.status === 'ready'
                  ? 'Ready'
                  : previewState.status === 'installing'
                    ? 'Installing…'
                    : 'Starting…'}
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
          <ErrorBoundaryComponent
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
          </ErrorBoundaryComponent>
        ) : (
          <ProjectPicker onDone={(tree) => setTree(tree)} />
        )}
      </div>
      {toast && <Toast message={toast} />}
      {showLogs && <LogPanel logs={logs} onClose={() => setShowLogs(false)} />}
      {projectError && (
        <CorruptProjectDialog error={projectError} onClose={() => setProjectError(null)} />
      )}
      {projectIssues && projectIssues.length > 0 && (
        <ProjectIssuesModal issues={projectIssues} onClose={() => setProjectIssues(null)} />
      )}
      {isUpdating && <UpdatingOverlay progress={updateProgress} />}
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
    <StyledLogPanelBackdrop onClick={onClose}>
      <StyledLogPanelContainer onClick={(e) => e.stopPropagation()}>
        <StyledLogPanelHeader>
          <StyledLogPanelTitle>Vite preview logs</StyledLogPanelTitle>
          <StyledLogPanelCloseBtn onClick={onClose}>×</StyledLogPanelCloseBtn>
        </StyledLogPanelHeader>
        <StyledLogPanelContent>
          {logs.length === 0 ? (
            <span style={{ color: '#555' }}>No logs yet.</span>
          ) : (
            logs.map((line, i) => {
              const isError = /error|failed|cannot/i.test(line)
              const isWarn = /warn/i.test(line)
              const color = isError ? '#f87171' : isWarn ? '#fbbf24' : '#d4d4d4'
              return (
                <StyledLogLine key={i} color={color}>
                  {line}
                </StyledLogLine>
              )
            })
          )}
          <div ref={bottomRef} />
        </StyledLogPanelContent>
      </StyledLogPanelContainer>
    </StyledLogPanelBackdrop>
  )
}

function ProjectPicker({ onDone }: { onDone: (tree: ProjectTree) => void }): React.ReactElement {
  const { activeTab, setActiveTab, recents, handleOpenRecent } = useProjectPicker(onDone)

  const sectionColors = [
    'var(--color-cyan)',
    'var(--color-green)',
    'var(--color-yellow)',
    'var(--color-pink)',
  ]

  const getRecentSwatchColors = (index: number) => {
    return [
      sectionColors[index % 4],
      sectionColors[(index + 1) % 4],
      sectionColors[(index + 2) % 4],
      sectionColors[(index + 3) % 4],
    ]
  }

  return (
    <div className="project-picker">
      <div className="pp-drag-bar" />
      <div className="pp-content-wrapper">
        <div className="pp-header">
          <h1>
            Prototoy<span className="period">.</span>
          </h1>
          <p className="pp-lede">
            An organizer for mockups, wireframes, and prototypes of mobile UIs created with agentic
            programming.
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
                <div key={p.path} className="recent-item" onClick={() => handleOpenRecent(p.path)}>
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
                    <div>
                      <span className="stat-num">{p.screens}</span> screens ·{' '}
                      <span className="stat-num">{p.sections}</span> sections
                    </div>
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
            <button className="tb-btn" onClick={() => window.api.openProject()}>
              Choose folder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function NewProjectForm({ onDone }: { onDone: (tree: ProjectTree) => void }): React.ReactElement {
  const { name, setName, description, setDescription, error, setError, nameRef, handleSubmit } =
    useProjectPicker(onDone)

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}
    >
      <div style={{ fontWeight: 'bold', fontSize: 'var(--fs-lg)' }}>Create a new project</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <label
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--color-ink-60)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          Project name
        </label>
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          placeholder="My App"
        />
        {error && (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-pink)' }}>{error}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <label
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--color-ink-60)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          Description{' '}
          <span style={{ color: 'var(--color-ink-50)', fontWeight: 'normal' }}>(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project?"
          rows={2}
          style={{ width: '100%', resize: 'none' }}
        />
      </div>

      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-60)' }}>
        You'll choose where to save the folder next.
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end' }}>
        <button type="submit" className="tb-btn primary">
          Choose Location…
        </button>
      </div>
    </form>
  )
}

function CorruptProjectDialog({
  error,
  onClose,
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
    <CorruptProjectDialogBackdrop onClick={onClose}>
      <div className="create-modal" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
        <div
          className="create-modal-header"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="var(--color-pink)"
            strokeWidth="1.8"
            style={{ flexShrink: 0 }}
          >
            <path d="M8 2 L14.5 13.5 L1.5 13.5 Z" />
            <line x1="8" y1="6.5" x2="8" y2="9.5" />
            <circle cx="8" cy="11.5" r="0.6" fill="var(--color-pink)" stroke="none" />
          </svg>
          Could not open project
        </div>

        <CorruptProjectDialogContent>
          <p
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: 'var(--fs-sm)',
              color: 'var(--color-ink-80)',
              margin: 0,
            }}
          >
            {error.message}
          </p>
          <ErrorPathBox>{error.path}</ErrorPathBox>
          <ErrorNote>
            If the folder was moved or deleted, choose it again from the project picker.
          </ErrorNote>
        </CorruptProjectDialogContent>

        <div className="create-modal-footer">
          <button className="create-modal-footer-btn" onClick={onClose}>
            Dismiss
          </button>
          <button
            className="create-modal-footer-btn primary"
            onClick={() => {
              onClose()
              window.api.openProject()
            }}
          >
            Choose Folder…
          </button>
        </div>
      </div>
    </CorruptProjectDialogBackdrop>
  )
}

function PanelError({
  message,
  onDismiss,
  dismissLabel,
}: {
  message: string
  onDismiss: () => void
  dismissLabel: string
}): React.ReactElement {
  return (
    <PanelErrorContainer>
      <PanelErrorBox>
        <PanelErrorTitle>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="var(--color-pink)"
            strokeWidth="1.8"
            style={{ flexShrink: 0 }}
          >
            <path d="M8 2 L14.5 13.5 L1.5 13.5 Z" />
            <line x1="8" y1="6.5" x2="8" y2="9.5" />
            <circle cx="8" cy="11.5" r="0.6" fill="var(--color-pink)" stroke="none" />
          </svg>
          Something went wrong
        </PanelErrorTitle>
        <PanelErrorMessage>{message}</PanelErrorMessage>
        <div>
          <button className="tb-btn" onClick={onDismiss}>
            {dismissLabel}
          </button>
        </div>
      </PanelErrorBox>
    </PanelErrorContainer>
  )
}

function Toast({ message }: { message: string }): React.ReactElement {
  return <ToastContainer>{message}</ToastContainer>
}

function UpdatingOverlay({
  progress,
}: {
  progress: { percent: number; bytesPerSecond: number; transferred: number; total: number } | null
}): React.ReactElement {
  const percent = progress?.percent ?? 0

  return (
    <UpdatingOverlayBackdrop>
      <UpdatingOverlayBox>
        <UpdatingOverlayTitle>Updating Prototoy…</UpdatingOverlayTitle>
        <UpdatingOverlayProgressBar>
          <UpdatingOverlayProgressFill percent={percent} />
        </UpdatingOverlayProgressBar>
        {progress && <UpdatingOverlayPercent>{percent}%</UpdatingOverlayPercent>}
      </UpdatingOverlayBox>
    </UpdatingOverlayBackdrop>
  )
}

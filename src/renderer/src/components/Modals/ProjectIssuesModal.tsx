import React, { useEffect, useRef, useState } from 'react'
import type { ProjectIssue } from '../../../../shared/types'

type IssueStatus = 'pending' | 'working' | 'fixed' | 'skipped' | 'error'

interface RowState {
  status: IssueStatus
  errorMessage?: string
  textValue: string
  textExpanded: boolean
}

function initStates(issues: ProjectIssue[]): Record<string, RowState> {
  return Object.fromEntries(
    issues.map((i) => [i.id, {
      status: i.repair === 'none' ? 'skipped' : 'pending',
      textValue: i.repairCurrentValue ?? '',
      textExpanded: false
    }])
  )
}

interface Props {
  issues: ProjectIssue[]
  onClose: () => void
}

export default function ProjectIssuesModal({ issues, onClose }: Props): React.ReactElement {
  const [states, setStates] = useState<Record<string, RowState>>(() => initStates(issues))

  const fixable = issues.filter((i) => i.repair !== 'none')
  const fixedCount = Object.values(states).filter((s) => s.status === 'fixed').length
  const remaining = fixable.filter((i) => states[i.id]?.status === 'pending').length

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function patch(id: string, update: Partial<RowState>): void {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...update } }))
  }

  async function runAuto(issue: ProjectIssue): Promise<void> {
    patch(issue.id, { status: 'working' })
    try {
      await window.api.repairIssueAuto(issue.kind, issue.path)
      patch(issue.id, { status: 'fixed' })
    } catch (err) {
      patch(issue.id, { status: 'error', errorMessage: err instanceof Error ? err.message : String(err) })
    }
  }

  async function runText(issue: ProjectIssue, value: string): Promise<void> {
    patch(issue.id, { status: 'working', textExpanded: false })
    try {
      await window.api.repairIssueText(issue.path, value)
      patch(issue.id, { status: 'fixed' })
    } catch (err) {
      patch(issue.id, { status: 'error', errorMessage: err instanceof Error ? err.message : String(err) })
    }
  }

  async function fixAll(): Promise<void> {
    const pending = fixable.filter((i) => states[i.id]?.status === 'pending')
    for (const issue of pending) {
      if (issue.repair === 'auto') {
        await runAuto(issue)
      }
      // text repairs need user input — skip in Fix All
    }
  }

  const hasAutoRemaining = fixable.some((i) => i.repair === 'auto' && states[i.id]?.status === 'pending')

  return (
    <div className="create-modal-backdrop" onClick={onClose}>
      <div
        className="create-modal issues-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="issues-modal-head">
          <div className="issues-modal-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-yellow)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M8 2 L14.5 13.5 L1.5 13.5 Z" />
              <line x1="8" y1="6.5" x2="8" y2="9.5" />
              <circle cx="8" cy="11.5" r="0.8" fill="var(--color-yellow)" stroke="none" />
            </svg>
            Project Issues
            <span className="issues-modal-count">{issues.length}</span>
          </div>
          <button className="issues-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Issue list */}
        <div className="issues-list">
          {issues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              state={states[issue.id]}
              onPatch={(u) => patch(issue.id, u)}
              onRunAuto={() => runAuto(issue)}
              onRunText={(v) => runText(issue, v)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="issues-modal-foot">
          <span className="issues-foot-stat">
            {fixedCount > 0 && <><span className="issues-foot-num">{fixedCount}</span> fixed</>}
            {fixedCount > 0 && remaining > 0 && ' · '}
            {remaining > 0 && <><span className="issues-foot-num">{remaining}</span> remaining</>}
            {fixedCount === 0 && remaining === 0 && <span style={{ color: 'var(--color-ink-60)' }}>All issues resolved</span>}
          </span>
          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            {hasAutoRemaining && (
              <button className="create-modal-footer-btn" onClick={fixAll}>
                Fix All Auto
              </button>
            )}
            <button className="create-modal-footer-btn primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface RowProps {
  issue: ProjectIssue
  state: RowState
  onPatch: (u: Partial<RowState>) => void
  onRunAuto: () => void
  onRunText: (value: string) => void
}

function IssueRow({ issue, state, onPatch, onRunAuto, onRunText }: RowProps): React.ReactElement {
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (state.textExpanded) textRef.current?.focus()
  }, [state.textExpanded])

  return (
    <div className={`issue-row ${state.status}`}>
      <div className="issue-row-body">
        <div className="issue-row-title">{issue.title}</div>
        <div className="issue-row-detail">{issue.detail}</div>
        <div className="issue-row-path">{issue.path}</div>

        {state.textExpanded && (
          <div className="issue-text-expand">
            <textarea
              ref={textRef}
              className="issue-text-input"
              value={state.textValue}
              onChange={(e) => onPatch({ textValue: e.target.value })}
              placeholder="Enter a description for this section…"
              rows={2}
            />
            <div className="issue-text-actions">
              <button
                className="create-modal-footer-btn"
                onClick={() => onPatch({ textExpanded: false })}
              >
                Cancel
              </button>
              <button
                className="create-modal-footer-btn primary"
                onClick={() => onRunText(state.textValue)}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="issue-row-action">
        {state.status === 'working' && (
          <span className="issue-status working">Working…</span>
        )}

        {state.status === 'fixed' && (
          <span className="issue-status fixed">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1.5,6 4.5,9 10.5,3" />
            </svg>
            Fixed
          </span>
        )}

        {state.status === 'error' && (
          <span className="issue-status error" title={state.errorMessage}>Failed</span>
        )}

        {state.status === 'pending' && issue.repair === 'auto' && (
          <button className="issue-fix-btn" onClick={onRunAuto}>Fix</button>
        )}

        {state.status === 'pending' && issue.repair === 'text' && !state.textExpanded && (
          <button
            className="issue-fix-btn"
            onClick={() => onPatch({ textExpanded: true })}
          >
            Set description…
          </button>
        )}

        {state.status === 'pending' && issue.repair === 'none' && (
          <span className="issue-status none">Cannot fix</span>
        )}
      </div>
    </div>
  )
}

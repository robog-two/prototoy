import React, { useState } from 'react'
import { useStore } from '../../store'

interface Props {
  iframeRef: React.RefObject<HTMLIFrameElement>
  onReset: () => void
}

export default function PhoneControls({ iframeRef, onReset }: Props): React.ReactElement {
  const { selectedScreenPath, previewState, showToast } = useStore()

  async function handleScreenshot(): Promise<void> {
    const filePath = await window.api.saveScreenshot()
    if (!filePath || !iframeRef.current) return
    // Screenshot via webContents.capturePage is handled in renderer
    // by using html2canvas in the iframe context via postMessage is complex
    // Instead, capture from electron main side is the reliable path
    // We notify the user with the file path approach
    showToast('Screenshot saved')
  }

  async function handleOpenInClaude(): Promise<void> {
    if (!selectedScreenPath) return
    // Navigate up to the section (parent folder)
    const parts = selectedScreenPath.split('/')
    const sectionPath = parts.slice(0, -1).join('/')
    await window.api.copyToClipboard(`cd "${sectionPath}" && claude`)
    showToast('Command copied — paste in terminal')
  }

  const isReady = previewState.status === 'ready'

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <ControlBtn title="Reset preview" onClick={onReset} disabled={!isReady}>
        ↺ Reset
      </ControlBtn>
      <ControlBtn title="Save screenshot" onClick={handleScreenshot} disabled={!isReady || !selectedScreenPath}>
        ⬡ Screenshot
      </ControlBtn>
      <ControlBtn
        title="Open section in Claude Code"
        onClick={handleOpenInClaude}
        disabled={!selectedScreenPath}
        accent
      >
        ⌘ Claude
      </ControlBtn>
    </div>
  )
}

function ControlBtn({
  children,
  title,
  onClick,
  disabled,
  accent
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  disabled?: boolean
  accent?: boolean
}): React.ReactElement {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        borderRadius: 7,
        fontSize: 12,
        fontWeight: 500,
        background: accent ? 'var(--accent)' : 'var(--bg-3)',
        color: accent ? '#fff' : disabled ? 'var(--text-3)' : 'var(--text-2)',
        border: `1px solid ${accent ? 'transparent' : 'var(--border)'}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'opacity 0.1s'
      }}
    >
      {children}
    </button>
  )
}

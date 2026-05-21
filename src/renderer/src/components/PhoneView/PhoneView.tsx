import React, { useRef, useEffect, useState } from 'react'
import { useStore } from '../../store'
import { Camera, Reload, Claude } from '../Icons'

const PHONE_W = 320
const PHONE_H = 580
const BEZEL = 11

export default function PhoneView(): React.ReactElement {
  const { previewState, selectedScreenPath, selectedScreenUrlPath } = useStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function updateScale(): void {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const totalW = PHONE_W + BEZEL * 2
      const totalH = PHONE_H + BEZEL * 2 + 40 + 44 + 28
      const s = Math.min((width - 64) / totalW, (height - 64) / totalH, 1)
      setScale(Math.max(s, 0.3))
    }
    updateScale()
    const ro = new ResizeObserver(updateScale)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (previewState.status !== 'ready' || !previewState.port || !iframeRef.current) return
    const base = `http://localhost:${previewState.port}`
    const target = selectedScreenUrlPath ? base + selectedScreenUrlPath : base
    if (iframeRef.current.src !== target) {
      iframeRef.current.src = target
    }
  }, [selectedScreenUrlPath, previewState.status, previewState.port])

  function handleReset(): void {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  async function handleScreenshot(): Promise<void> {
    const filePath = await window.api.saveScreenshot()
    if (filePath) {
      useStore.getState().showToast('Screenshot saved')
    }
  }

  async function handleOpenInClaude(): Promise<void> {
    if (!selectedScreenPath) return
    const parts = selectedScreenPath.split('/')
    const sectionPath = parts.slice(0, -1).join('/')
    await window.api.copyToClipboard(`cd "${sectionPath}" && claude`)
    useStore.getState().showToast('Command copied — paste in terminal')
  }

  const port = previewState.port
  const isLoading = previewState.status === 'installing' || previewState.status === 'starting'
  const isReady = previewState.status === 'ready' && !!port

  // Get screen name from path
  const screenName = selectedScreenPath ? selectedScreenPath.split('/').pop() : ''
  const sectionName = selectedScreenPath ? selectedScreenPath.split('/').slice(-2, -1)[0] : ''

  return (
    <div className="main">
      <div className="toolbar">
        <div className="tb-crumb">
          <span style={{ color: 'var(--color-ink-60)' }}>{sectionName}</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-screen">{screenName}</span>
        </div>
        <div className="tb-spacer" />
        <button className="tb-btn" onClick={handleReset} disabled={!isReady}>
          <Reload /> Reset
        </button>
        <button className="tb-btn" onClick={handleScreenshot} disabled={!isReady || !selectedScreenPath}>
          <Camera /> Screenshot
        </button>
        <button className="tb-btn primary" onClick={handleOpenInClaude} disabled={!selectedScreenPath}>
          <Claude /> Open in Claude Code
        </button>
      </div>

      <div
        className="stage"
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="phone-wrap">
            <div className="phone-meta">
              <span className="dim">320 × 580</span>
              <span>iPhone (custom)</span>
              <span className="dim">{screenName}.tsx</span>
            </div>
            <div className="phone">
              <div className="phone-screen">
                <div className="phone-status">
                  <span>9:41</span>
                  <div className="phone-stat-right">
                    <svg width="14" height="9" viewBox="0 0 14 9" fill="currentColor"><rect x="0" y="3" width="2" height="6"/><rect x="3" y="2" width="2" height="7"/><rect x="6" y="1" width="2" height="8"/><rect x="9" y="0" width="2" height="9"/></svg>
                    <svg width="17" height="9" viewBox="0 0 17 9" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="13" height="8" /><rect x="2" y="2" width="10" height="5" fill="currentColor"/><line x1="15" y1="3" x2="15" y2="6" /></svg>
                  </div>
                </div>
                {isLoading ? (
                  <LoadingOverlay status={previewState.status} />
                ) : isReady ? (
                  <div className="phone-iframe-container">
                    <iframe
                      ref={iframeRef}
                      title="Screen preview"
                    />
                  </div>
                ) : (
                  <EmptyState hasScreen={!!selectedScreenPath} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="preview-foot">
        <span><span className="dot" /> localhost:{port || '—'}</span>
        <span>HMR · ready</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedScreenPath || '—'}</span>
      </div>
    </div>
  )
}

function LoadingOverlay({ status }: { status: string }): React.ReactElement {
  return (
    <div style={{ width: PHONE_W, height: PHONE_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--color-paper)', color: 'var(--color-ink-60)', fontFamily: 'var(--font-text)', fontSize: 13 }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--color-paper-3)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      {status === 'installing' ? 'Setting up preview…' : 'Starting preview…'}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function EmptyState({ hasScreen }: { hasScreen: boolean }): React.ReactElement {
  return (
    <div style={{ width: PHONE_W, height: PHONE_H, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper)', color: 'var(--color-ink-60)', fontFamily: 'var(--font-text)', fontSize: 13 }}>
      {hasScreen ? 'Preview starting…' : 'Select a screen'}
    </div>
  )
}

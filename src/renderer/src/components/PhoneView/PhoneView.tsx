import React, { useRef, useEffect, useState } from 'react'
import { useStore } from '../../store'
import { Camera, VideoCamera, Reload, Claude } from '../Icons'
import AssetPreview from '../AssetPreview'
import { relative } from 'path'
import {
  BackButton,
  SectionLabel,
  StageContainer,
  PhoneScreenContainer,
  PhoneScreenInner,
  PhoneStatusBar,
  CursorIndicator,
  PreviewFooterFlex,
  PreviewFooterPath,
  LoadingOverlayContainer,
  LoadingSpinner,
  EmptyStateContainer,
} from '../../styles/PhoneViewStyles'

const PHONE_W = 292
const PHONE_H = 552
const SCALE = 1 / 0.85
const IFRAME_W = PHONE_W * SCALE
const IFRAME_H = PHONE_H * SCALE

export default function PhoneView(): React.ReactElement {
  const { previewState, selectedScreenPath, selectedScreenUrlPath, activeAsset, setActiveAsset } =
    useStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const phoneScreenRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [clicking, setClicking] = useState(false)

  useEffect(() => {
    if (previewState.status !== 'ready' || !previewState.port || !iframeRef.current) return
    const base = `http://0.0.0.0:${previewState.port}`
    const target = selectedScreenUrlPath ? base + selectedScreenUrlPath : base
    if (iframeRef.current.src !== target) {
      iframeRef.current.src = target
    }
  }, [selectedScreenUrlPath, previewState.status, previewState.port])

  const port = previewState.port
  const isLoading = previewState.status === 'installing' || previewState.status === 'starting'
  const isReady = previewState.status === 'ready' && !!port

  // The iframe is cross-origin (different localhost port), so contentDocument is null.
  // Instead, the preview server injects a script that postMessages cursor events up.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!isReady || !iframe) return

    const onMessage = (e: MessageEvent) => {
      const d = e.data
      if (!d || !d.__prototoy) return
      const screenEl = phoneScreenRef.current
      if (!screenEl) return

      if (d.type === 'leave') {
        setCursor(null)
        setClicking(false)
        return
      }

      // d.x/y are in the iframe's own CSS pixel space (unscaled).
      // The iframe has transform scale(1/SCALE) with transformOrigin top-left,
      // so visual position = iframeCoord * (1/SCALE).
      const iframeRect = iframe.getBoundingClientRect()
      const screenRect = screenEl.getBoundingClientRect()
      const visX = d.x / SCALE
      const visY = d.y / SCALE
      setCursor({
        x: iframeRect.left - screenRect.left + visX,
        y: iframeRect.top - screenRect.top + visY,
      })

      if (d.type === 'down') setClicking(true)
      else if (d.type === 'up') setClicking(false)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isReady])

  // Send normalized fractions instead of pixel coords so the main process can
  // compute the crop against the captured image's actual pixel dimensions,
  // bypassing all DPR / CSS-vs-physical-pixel ambiguity.
  function getPhoneScreenFrac() {
    const el = phoneScreenRef.current
    if (!el) return undefined
    const r = el.getBoundingClientRect()
    const vpW = window.innerWidth
    const vpH = window.innerHeight
    return {
      xFrac: r.left / vpW,
      yFrac: r.top / vpH,
      wFrac: r.width / vpW,
      hFrac: r.height / vpH,
    }
  }

  async function handleToggleRecording(): Promise<void> {
    if (isRecording) {
      setIsRecording(false)
      const filePath = await window.api.stopRecording()
      if (filePath) useStore.getState().showToast('Recording saved')
    } else {
      await window.api.startRecording(getPhoneScreenFrac())
      setIsRecording(true)
    }
  }

  function handleReset(): void {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  async function handleScreenshot(): Promise<void> {
    const filePath = await window.api.saveScreenshot(getPhoneScreenFrac())
    if (filePath) {
      useStore.getState().showToast('Screenshot saved')
    }
  }

  async function handleOpenInClaude(): Promise<void> {
    if (!selectedScreenPath) return
    const parts = selectedScreenPath.split('/')
    const sectionPath = parts.slice(0, -1).join('/')
    await window.api.copyToClipboard(`cd "${sectionPath}" && claude --model haiku`)
    useStore.getState().showToast('Command copied — paste in terminal')
  }

  // Get screen name from path
  const screenName = selectedScreenPath ? selectedScreenPath.split('/').pop() : ''
  const sectionName = selectedScreenPath ? selectedScreenPath.split('/').slice(-2, -1)[0] : ''
  const isAssetPreviewMode = !!activeAsset

  return (
    <div className="main" ref={mainRef}>
      <div className="toolbar">
        <div className="tb-crumb">
          {isAssetPreviewMode ? (
            <>
              <BackButton className="tb-btn" onClick={() => setActiveAsset(null)}>
                ← Back
              </BackButton>
              <SectionLabel>Asset</SectionLabel>
              <span className="crumb-sep">/</span>
              <span className="crumb-screen">{activeAsset.name}</span>
            </>
          ) : (
            <>
              <SectionLabel>{sectionName}</SectionLabel>
              <span className="crumb-sep">/</span>
              <span className="crumb-screen">{screenName}</span>
            </>
          )}
        </div>
        <div className="tb-spacer" />
        {!isAssetPreviewMode && (
          <>
            <button className="tb-btn" onClick={handleReset} disabled={!isReady} title="Reset">
              <Reload /> <span>Reset</span>
            </button>
            <button
              className="tb-btn"
              onClick={handleScreenshot}
              disabled={!isReady || !selectedScreenPath}
              title="Screenshot"
            >
              <Camera /> <span>Screenshot</span>
            </button>
            <button
              className={`tb-btn${isRecording ? ' recording' : ''}`}
              onClick={handleToggleRecording}
              disabled={!isReady || !selectedScreenPath}
              title={isRecording ? 'Stop recording' : 'Record GIF'}
            >
              <VideoCamera recording={isRecording} />
              <span>{isRecording ? 'Stop' : 'Record'}</span>
            </button>
            <button
              className="tb-btn primary"
              onClick={handleOpenInClaude}
              disabled={!selectedScreenPath}
              title="Open in Claude Code"
            >
              <Claude /> <span>Open in Claude Code</span>
            </button>
          </>
        )}
      </div>

      <StageContainer className="stage" ref={containerRef}>
        {isAssetPreviewMode && activeAsset ? (
          <AssetPreview asset={activeAsset} />
        ) : (
          <PhoneScreenContainer>
            <div className="phone-wrap">
              <div className="phone-meta">
                {screenName && <span className="dim">{screenName}</span>}
              </div>
              <div className="phone">
                <PhoneScreenInner className="phone-screen" ref={phoneScreenRef}>
                  <PhoneStatusBar className="phone-status">
                    <span>9:41</span>
                    <div className="phone-stat-right">
                      <svg width="14" height="9" viewBox="0 0 14 9" fill="currentColor">
                        <rect x="0" y="3" width="2" height="6" />
                        <rect x="3" y="2" width="2" height="7" />
                        <rect x="6" y="1" width="2" height="8" />
                        <rect x="9" y="0" width="2" height="9" />
                      </svg>
                      <svg
                        width="17"
                        height="9"
                        viewBox="0 0 17 9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      >
                        <rect x="0.5" y="0.5" width="13" height="8" />
                        <rect x="2" y="2" width="10" height="5" fill="currentColor" />
                        <line x1="15" y1="3" x2="15" y2="6" />
                      </svg>
                    </div>
                  </PhoneStatusBar>
                  {isLoading ? (
                    <LoadingOverlay status={previewState.status} />
                  ) : isReady ? (
                    <div className="phone-iframe-container">
                      <iframe
                        ref={iframeRef}
                        title="Screen preview"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                        style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          width: IFRAME_W,
                          height: IFRAME_H,
                          border: 'none',
                          transform: `scale(${1 / SCALE})`,
                          transformOrigin: 'top left',
                        }}
                      />
                    </div>
                  ) : (
                    <EmptyState hasScreen={!!selectedScreenPath} />
                  )}
                  {cursor && <CursorIndicator x={cursor.x} y={cursor.y} clicking={clicking} />}
                </PhoneScreenInner>
              </div>
            </div>
          </PhoneScreenContainer>
        )}
      </StageContainer>

      <div className="preview-foot">
        <span>
          <span className="dot" /> 0.0.0.0:{port || '—'}
        </span>
        <span>HMR watching</span>
        <PreviewFooterFlex />
        <PreviewFooterPath>{selectedScreenPath || '—'}</PreviewFooterPath>
      </div>
    </div>
  )
}

function LoadingOverlay({ status }: { status: string }): React.ReactElement {
  return (
    <LoadingOverlayContainer>
      <LoadingSpinner />
      {status === 'installing' ? 'Setting up preview…' : 'Starting preview…'}
    </LoadingOverlayContainer>
  )
}

function EmptyState({ hasScreen }: { hasScreen: boolean }): React.ReactElement {
  return (
    <EmptyStateContainer>{hasScreen ? 'Preview starting…' : 'Select a screen'}</EmptyStateContainer>
  )
}

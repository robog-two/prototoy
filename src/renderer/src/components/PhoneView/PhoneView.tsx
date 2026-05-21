import React, { useRef, useEffect, useState } from 'react'
import { useStore } from '../../store'
import PhoneControls from './PhoneControls'

const PHONE_W = 390
const PHONE_H = 844
const BEZEL = 16
const NOTCH_W = 120
const NOTCH_H = 32

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
      const totalH = PHONE_H + BEZEL * 2 + 60 + 80
      const s = Math.min((width - 64) / totalW, (height - 64) / totalH, 1)
      setScale(Math.max(s, 0.3))
    }
    updateScale()
    const ro = new ResizeObserver(updateScale)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Navigate iframe to the selected screen's URL whenever selection or readiness changes
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

  const port = previewState.port
  const isLoading = previewState.status === 'installing' || previewState.status === 'starting'
  const isReady = previewState.status === 'ready' && !!port

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <PhoneBezel>
          {isLoading ? (
            <LoadingOverlay status={previewState.status} />
          ) : isReady ? (
            <iframe
              ref={iframeRef}
              style={{
                width: PHONE_W,
                height: PHONE_H,
                border: 'none',
                display: 'block',
                borderRadius: 4
              }}
              title="Screen preview"
            />
          ) : (
            <EmptyState hasScreen={!!selectedScreenPath} />
          )}
        </PhoneBezel>
        <PhoneControls iframeRef={iframeRef} onReset={handleReset} />
      </div>
    </div>
  )
}

function PhoneBezel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      style={{
        width: PHONE_W + BEZEL * 2,
        height: PHONE_H + BEZEL * 2,
        background: '#111',
        borderRadius: 52,
        padding: BEZEL,
        boxShadow: '0 0 0 2px #333, 0 24px 80px rgba(0,0,0,0.7)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: BEZEL,
          left: '50%',
          transform: 'translateX(-50%)',
          width: NOTCH_W,
          height: NOTCH_H,
          background: '#111',
          borderRadius: '0 0 20px 20px',
          zIndex: 10
        }}
      />
      <div
        style={{
          width: PHONE_W,
          height: PHONE_H,
          borderRadius: 40,
          overflow: 'hidden',
          background: '#f5f5f5',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  )
}

function LoadingOverlay({ status }: { status: string }): React.ReactElement {
  return (
    <div style={{ width: PHONE_W, height: PHONE_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#f5f5f5', color: '#888', fontFamily: 'system-ui', fontSize: 13 }}>
      <div style={{ width: 24, height: 24, border: '2px solid #ddd', borderTopColor: '#007aff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      {status === 'installing' ? 'Setting up preview…' : 'Starting preview…'}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function EmptyState({ hasScreen }: { hasScreen: boolean }): React.ReactElement {
  return (
    <div style={{ width: PHONE_W, height: PHONE_H, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#aaa', fontFamily: 'system-ui', fontSize: 13 }}>
      {hasScreen ? 'Preview starting…' : 'Select a screen'}
    </div>
  )
}

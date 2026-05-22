import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import type { AssetNode } from '../../../shared/types'

interface Props {
  asset: AssetNode
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'])
const FONT_EXTS = new Set(['ttf', 'otf', 'woff', 'woff2'])
const TEXT_EXTS = new Set(['svg', 'css', 'js', 'json', 'html', 'md', 'txt', 'jsx', 'tsx', 'ts'])

export default function AssetPreview({ asset }: Props): React.ReactElement {
  const { setActiveAsset } = useStore()
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showSourceEdit, setShowSourceEdit] = useState(false)
  const [filePath, setFilePath] = useState('')

  const ext = asset.name.split('.').pop()?.toLowerCase() ?? ''
  const isImage = IMAGE_EXTS.has(ext)
  const isFont = FONT_EXTS.has(ext)
  const isText = TEXT_EXTS.has(ext)
  const isSvg = ext === 'svg'

  useEffect(() => {
    ;(async () => {
      const path = await window.api.getAssetPath(asset.relPath)
      setFilePath(path)
      if (isText && !isImage) {
        setContent(await window.api.readAssetText(asset.relPath))
      }
    })()
  }, [asset, isText, isImage])

  async function handleSaveText(): Promise<void> {
    await window.api.writeAssetText(asset.relPath, content)
    setDirty(false)
  }

  function handleWheel(e: React.WheelEvent): void {
    if (!isImage || showSourceEdit) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(10, scale * delta))
    setScale(newScale)
  }

  function handleMouseDown(e: React.MouseEvent): void {
    if (!isImage || showSourceEdit) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  function handleMouseMove(e: React.MouseEvent): void {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  function handleMouseUp(): void {
    setIsDragging(false)
  }

  function handleResetZoom(): void {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  if (isSvg && (isImage || showSourceEdit)) {
    if (showSourceEdit) {
      return (
        <div className="asset-preview-stage" style={{ flexDirection: 'column' }}>
          <textarea
            className="asset-text-view"
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setDirty(true)
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                handleSaveText()
              }
            }}
          />
        </div>
      )
    }
    return (
      <div
        className="asset-preview-stage"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src={filePath}
          alt={asset.name}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            userSelect: 'none'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    )
  }

  if (isImage) {
    return (
      <div
        className="asset-preview-stage"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src={filePath}
          alt={asset.name}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            userSelect: 'none'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    )
  }

  if (isFont) {
    const fontFamilyName = `custom-font-${asset.relPath.replace(/[^a-z0-9]/gi, '-')}`
    return (
      <>
        <style>{`
          @font-face {
            font-family: '${fontFamilyName}';
            src: url('${filePath}');
          }
        `}</style>
        <div
          className="asset-font-view"
          style={{
            padding: 'var(--sp-8)',
            overflow: 'auto',
            fontFamily: fontFamilyName
          }}
        >
        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <h3 style={{ marginBottom: 'var(--sp-4)', fontFamily: 'var(--font-display)' }}>
            {asset.name}
          </h3>
        </div>
        <div style={{ fontSize: '16px', marginBottom: 'var(--sp-8)', lineHeight: 1.6 }}>
          <div>
            <strong style={{ fontFamily: 'var(--font-display)' }}>16px</strong> The quick brown fox jumps over the lazy
            dog
          </div>
          <div style={{ fontSize: '24px', marginTop: 'var(--sp-6)' }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>24px</strong> The quick brown fox jumps over the lazy
            dog
          </div>
          <div style={{ fontSize: '48px', marginTop: 'var(--sp-6)' }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>48px</strong> The quick brown fox
          </div>
          <div style={{ fontSize: '14px', marginTop: 'var(--sp-6)', letterSpacing: '0.05em' }}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
          </div>
          <div style={{ fontSize: '14px', marginTop: 'var(--sp-4)' }}>0123456789 !@#$%^&amp;*()_+-=[]{}|;:&quot;,&lt;&gt;?</div>
        </div>
      </div>
      </>
    )
  }

  if (isText) {
    return (
      <div className="asset-preview-stage" style={{ flexDirection: 'column' }}>
        <textarea
          className="asset-text-view"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setDirty(true)
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault()
              handleSaveText()
            }
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="asset-preview-stage"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-6)',
        padding: 'var(--sp-8)'
      }}
    >
      <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 'bold' }}>{asset.name}</div>
      <div style={{ fontSize: 'var(--fs-md)', color: 'var(--color-ink-60)' }}>
        {asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : 'Unknown size'}
      </div>
      <button
        onClick={() => {
          const filePath = filePath.replace('file://', '')
          window.api.copyToClipboard(filePath)
        }}
        style={{
          padding: 'var(--sp-4) var(--sp-6)',
          border: '1.5px solid var(--color-ink)',
          background: 'var(--color-paper)',
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-sm)'
        }}
      >
        Copy path
      </button>
    </div>
  )
}

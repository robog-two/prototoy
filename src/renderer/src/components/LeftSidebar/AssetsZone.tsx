import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store'

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'])
const FONT_EXTS = new Set(['ttf', 'otf', 'woff', 'woff2'])

function fileTypeThumb(name: string): { text: string; bg: string } {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return { text: 'IMG', bg: 'var(--color-paper-3)' }
  if (FONT_EXTS.has(ext)) return { text: 'FONT', bg: 'var(--color-paper-3)' }
  return { text: ext.toUpperCase() || 'FILE', bg: 'var(--color-paper-3)' }
}

function getFileSize(name: string): string {
  return '—'
}

export default function AssetsZone(): React.ReactElement {
  const { showToast } = useStore()
  const [assets, setAssets] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const dragCounter = useRef(0)

  useEffect(() => {
    window.api.listAssets().then(setAssets)
  }, [])

  async function handleImportClick(): Promise<void> {
    const names = await window.api.importAssets()
    if (names.length > 0) {
      setAssets((prev) => [...new Set([...prev, ...names])])
      showToast(`${names.length} asset${names.length > 1 ? 's' : ''} imported`)
    }
  }

  function handleDragEnter(e: React.DragEvent): void {
    e.preventDefault()
    dragCounter.current++
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent): void {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragOver(false)
  }

  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  async function handleDrop(e: React.DragEvent): Promise<void> {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)

    const paths: string[] = []
    for (const item of Array.from(e.dataTransfer.items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file && (file as any).path) paths.push((file as any).path)
      }
    }
    if (paths.length === 0) return

    const names = await window.api.dropAssets(paths)
    if (names.length > 0) {
      setAssets((prev) => [...new Set([...prev, ...names])])
      showToast(`${names.length} asset${names.length > 1 ? 's' : ''} added`)
    }
  }

  async function handleDeleteAsset(name: string): Promise<void> {
    await window.api.deleteAsset(name)
    setAssets((prev) => prev.filter((a) => a !== name))
    showToast('Asset removed')
  }

  return (
    <div className="sb-assets">
      <div className="sb-assets-head">
        <span>Art assets</span>
        <span className="count">{assets.length}</span>
      </div>

      <div
        className={`sb-drop ${dragOver ? 'active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleImportClick}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>↓</span>
        {dragOver ? 'drop to import' : 'drop images, svgs, fonts…'}
      </div>

      {assets.length > 0 && (
        <div className="sb-assets-list">
          {assets.map((name) => {
            const thumb = fileTypeThumb(name)
            return (
              <div key={name} className="sb-asset">
                <span className="sb-asset-thumb" style={{ background: thumb.bg }}>
                  {thumb.text}
                </span>
                <span className="sb-asset-name">{name}</span>
                <span className="sb-asset-size">—</span>
                <button
                  className="sb-asset-x"
                  aria-label="Remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAsset(name)
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

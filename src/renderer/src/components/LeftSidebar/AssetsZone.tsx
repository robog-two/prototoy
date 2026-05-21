import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store'

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'])

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return '🖼'
  if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return '𝐀'
  return '◻'
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

  return (
    <div style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 12px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span style={{ fontSize: 10, color: 'var(--text-3)', width: 10, flexShrink: 0 }}>
          {expanded ? '▾' : '▸'}
        </span>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 4 }}>
          Assets
        </span>
        <button
          title="Import assets"
          onClick={(e) => { e.stopPropagation(); handleImportClick() }}
          style={{
            width: 18,
            height: 18,
            borderRadius: 3,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-3)'
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-3)')}
        >
          +
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '0 10px 8px' }}>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleImportClick}
            style={{
              border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 6,
              padding: assets.length === 0 ? '12px 8px' : '6px 8px',
              cursor: 'pointer',
              background: dragOver ? 'rgba(0,122,255,0.06)' : 'transparent',
              transition: 'border-color 0.15s, background 0.15s'
            }}
          >
            {assets.length === 0 ? (
              <div style={{ textAlign: 'center', color: dragOver ? 'var(--accent)' : 'var(--text-3)', fontSize: 11, lineHeight: 1.5 }}>
                {dragOver ? 'Drop to import' : 'Drop assets here\nor click to browse'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {assets.map((name) => (
                  <div
                    key={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      color: 'var(--text-2)',
                      padding: '1px 0'
                    }}
                  >
                    <span style={{ fontSize: 10, flexShrink: 0 }}>{fileIcon(name)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  </div>
                ))}
                {dragOver && (
                  <div style={{ fontSize: 11, color: 'var(--accent)', paddingTop: 2 }}>Drop to add more</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

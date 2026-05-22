import React from 'react'
import { useStore } from '../../store'
import type { AssetNode } from '../../../../shared/types'

interface Props {
  node: AssetNode
  depth: number
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'])
const FONT_EXTS = new Set(['ttf', 'otf', 'woff', 'woff2'])

function getThumbText(type: AssetNode['type'], name: string): string {
  const ext = name.split('.').pop()?.toUpperCase() ?? 'FILE'
  if (type === 'image') return 'IMG'
  if (type === 'font') return 'FONT'
  if (type === 'text') return 'TXT'
  return ext
}

function getThumbColor(type: AssetNode['type']): string {
  if (type === 'image') return 'var(--color-cyan)'
  if (type === 'font') return 'var(--color-green)'
  if (type === 'text') return 'var(--color-yellow)'
  return 'var(--color-paper-3)'
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function AssetFileNode({ node, depth }: Props): React.ReactElement {
  const { activeAsset, setActiveAsset } = useStore()

  async function handleDeleteAsset(): Promise<void> {
    await window.api.deleteAsset(node.relPath)
    const updated = await window.api.listAssetsTree()
    if (updated) {
      useStore.getState().setAssetTree(updated)
    }
  }

  const isSelected = activeAsset?.relPath === node.relPath
  const thumbText = getThumbText(node.type, node.name)
  const thumbColor = getThumbColor(node.type)

  return (
    <div
      className={`tr-row ${isSelected ? 'asset-selected' : ''}`}
      style={{ paddingLeft: `${12 + depth * 14}px` }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/asset-relpath', node.relPath)
      }}
      onClick={() => setActiveAsset(node)}
    >
      <span className="tr-indent" />
      <span
        className="sb-asset-thumb"
        style={{ background: thumbColor, color: 'var(--color-ink)', fontSize: '9px' }}
      >
        {thumbText}
      </span>
      <span className="tr-label" style={{ flex: 1, minWidth: 0 }}>
        {node.name}
      </span>
      <span className="sb-asset-size">{formatFileSize(node.size)}</span>
      <button
        className="sb-asset-x"
        aria-label="Delete"
        onClick={(e) => {
          e.stopPropagation()
          handleDeleteAsset()
        }}
      >
        ×
      </button>
    </div>
  )
}

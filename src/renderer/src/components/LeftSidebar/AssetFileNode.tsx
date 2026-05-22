import React from 'react'
import { useStore } from '../../store'
import { File } from '../Icons'
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
  const indentLeft = 12 + depth * 14

  async function handleDeleteAsset(): Promise<void> {
    await window.api.deleteAsset(node.relPath)
    const updated = await window.api.listAssetsTree()
    if (updated) {
      useStore.getState().setAssetTree(updated)
    }
  }

  const isSelected = activeAsset?.relPath === node.relPath

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/asset-relpath', node.relPath)
      }}
      onClick={() => setActiveAsset(node)}
      className={`tr-row ${isSelected ? 'selected' : ''}`}
      style={{ paddingLeft: indentLeft }}
    >
      <span className="tr-indent" />
      <span className="tr-icon">
        <File />
      </span>
      <span className="tr-label">{node.name}</span>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-50)', flexShrink: 0 }}>
        {formatFileSize(node.size)}
      </span>
      <div className="tr-right" onClick={(e) => e.stopPropagation()}>
        <button
          className="tr-icon-btn"
          title="Delete asset"
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteAsset()
          }}
          style={{ color: 'var(--color-pink)' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

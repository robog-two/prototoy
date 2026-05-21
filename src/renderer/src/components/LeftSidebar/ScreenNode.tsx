import React, { useState } from 'react'
import { useStore } from '../../store'
import type { ScreenNode as ScreenNodeType } from '../../../../shared/types'

interface Props {
  node: ScreenNodeType
  depth: number
  projectPath: string
}

export default function ScreenNode({ node, depth, projectPath }: Props): React.ReactElement {
  const { selectedScreenPath, setSelectedScreen, setTree } = useStore()
  const isSelected = selectedScreenPath === node.path
  const [hovered, setHovered] = useState(false)

  async function handleSelect(): Promise<void> {
    const urlPath = await window.api.selectScreen(node.path)
    setSelectedScreen(node.path, urlPath)
  }

  async function handleDelete(): Promise<void> {
    if (!confirm(`Delete screen "${node.name}"?`)) return
    await window.api.deleteNode(node.path)
    const updated = await window.api.getTree()
    if (updated) setTree(updated)
  }

  function handleDragStart(e: React.DragEvent): void {
    e.dataTransfer.setData('text/path', node.path)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: `4px 12px 4px ${12 + depth * 14 + 14}px`,
        cursor: 'pointer',
        background: isSelected ? 'rgba(0,122,255,0.2)' : hovered ? 'var(--bg-hover)' : 'transparent',
        userSelect: 'none'
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isSelected ? 'var(--accent)' : 'var(--text-3)',
          flexShrink: 0,
          marginRight: 8
        }}
      />
      <span
        style={{
          flex: 1,
          fontSize: 12,
          color: isSelected ? 'var(--accent)' : 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {node.name}
      </span>
      {hovered && (
        <button
          title="Delete screen"
          onClick={(e) => { e.stopPropagation(); handleDelete() }}
          style={{
            width: 18,
            height: 18,
            borderRadius: 3,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-3)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)')}
        >
          ✕
        </button>
      )}
    </div>
  )
}

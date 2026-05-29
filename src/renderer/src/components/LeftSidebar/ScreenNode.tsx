import React, { useState } from 'react'
import { useStore } from '../../store'
import { Screen } from '../Icons'
import type { ScreenNode as ScreenNodeType } from '../../../../shared/types'

interface Props {
  node: ScreenNodeType
  depth: number
  projectPath: string
}

export default function ScreenNode({ node, depth, projectPath }: Props): React.ReactElement {
  const { selectedScreenPath, setSelectedScreen, setTree } = useStore()
  const isSelected = selectedScreenPath === node.path

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
      onClick={handleSelect}
      className={`tr-row ${isSelected ? 'selected' : ''}`}
      style={{ paddingLeft: 12 + depth * 14 + 14 }}
    >
      <span className="tr-indent" />
      <span className="tr-icon">
        <Screen />
      </span>
      <span className="tr-label">{node.name}</span>
      <div className="tr-right" onClick={(e) => e.stopPropagation()}>
        <button
          className="tr-icon-btn"
          title="Delete screen"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          style={{ color: 'var(--color-pink)' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

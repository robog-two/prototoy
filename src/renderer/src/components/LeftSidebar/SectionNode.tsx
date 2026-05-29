import React, { useState } from 'react'
import { useStore } from '../../store'
import { Folder, Chevron, Claude, Plus } from '../Icons'
import type { SectionNode as SectionNodeType } from '../../../../shared/types'

interface Props {
  node: SectionNodeType
  depth: number
  projectPath: string
  onCreating: (c: { type: 'screen' | 'section'; parentPath: string }) => void
  color?: string
  children?: React.ReactNode
}

export default function SectionNode({
  node,
  depth,
  projectPath,
  onCreating,
  color,
  children,
}: Props): React.ReactElement {
  const { expandedSections, toggleSection, showToast, setTree } = useStore()
  const isExpanded = expandedSections.has(node.path)
  const [dragOver, setDragOver] = useState(false)

  async function handleOpenInClaude(): Promise<void> {
    await window.api.copyToClipboard(`cd "${node.path}" && claude`)
    showToast('Command copied to clipboard')
  }

  async function handleDelete(): Promise<void> {
    if (!confirm(`Delete section "${node.name}" and all its contents?`)) return
    await window.api.deleteNode(node.path)
    const updated = await window.api.getTree()
    if (updated) setTree(updated)
  }

  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  async function handleDrop(e: React.DragEvent): Promise<void> {
    e.preventDefault()
    setDragOver(false)
    const srcPath = e.dataTransfer.getData('text/path')
    if (!srcPath || srcPath === node.path) return
    await window.api.moveNode(srcPath, node.path)
    const updated = await window.api.getTree()
    if (updated) setTree(updated)
  }

  const indentLeft = 12 + depth * 14

  return (
    <div>
      <div
        className={`tr-row section-selected`}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          paddingLeft: indentLeft,
          background: dragOver ? 'rgba(0,194,234,0.15)' : 'transparent',
          position: 'relative',
        }}
        onClick={() => toggleSection(node.path)}
      >
        {color && <span className="section-tab" style={{ background: color }} />}
        <span className="tr-chevron" style={{ marginLeft: -6 }}>
          {isExpanded ? '▾' : '▸'}
        </span>
        <span className="tr-icon">
          <Folder open={isExpanded} />
        </span>
        <span className="tr-label">{node.name}</span>
        <div className="tr-right" onClick={(e) => e.stopPropagation()}>
          <button
            className="tr-icon-btn"
            title="New screen"
            onClick={() => onCreating({ type: 'screen', parentPath: node.path })}
          >
            <Plus />
          </button>
          <button className="tr-icon-btn" title="Open in Claude Code" onClick={handleOpenInClaude}>
            <Claude />
          </button>
          <button
            className="tr-icon-btn"
            title="Delete section"
            onClick={handleDelete}
            style={{ color: 'var(--color-pink)' }}
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && node.description && (
        <div className="tr-desc" style={{ paddingLeft: indentLeft + 14 }}>
          {node.description}
        </div>
      )}

      {isExpanded && (
        <div>
          {children}
          {node.children.length === 0 && (
            <div
              style={{
                padding: `4px 12px 4px ${indentLeft + 14}px`,
                fontSize: 'var(--fs-xs)',
                color: 'var(--color-ink-60)',
              }}
            >
              Empty section
            </div>
          )}
        </div>
      )}

      {dragOver && (
        <div style={{ position: 'relative', height: 0 }}>
          <div className="drop-line" />
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { useStore } from '../../store'
import type { SectionNode as SectionNodeType } from '../../../../shared/types'

interface Props {
  node: SectionNodeType
  depth: number
  projectPath: string
  onCreating: (c: { type: 'screen' | 'section'; parentPath: string }) => void
  children?: React.ReactNode
}

export default function SectionNode({ node, depth, projectPath, onCreating, children }: Props): React.ReactElement {
  const { expandedSections, toggleSection, showToast, setTree } = useStore()
  const isExpanded = expandedSections.has(node.path)
  const [dragOver, setDragOver] = useState(false)
  const [hovered, setHovered] = useState(false)

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

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: `4px 12px 4px ${12 + depth * 14}px`,
          cursor: 'pointer',
          background: dragOver ? 'rgba(0,122,255,0.15)' : hovered ? 'var(--bg-hover)' : 'transparent',
          borderRadius: dragOver ? 4 : 0,
          userSelect: 'none'
        }}
        onClick={() => toggleSection(node.path)}
      >
        <span style={{ fontSize: 10, color: 'var(--text-3)', width: 10, textAlign: 'center', flexShrink: 0 }}>
          {isExpanded ? '▾' : '▸'}
        </span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        {hovered && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <IconBtn title="New screen" onClick={() => { onCreating({ type: 'screen', parentPath: node.path }); }}>+</IconBtn>
            <IconBtn title="New section" onClick={() => { onCreating({ type: 'section', parentPath: node.path }); }}>⊕</IconBtn>
            <IconBtn title="Open in Claude Code" onClick={handleOpenInClaude}>⌘</IconBtn>
            <IconBtn title="Delete section" danger onClick={handleDelete}>✕</IconBtn>
          </div>
        )}
      </div>

      {isExpanded && node.description && (
        <div
          style={{
            padding: `2px 12px 6px ${12 + depth * 14 + 14}px`,
            fontSize: 11,
            color: 'var(--text-3)',
            lineHeight: 1.4
          }}
        >
          {node.description}
        </div>
      )}

      {isExpanded && (
        <div>
          {children}
          {node.children.length === 0 && (
            <div style={{ padding: `4px 12px 4px ${12 + (depth + 1) * 14}px`, fontSize: 11, color: 'var(--text-3)' }}>
              Empty section
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IconBtn({
  children,
  title,
  onClick,
  danger
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  danger?: boolean
}): React.ReactElement {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 18,
        height: 18,
        borderRadius: 3,
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hov ? (danger ? 'var(--danger)' : 'var(--text)') : 'var(--text-3)',
        background: hov ? 'var(--bg-3)' : 'transparent'
      }}
    >
      {children}
    </button>
  )
}

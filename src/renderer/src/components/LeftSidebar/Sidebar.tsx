import React, { useState } from 'react'
import { useStore } from '../../store'
import SectionNode from './SectionNode'
import ScreenNode from './ScreenNode'
import CreateModal from '../Modals/CreateModal'
import AssetsZone from './AssetsZone'
import type { TreeNode } from '../../../../shared/types'

export default function Sidebar(): React.ReactElement {
  const { tree, setTree, previewState } = useStore()
  const [creating, setCreating] = useState<{ type: 'screen' | 'section'; parentPath: string } | null>(null)
  const [filterText, setFilterText] = useState('')

  async function handleCreated(): Promise<void> {
    const updated = await window.api.getTree()
    if (updated) setTree(updated)
    setCreating(null)
  }

  const statusLabel =
    previewState.status === 'installing'
      ? 'Installing preview...'
      : previewState.status === 'starting'
        ? 'Starting preview...'
        : previewState.status === 'error'
          ? 'Preview error'
          : null

  function filterNode(node: TreeNode, query: string): boolean {
    const lowerQuery = query.toLowerCase()
    return node.name.toLowerCase().includes(lowerQuery) ||
           (node.children && node.children.some(child => filterNode(child, query)))
  }

  function renderFilteredNodes(nodes: TreeNode[], depth: number) {
    return nodes
      .filter(node => !filterText || filterNode(node, filterText))
      .map((node, index) => (
        <NodeRenderer
          key={node.path}
          node={node}
          depth={depth}
          projectPath={tree?.projectPath || ''}
          onCreating={setCreating}
          sectionIndex={index}
        />
      ))
  }

  const screenCount = tree?.children.reduce((acc, section) => acc + section.children.length, 0) || 0
  const sectionCount = tree?.children.length || 0

  return (
    <aside className="sidebar">
      <div className="sb-head">
        <div className="proj-name">{tree?.config.name || 'Prototoy'}</div>
        {tree && <div className="proj-path">{tree.projectPath}</div>}
      </div>

      {statusLabel && (
        <div style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--fs-xs)', color: 'var(--color-ink-60)', borderBottom: '1px solid var(--color-paper-3)', flexShrink: 0 }}>
          {statusLabel}
        </div>
      )}

      {tree && <AssetsZone />}

      <div className="sb-tree-head">
        <span>Screens</span>
        <span className="count">{screenCount} / {sectionCount} collections</span>
      </div>

      <div className="sb-toolbar">
        <button
          className="sb-tool-btn"
          onClick={() => setCreating({ type: 'screen', parentPath: tree?.projectPath || '' })}
        >
          <span className="plus">+</span> Screen
        </button>
        <button
          className="sb-tool-btn"
          onClick={() => setCreating({ type: 'section', parentPath: tree?.projectPath || '' })}
        >
          <span className="plus">+</span> Collection
        </button>
      </div>

      <div className="sb-search">
        <input
          type="text"
          placeholder="filter screens…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>

      <div className="sb-tree">
        {tree && renderFilteredNodes(tree.children, 0)}
      </div>

      <div className="sb-foot">
        <span>{screenCount} screens · {sectionCount} collections</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, background: 'var(--color-green)', border: '1px solid var(--color-ink)' }} />
          watching
        </span>
      </div>

      {creating && (
        <CreateModal
          type={creating.type}
          parentPath={creating.parentPath}
          onCreated={handleCreated}
          onCancel={() => setCreating(null)}
        />
      )}
    </aside>
  )
}

function NodeRenderer({
  node,
  depth,
  projectPath,
  onCreating,
  sectionIndex = 0
}: {
  node: TreeNode
  depth: number
  projectPath: string
  onCreating: (c: { type: 'screen' | 'section'; parentPath: string }) => void
  sectionIndex?: number
}): React.ReactElement {
  if (node.type === 'screen') {
    return <ScreenNode node={node} depth={depth} projectPath={projectPath} />
  }

  // Get color for section based on its index
  const sectionColors = ['var(--color-cyan)', 'var(--color-green)', 'var(--color-yellow)', 'var(--color-pink)']
  const color = sectionColors[sectionIndex % 4]

  return (
    <SectionNode
      node={node}
      depth={depth}
      projectPath={projectPath}
      onCreating={onCreating}
      color={color}
    >
      {node.children.map((child) => (
        <NodeRenderer
          key={child.path}
          node={child}
          depth={depth + 1}
          projectPath={projectPath}
          onCreating={onCreating}
          sectionIndex={sectionIndex}
        />
      ))}
    </SectionNode>
  )
}

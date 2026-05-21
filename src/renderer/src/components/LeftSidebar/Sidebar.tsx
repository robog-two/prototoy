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

  async function handleOpenProject(): Promise<void> {
    const result = await window.api.openProject()
    if (result) setTree(result)
  }

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

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0
        }}
      >
        {tree ? (
          <>
            <span style={{ flex: 1, fontWeight: 500, fontSize: 12, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tree.config.name}
            </span>
            <AddButton
              title="New screen"
              onClick={() => setCreating({ type: 'screen', parentPath: tree.projectPath })}
            />
            <AddButton
              title="New section"
              icon="folder"
              onClick={() => setCreating({ type: 'section', parentPath: tree.projectPath })}
            />
          </>
        ) : (
          <button
            onClick={handleOpenProject}
            style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 500 }}
          >
            Open Project…
          </button>
        )}
      </div>

      {statusLabel && (
        <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {statusLabel}
        </div>
      )}

      {tree && <AssetsZone />}

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {tree?.children.map((node) => (
          <NodeRenderer
            key={node.path}
            node={node}
            depth={0}
            projectPath={tree.projectPath}
            onCreating={setCreating}
          />
        ))}
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
  onCreating
}: {
  node: TreeNode
  depth: number
  projectPath: string
  onCreating: (c: { type: 'screen' | 'section'; parentPath: string }) => void
}): React.ReactElement {
  if (node.type === 'screen') {
    return <ScreenNode node={node} depth={depth} projectPath={projectPath} />
  }
  return (
    <SectionNode node={node} depth={depth} projectPath={projectPath} onCreating={onCreating}>
      {node.children.map((child) => (
        <NodeRenderer
          key={child.path}
          node={child}
          depth={depth + 1}
          projectPath={projectPath}
          onCreating={onCreating}
        />
      ))}
    </SectionNode>
  )
}

function AddButton({
  title,
  icon = 'screen',
  onClick
}: {
  title: string
  icon?: string
  onClick: () => void
}): React.ReactElement {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 22,
        height: 22,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-2)',
        fontSize: 16,
        lineHeight: 1
      }}
      onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
    >
      {icon === 'folder' ? '⊕' : '+'}
    </button>
  )
}

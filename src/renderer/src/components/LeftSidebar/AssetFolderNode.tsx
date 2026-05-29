import React, { useState } from 'react'
import { useStore } from '../../store'
import { Folder, Plus } from '../Icons'
import AssetFileNode from './AssetFileNode'
import type { AssetNode } from '../../../../shared/types'

interface Props {
  node: AssetNode
  depth: number
}

export default function AssetFolderNode({ node, depth }: Props): React.ReactElement {
  const { expandedAssetFolders, toggleAssetFolder } = useStore()
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [dragOverFolder, setDragOverFolder] = useState(false)

  const isExpanded = expandedAssetFolders.has(node.relPath)
  const indentLeft = 12 + depth * 14

  async function handleCreateFolder(): Promise<void> {
    if (!newFolderName.trim()) return
    const newRelPath = node.relPath ? `${node.relPath}/${newFolderName}` : newFolderName
    await window.api.createAssetFolder(newRelPath)
    const updated = await window.api.listAssetsTree()
    if (updated) {
      useStore.getState().setAssetTree(updated)
    }
    setNewFolderName('')
    setShowNewFolderInput(false)
  }

  async function handleDeleteFolder(): Promise<void> {
    if (!confirm(`Delete folder "${node.name}" and all its contents?`)) return
    await window.api.deleteAsset(node.relPath)
    const updated = await window.api.listAssetsTree()
    if (updated) {
      useStore.getState().setAssetTree(updated)
    }
  }

  async function handleDrop(e: React.DragEvent): Promise<void> {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolder(false)

    const assetRelPath = e.dataTransfer.getData('text/asset-relpath')
    if (assetRelPath) {
      await window.api.moveAsset(assetRelPath, node.relPath)
      const updated = await window.api.listAssetsTree()
      if (updated) {
        useStore.getState().setAssetTree(updated)
      }
    } else {
      const files = Array.from(e.dataTransfer.items)
        .filter((item) => item.kind === 'file')
        .map((item) => (item.getAsFile() as any).path)
        .filter(Boolean)

      if (files.length > 0) {
        await window.api.dropAssets(files, node.relPath)
        const updated = await window.api.listAssetsTree()
        if (updated) {
          useStore.getState().setAssetTree(updated)
        }
      }
    }
  }

  return (
    <div>
      <div
        className="tr-row"
        style={{
          paddingLeft: indentLeft,
          background: dragOverFolder ? 'rgba(0,194,234,0.15)' : 'transparent',
          position: 'relative',
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOverFolder(true)
        }}
        onDragLeave={() => setDragOverFolder(false)}
        onDrop={handleDrop}
        onClick={() => toggleAssetFolder(node.relPath)}
      >
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
            title="New subfolder"
            onClick={(e) => {
              e.stopPropagation()
              setShowNewFolderInput(true)
            }}
          >
            <Plus />
          </button>
          <button
            className="tr-icon-btn"
            title="Delete folder"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteFolder()
            }}
            style={{ color: 'var(--color-pink)' }}
          >
            ✕
          </button>
        </div>
      </div>

      {showNewFolderInput && (
        <div style={{ paddingLeft: `${indentLeft + 14}px`, padding: '4px 8px' }}>
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') {
                setShowNewFolderInput(false)
                setNewFolderName('')
              }
            }}
            onBlur={() => {
              if (!newFolderName.trim()) {
                setShowNewFolderInput(false)
                setNewFolderName('')
              }
            }}
            autoFocus
            style={{
              width: '100%',
              padding: '4px',
              border: '1.5px solid var(--color-ink)',
              background: 'var(--color-paper)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-xs)',
            }}
          />
        </div>
      )}

      {dragOverFolder && (
        <div style={{ position: 'relative', height: 0 }}>
          <div className="drop-line" />
        </div>
      )}

      {isExpanded && node.children && (
        <div>
          {node.children.map((child) =>
            child.type === 'folder' ? (
              <AssetFolderNode key={child.relPath} node={child} depth={depth + 1} />
            ) : (
              <AssetFileNode key={child.relPath} node={child} depth={depth + 1} />
            )
          )}
          {node.children.length === 0 && (
            <div
              style={{
                padding: `4px 12px 4px ${indentLeft + 14}px`,
                fontSize: 'var(--fs-xs)',
                color: 'var(--color-ink-60)',
              }}
            >
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  )
}

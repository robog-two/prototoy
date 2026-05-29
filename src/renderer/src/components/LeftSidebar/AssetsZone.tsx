import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store'
import AssetFolderNode from './AssetFolderNode'
import AssetFileNode from './AssetFileNode'
import type { AssetNode } from '../../../../shared/types'

export default function AssetsZone(): React.ReactElement {
  const { assetTree, setAssetTree, showToast } = useStore()
  const [dragOver, setDragOver] = useState(false)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const dragCounter = useRef(0)

  useEffect(() => {
    ;(async () => {
      const tree = await window.api.listAssetsTree()
      setAssetTree(tree)
    })()
  }, [setAssetTree])

  async function handleImportClick(): Promise<void> {
    const names = await window.api.importAssets()
    if (names.length > 0) {
      const updated = await window.api.listAssetsTree()
      setAssetTree(updated)
      showToast(`${names.length} asset${names.length > 1 ? 's' : ''} imported`)
    }
  }

  async function handleCreateRootFolder(): Promise<void> {
    if (!newFolderName.trim()) return
    await window.api.createAssetFolder(newFolderName)
    const updated = await window.api.listAssetsTree()
    setAssetTree(updated)
    setNewFolderName('')
    setShowNewFolderInput(false)
  }

  function handleDragEnter(e: React.DragEvent): void {
    console.log('DRAG ENTER', e)
    e.preventDefault()
    dragCounter.current++
    console.log('dragCounter after enter:', dragCounter.current)
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent): void {
    console.log('DRAG LEAVE', e)
    e.preventDefault()
    dragCounter.current--
    console.log('dragCounter after leave:', dragCounter.current)
    if (dragCounter.current === 0) setDragOver(false)
  }

  function handleDragOver(e: React.DragEvent): void {
    console.log('DRAG OVER', e)
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  async function handleDrop(e: React.DragEvent): Promise<void> {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)

    const paths: string[] = []
    console.log('Drop event received with', e.dataTransfer.items.length, 'items')

    for (const item of Array.from(e.dataTransfer.items)) {
      console.log('Item kind:', item.kind, 'type:', item.type)
      if (item.kind === 'file') {
        const file = item.getAsFile()
        console.log('Got file:', file?.name, 'path available:', !!(file as any).path)
        if (file && (file as any).path) {
          paths.push((file as any).path)
          console.log('Added path:', (file as any).path)
        }
      }
    }

    console.log('Total paths collected:', paths.length, paths)
    if (paths.length === 0) {
      console.log('No valid paths found in drop')
      return
    }

    try {
      const names = await window.api.dropAssets(paths)
      console.log('Drop result:', names)
      if (names.length > 0) {
        const updated = await window.api.listAssetsTree()
        setAssetTree(updated)
        showToast(`${names.length} asset${names.length > 1 ? 's' : ''} added`)
      }
    } catch (err) {
      console.error('Drop error:', err)
      showToast('Error adding assets')
    }
  }

  const totalAssets = countAssets(assetTree)

  return (
    <div className="sb-assets">
      <div className="sb-assets-head">
        <span>Art assets</span>
        <span className="count">{totalAssets}</span>
        <button
          title="New folder"
          onClick={(e) => {
            e.stopPropagation()
            setShowNewFolderInput(true)
          }}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 'var(--fs-sm)',
            padding: '0 var(--sp-2)',
          }}
        >
          +
        </button>
      </div>

      {showNewFolderInput && (
        <div style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateRootFolder()
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
              border: '1px solid var(--color-ink)',
              background: 'var(--color-paper)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-xs)',
            }}
          />
        </div>
      )}

      <div
        className={`sb-drop ${dragOver ? 'active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleImportClick}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>↓</span>
        {dragOver ? 'drop to import' : 'drop images, svgs, fonts…'}
      </div>

      {assetTree.length > 0 && (
        <div className="sb-assets-list">
          {assetTree.map((node) =>
            node.type === 'folder' ? (
              <AssetFolderNode key={node.relPath} node={node} depth={0} />
            ) : (
              <AssetFileNode key={node.relPath} node={node} depth={0} />
            )
          )}
        </div>
      )}
    </div>
  )
}

function countAssets(nodes: AssetNode[]): number {
  let count = 0
  for (const node of nodes) {
    if (node.type === 'folder') {
      count += countAssets(node.children || [])
    } else {
      count++
    }
  }
  return count
}

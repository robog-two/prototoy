import React, { useState, useRef, useEffect } from 'react'

interface Props {
  type: 'screen' | 'section'
  parentPath: string
  onCreated: () => void
  onCancel: () => void
}

export default function CreateModal({ type, parentPath, onCreated, onCancel }: Props): React.ReactElement {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const trimmed = name.trim().replace(/\s+/g, '-').toLowerCase()
    if (!trimmed) { setError('Name is required'); return }
    if (!/^[a-z0-9-_]+$/.test(trimmed)) { setError('Use only letters, numbers, hyphens, underscores'); return }

    if (type === 'screen') {
      await window.api.createScreen(parentPath, trimmed)
    } else {
      await window.api.createSection(parentPath, trimmed, description.trim())
    }
    onCreated()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          width: 340,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          New {type === 'screen' ? 'Screen' : 'Section'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-2)' }}>Name</label>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            placeholder={type === 'screen' ? 'welcome' : 'onboarding'}
            style={{ width: '100%' }}
          />
          {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
        </div>

        {type === 'section' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-2)' }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what screens are in this section…"
              rows={3}
              style={{ width: '100%', resize: 'none' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              background: 'var(--bg-3)',
              color: 'var(--text-2)',
              fontSize: 12
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500
            }}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  )
}

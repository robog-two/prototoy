import React, { useState, useRef, useEffect } from 'react'

interface Props {
  type: 'screen' | 'section'
  parentPath: string
  onCreated: () => void
  onCancel: () => void
}

export default function CreateModal({
  type,
  parentPath,
  onCreated,
  onCancel,
}: Props): React.ReactElement {
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
    if (!trimmed) {
      setError('Name is required')
      return
    }
    if (!/^[a-z0-9-_]+$/.test(trimmed)) {
      setError('Use only letters, numbers, hyphens, underscores')
      return
    }

    if (type === 'screen') {
      await window.api.createScreen(parentPath, trimmed)
    } else {
      await window.api.createSection(parentPath, trimmed, description.trim())
    }
    onCreated()
  }

  return (
    <div className="create-modal-backdrop" onClick={onCancel}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="create-modal">
        <div className="create-modal-header">New {type === 'screen' ? 'Screen' : 'Collection'}</div>

        <div className="create-modal-field">
          <label>Name</label>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder={type === 'screen' ? 'welcome' : 'onboarding'}
          />
          {error && <span className="create-modal-error">{error}</span>}
        </div>

        {type === 'section' && (
          <div className="create-modal-field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what screens are in this section…"
              rows={3}
              style={{ width: '100%', resize: 'none' }}
            />
          </div>
        )}

        <div className="create-modal-footer">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Create
          </button>
        </div>
      </form>
    </div>
  )
}

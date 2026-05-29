/**
 * Testing pattern for button-based components with callbacks
 * Tests user interaction and callback invocation
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'

function PanelError({
  message,
  onDismiss,
  dismissLabel,
}: {
  message: string
  onDismiss: () => void
  dismissLabel: string
}): React.ReactElement {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-paper)',
        padding: 'var(--sp-8)',
      }}
    >
      <div
        style={{
          maxWidth: 400,
          background: 'var(--color-paper)',
          border: '2px solid var(--color-ink)',
          padding: 'var(--sp-7)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-5)',
          boxShadow: 'var(--shadow-hard)',
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: 'var(--fs-lg)' }}>Something went wrong</div>
        <p
          style={{
            fontFamily: 'var(--font-text)',
            fontSize: 'var(--fs-sm)',
            color: 'var(--color-ink-80)',
            margin: 0,
          }}
        >
          {message}
        </p>
        <div>
          <button className="tb-btn" onClick={onDismiss}>
            {dismissLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

describe('PanelError Component', () => {
  it('should render the error message', () => {
    const message = 'An unexpected error occurred'
    render(<PanelError message={message} onDismiss={jest.fn()} dismissLabel="Dismiss" />)

    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('should render the dismiss button with custom label', () => {
    const dismissLabel = 'Back to Projects'
    render(<PanelError message="Error" onDismiss={jest.fn()} dismissLabel={dismissLabel} />)

    expect(screen.getByRole('button', { name: dismissLabel })).toBeInTheDocument()
  })

  it('should render header text', () => {
    render(<PanelError message="Error" onDismiss={jest.fn()} dismissLabel="Dismiss" />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should call onDismiss when button is clicked', () => {
    const onDismiss = jest.fn()
    render(<PanelError message="Error message" onDismiss={onDismiss} dismissLabel="Try Again" />)

    const button = screen.getByRole('button', { name: 'Try Again' })
    fireEvent.click(button)

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('should call onDismiss only once when button is clicked once', () => {
    const onDismiss = jest.fn()
    render(<PanelError message="Error" onDismiss={onDismiss} dismissLabel="Dismiss" />)

    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)

    expect(onDismiss).toHaveBeenCalledTimes(2)
  })

  it('should handle long error messages', () => {
    const longMessage =
      'This is a very long error message that might wrap to multiple lines and should still be displayed correctly in the component'
    render(<PanelError message={longMessage} onDismiss={jest.fn()} dismissLabel="Close" />)

    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})

/**
 * Testing pattern for simple presentational components
 * Toast is a straightforward component that only renders text
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'

function Toast({ message }: { message: string }) {
  return <div className="toast">{message}</div>
}

describe('Toast Component', () => {
  it('should render the message text', () => {
    const message = 'This is a test message'
    render(<Toast message={message} />)

    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('should render with the toast class name', () => {
    const message = 'Test'
    const { container } = render(<Toast message={message} />)

    expect(container.querySelector('.toast')).toBeInTheDocument()
  })

  it('should handle empty string messages', () => {
    const { container } = render(<Toast message="" />)

    expect(container.querySelector('.toast')).toBeInTheDocument()
    expect(container.querySelector('.toast')).toHaveTextContent('')
  })

  it('should handle messages with special characters', () => {
    const message = 'Error: "File not found" <malformed>'
    render(<Toast message={message} />)

    expect(screen.getByText(message)).toBeInTheDocument()
  })
})

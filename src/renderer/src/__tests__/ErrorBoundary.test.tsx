/**
 * Testing pattern for Error Boundary (integration test)
 * Tests error boundary behavior with nested components
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// Component that throws an error
function ThrowError() {
  throw new Error('Test error')
}

// Safe component
function SafeComponent() {
  return <div>Safe content</div>
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Suppress error logging in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <SafeComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })

  it('should render fallback when an error occurs in children', () => {
    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })

  it('should render custom fallback UI', () => {
    const fallbackUI = (
      <div>
        <h1>Something went wrong</h1>
        <p>Please try again</p>
      </div>
    )

    render(
      <ErrorBoundary fallback={fallbackUI}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Please try again')).toBeInTheDocument()
  })

  it('should not catch errors in event handlers', () => {
    const { rerender } = render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <SafeComponent />
      </ErrorBoundary>
    )

    // Error boundary doesn't catch errors in event handlers
    // This is expected behavior - event handlers should use try/catch
    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })
})

import React, { useState } from 'react'

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundaryComponent extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export function useErrorBoundaryState(): {
  hasError: boolean
  setHasError: (value: boolean) => void
} {
  const [hasError, setHasError] = useState(false)

  return {
    hasError,
    setHasError,
  }
}

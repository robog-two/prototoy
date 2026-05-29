# Testing Patterns for Prototoy

This document describes the testing patterns established for the Prototoy project.

## Setup

Jest and React Testing Library are configured in `jest.config.js` and `setupTests.ts`:

- **jest.config.js**: Configures ts-jest for TypeScript, jsdom environment, and test discovery
- **setupTests.ts**: Initializes testing libraries and mocks window.api (Electron IPC)

## Test File Organization

Tests are located in `src/renderer/src/__tests__/` directory with `.test.ts` or `.test.tsx` extensions.

## Testing Patterns

### 1. Component Unit Tests (Simple/Presentational Components)

**File**: `Toast.test.tsx`

Use for components that:

- Only receive props and render UI
- Have no state or hooks
- Don't depend on Electron APIs

Pattern:

```typescript
import { render, screen } from '@testing-library/react'

describe('ComponentName', () => {
  it('should render content', () => {
    render(<MyComponent prop="value" />)
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})
```

### 2. Zustand Store Tests

**File**: `store.test.ts`

Use for testing store hooks and state management.

Pattern:

```typescript
import { useStore } from '../store'

describe('Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { setState } = useStore
    setState({
      /* initial state */
    })
  })

  it('should update state', () => {
    const { action } = useStore.getState()
    action(value)
    expect(useStore.getState().property).toBe(value)
  })
})
```

Key points:

- Access state via `useStore.getState()`
- Reset state in `beforeEach` if tests are interdependent
- Test individual actions and state mutations

### 3. Interactive Component Tests (Callbacks/Events)

**File**: `PanelError.test.tsx`

Use for components with:

- Click handlers and callbacks
- User interactions (fireEvent)
- State managed by parent component

Pattern:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'

describe('Interactive Component', () => {
  it('should call callback on interaction', () => {
    const onClick = jest.fn()
    render(<MyComponent onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

### 4. Integration Tests (Error Boundaries, Complex Components)

**File**: `ErrorBoundary.test.tsx`

Use for testing:

- Error boundaries
- Component composition
- Multiple components working together

Pattern:

```typescript
describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should catch errors from children', () => {
    render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Error')).toBeInTheDocument()
  })
})
```

## Electron-Specific Testing

Since this is an Electron app, mocked APIs are provided in `setupTests.ts`:

```typescript
// window.api is mocked for all tests
window.api.onTreeChanged(jest.fn())
window.api.openProject()
// etc.
```

When testing components that use Electron APIs, they will use these mocks.

## Running Tests

```bash
npm run test              # Run all tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

## Best Practices

1. **Keep tests focused**: One concept per test
2. **Use descriptive names**: `it('should do X when Y happens')`
3. **Avoid implementation details**: Test behavior, not internals
4. **Mock external dependencies**: Zustand, Electron APIs, etc.
5. **Reset state between tests**: Prevents test interdependence
6. **Use semantic queries**: `getByRole`, `getByLabelText` over `getByTestId`

## Future Patterns

As more components are added, additional patterns may be needed:

- Async component tests (data fetching, promises)
- Hook testing with react-hooks-testing-library
- Form validation tests
- Complex state management scenarios

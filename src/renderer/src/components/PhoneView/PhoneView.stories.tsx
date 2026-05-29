import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import {
  PhoneScreenContainer,
  PhoneScreenInner,
  PhoneStatusBar,
  StageContainer,
  EmptyStateContainer,
} from '../../styles/PhoneViewStyles'

const meta = {
  title: 'Components/PhoneView',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof React.FC>

export default meta
type Story = StoryObj<typeof meta>

const PhoneViewFrame = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div
    style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f0f0',
    }}
  >
    <StageContainer style={{ position: 'relative', width: '320px', height: '640px' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <PhoneScreenContainer>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <PhoneScreenInner
                style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
              >
                <PhoneStatusBar>
                  <span>9:41</span>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </PhoneStatusBar>
                {children}
              </PhoneScreenInner>
            </div>
          </div>
        </PhoneScreenContainer>
      </div>
    </StageContainer>
  </div>
)

export const Empty: Story = {
  render: () => (
    <PhoneViewFrame>
      <EmptyStateContainer>Select a screen</EmptyStateContainer>
    </PhoneViewFrame>
  ),
}

export const Loading: Story = {
  render: () => (
    <PhoneViewFrame>
      <EmptyStateContainer>Preview starting…</EmptyStateContainer>
    </PhoneViewFrame>
  ),
}

export const WithContent: Story = {
  render: () => (
    <PhoneViewFrame>
      <div style={{ padding: '16px', color: '#333', fontFamily: 'system-ui' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Welcome</h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5' }}>
          This is a sample screen preview rendered in the phone frame.
        </p>
        <button
          style={{
            padding: '8px 16px',
            background: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Tap me
        </button>
      </div>
    </PhoneViewFrame>
  ),
}

export const DarkMode: Story = {
  render: () => (
    <PhoneViewFrame>
      <div
        style={{
          padding: '16px',
          color: '#fff',
          fontFamily: 'system-ui',
          background: '#1a1a1a',
          height: '100%',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Dark Mode</h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5', color: '#aaa' }}>
          A screen in dark mode.
        </p>
        <button
          style={{
            padding: '8px 16px',
            background: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Button
        </button>
      </div>
    </PhoneViewFrame>
  ),
}

export const ScrollableContent: Story = {
  render: () => (
    <PhoneViewFrame>
      <div
        style={{
          padding: '16px',
          color: '#333',
          fontFamily: 'system-ui',
          height: '100%',
          overflowY: 'auto',
        }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            style={{
              marginBottom: '12px',
              padding: '12px',
              background: '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
              Item {i + 1}
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              Sample content for list item
            </p>
          </div>
        ))}
      </div>
    </PhoneViewFrame>
  ),
}

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

const meta = {
  title: 'Components/Sidebar',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof React.FC>

export default meta
type Story = StoryObj<typeof meta>

const SidebarFrame = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div style={{ display: 'flex', width: '100%', height: '100vh', background: '#fff' }}>
    <aside
      style={{
        width: '280px',
        background: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </aside>
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
      }}
    >
      Main content area
    </div>
  </div>
)

const TreeNode = ({
  name,
  isSection,
  children,
  level,
}: {
  name: string
  isSection: boolean
  children?: React.ReactNode
  level: number
}): React.ReactElement => (
  <div style={{ marginLeft: `${level * 16}px` }}>
    <div
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: '13px',
        userSelect: 'none',
        background: isSection ? '#f0f0f0' : 'transparent',
        fontWeight: isSection ? '600' : '400',
      }}
    >
      {isSection ? '📁' : '📄'} {name}
    </div>
    {children}
  </div>
)

export const Basic: Story = {
  render: () => (
    <SidebarFrame>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>My Project</div>
        <div style={{ fontSize: '12px', color: '#999' }}>/path/to/project</div>
      </div>

      <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
        <input
          type="text"
          placeholder="Search by name…"
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <TreeNode name="Welcome" isSection={false} level={0} />
        <TreeNode name="Onboarding" isSection={true} level={0}>
          <TreeNode name="Sign Up" isSection={false} level={1} />
          <TreeNode name="Login" isSection={false} level={1} />
          <TreeNode name="Forgot Password" isSection={false} level={1} />
        </TreeNode>
        <TreeNode name="Main App" isSection={true} level={0}>
          <TreeNode name="Dashboard" isSection={false} level={1} />
          <TreeNode name="Profile" isSection={false} level={1} />
          <TreeNode name="Settings" isSection={false} level={1} />
        </TreeNode>
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
        <button
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            background: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Screen
        </button>
        <button
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            background: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Collection
        </button>
      </div>
    </SidebarFrame>
  ),
}

export const WithSearch: Story = {
  render: () => (
    <SidebarFrame>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>My Project</div>
        <div style={{ fontSize: '12px', color: '#999' }}>/path/to/project</div>
      </div>

      <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
        <input
          type="text"
          placeholder="Search by name…"
          defaultValue="profile"
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #007AFF',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#f0f8ff',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <TreeNode name="Main App" isSection={true} level={0}>
          <TreeNode name="Profile" isSection={false} level={1} />
          <TreeNode name="Profile Edit" isSection={false} level={1} />
        </TreeNode>
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
        <button
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            background: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Screen
        </button>
        <button
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            background: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Collection
        </button>
      </div>
    </SidebarFrame>
  ),
}

export const Empty: Story = {
  render: () => (
    <SidebarFrame>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
          Empty Project
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>/path/to/empty</div>
      </div>

      <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
        <input
          type="text"
          placeholder="Search by name…"
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '14px',
        }}
      >
        No screens yet
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
        <button
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            background: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Screen
        </button>
        <button
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            background: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Collection
        </button>
      </div>
    </SidebarFrame>
  ),
}

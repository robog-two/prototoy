import type { Meta, StoryObj } from '@storybook/react'
import LogPanel from './LogPanel'

const meta = {
  title: 'Components/LogPanel',
  component: LogPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LogPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    logs: [],
    onClose: () => alert('Close clicked'),
  },
}

export const WithNormalLogs: Story = {
  args: {
    logs: [
      '[VITE] App entry resolved',
      'Bundling complete',
      'HMR watching for changes...',
      'React Fast Refresh enabled',
      'Ready on http://localhost:5173',
    ],
    onClose: () => alert('Close clicked'),
  },
}

export const WithErrors: Story = {
  args: {
    logs: [
      '[VITE] App entry resolved',
      'Bundling complete',
      'Error: Component module not found',
      'Error: Failed to compile',
      'Cannot find module "./components/missing"',
      'Stack trace: at Module._load',
    ],
    onClose: () => alert('Close clicked'),
  },
}

export const WithWarnings: Story = {
  args: {
    logs: [
      '[VITE] App entry resolved',
      'Bundling complete',
      'Warning: unused variable "x"',
      'Warning: deprecated API used',
      'React does not recognize prop "foo"',
      'HMR update complete',
    ],
    onClose: () => alert('Close clicked'),
  },
}

export const MixedWithLongLogs: Story = {
  args: {
    logs: [
      '[VITE] App entry resolved',
      'Bundling complete...',
      'Error: Failed to load asset from /public/images/very-long-filename-that-contains-a-lot-of-information-about-the-asset-that-is-being-loaded.png',
      'Warning: This component is deprecated and will be removed in v2.0.0. Use NewComponent instead.',
      'Processing 1,234 files...',
      'Compiled successfully',
      'HMR watching for changes on http://localhost:5173/socket.io',
    ],
    onClose: () => alert('Close clicked'),
  },
}

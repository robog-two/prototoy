import type { Meta, StoryObj } from '@storybook/react'
import Toast from './Toast'

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    message: 'Screenshot saved',
  },
}

export const LongMessage: Story = {
  args: {
    message: 'Command copied — paste in terminal to open the selected screen in Claude Code',
  },
}

export const ErrorMessage: Story = {
  args: {
    message: 'Error: Failed to save screenshot',
  },
}

export const ShortMessage: Story = {
  args: {
    message: 'Done!',
  },
}

export const SpecialCharacters: Story = {
  args: {
    message: 'Error: "File not found" <malformed>',
  },
}

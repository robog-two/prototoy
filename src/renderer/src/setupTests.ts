// Setup file for Jest/React Testing Library
// This file runs before each test suite and configures the testing environment

import '@testing-library/jest-dom'
import type { API } from '../../preload'

// Mock window.api for Electron IPC
declare global {
  interface Window {
    api: API
  }
}

const mockAPI: API = {
  onTreeChanged: jest.fn(() => jest.fn()),
  onPreviewStatus: jest.fn(() => jest.fn()),
  onProjectError: jest.fn(() => jest.fn()),
  onProjectIssues: jest.fn(() => jest.fn()),
  onUpdateReady: jest.fn(() => jest.fn()),
  onPrepareUpdate: jest.fn(() => jest.fn()),
  onUpdateProgress: jest.fn(() => jest.fn()),
  getPreviewLogs: jest.fn(() => Promise.resolve([])),
  getRecentProjects: jest.fn(() => Promise.resolve([])),
  openProject: jest.fn(),
  createProject: jest.fn(),
  getTree: jest.fn(),
  createScreen: jest.fn(),
  createSection: jest.fn(),
  renameNode: jest.fn(),
  deleteNode: jest.fn(),
  moveNode: jest.fn(),
  updateSectionDescription: jest.fn(),
  selectScreen: jest.fn(),
  getPreviewPort: jest.fn(),
  copyToClipboard: jest.fn(),
  saveScreenshot: jest.fn(),
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  listAssets: jest.fn(),
  listAssetsTree: jest.fn(),
  importAssets: jest.fn(),
  dropAssets: jest.fn(),
  createAssetFolder: jest.fn(),
  moveAsset: jest.fn(),
  deleteAsset: jest.fn(),
  getAssetPath: jest.fn(),
  readAssetText: jest.fn(),
  writeAssetText: jest.fn(),
  repairIssueAuto: jest.fn(),
  repairIssueText: jest.fn(),
} as unknown as API

Object.defineProperty(global.window, 'api', {
  value: mockAPI,
  writable: true,
})

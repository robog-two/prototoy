export interface ProjectConfig {
  name: string
  description: string
}

export interface FolderConfig {
  description: string
}

export interface ScreenNode {
  type: 'screen'
  name: string
  path: string
}

export interface SectionNode {
  type: 'section'
  name: string
  path: string
  description: string
  children: TreeNode[]
}

export type TreeNode = ScreenNode | SectionNode

export interface ProjectTree {
  projectPath: string
  config: ProjectConfig
  children: TreeNode[]
}

export interface PreviewState {
  port: number | null
  status: 'idle' | 'installing' | 'starting' | 'ready' | 'error'
  error?: string
}

import { dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { ProjectConfig, FolderConfig, TreeNode, ProjectTree, SectionNode } from '../shared/types'

export async function openProjectDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Open Prototoy Project'
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

export function readOrCreateProjectConfig(projectPath: string): ProjectConfig {
  const configPath = path.join(projectPath, 'project.json')
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  }
  const name = path.basename(projectPath)
  const config: ProjectConfig = { name, description: '' }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  return config
}

function readChildren(dirPath: string, projectPath: string): TreeNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const nodes: TreeNode[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('.') || entry.name === '_include') continue

    const childPath = path.join(dirPath, entry.name)
    const hasIndex = fs.existsSync(path.join(childPath, 'index.tsx'))
    const hasFolderJson = fs.existsSync(path.join(childPath, 'folder.json'))

    if (hasIndex) {
      nodes.push({ type: 'screen', name: entry.name, path: childPath })
    } else if (hasFolderJson) {
      const folderConfig: FolderConfig = JSON.parse(
        fs.readFileSync(path.join(childPath, 'folder.json'), 'utf-8')
      )
      const section: SectionNode = {
        type: 'section',
        name: entry.name,
        path: childPath,
        description: folderConfig.description,
        children: readChildren(childPath, projectPath)
      }
      nodes.push(section)
    }
  }

  return nodes
}

export function readProjectTree(projectPath: string): ProjectTree {
  const config = readOrCreateProjectConfig(projectPath)
  return {
    projectPath,
    config,
    children: readChildren(projectPath, projectPath)
  }
}

export function createScreen(parentPath: string, name: string): string {
  const screenPath = path.join(parentPath, name)
  fs.mkdirSync(screenPath, { recursive: true })
  const stub = `import React from 'react'\n\nexport default function ${toPascalCase(name)}(): React.ReactElement {\n  return (\n    <div style={{ width: 390, height: 844, background: '#fff' }}>\n      {/* Design this screen */}\n    </div>\n  )\n}\n`
  fs.writeFileSync(path.join(screenPath, 'index.tsx'), stub)
  return screenPath
}

export function createSection(parentPath: string, name: string, description: string, projectPath?: string): string {
  const sectionPath = path.join(parentPath, name)
  fs.mkdirSync(sectionPath, { recursive: true })
  const config: FolderConfig = { description }
  fs.writeFileSync(path.join(sectionPath, 'folder.json'), JSON.stringify(config, null, 2))
  if (projectPath) ensureSectionIncludeSymlink(sectionPath, projectPath)
  return sectionPath
}

export function renameNode(nodePath: string, newName: string): string {
  const newPath = path.join(path.dirname(nodePath), newName)
  fs.renameSync(nodePath, newPath)
  return newPath
}

export function deleteNode(nodePath: string): void {
  fs.rmSync(nodePath, { recursive: true, force: true })
}

export function moveNode(srcPath: string, destSectionPath: string): string {
  const name = path.basename(srcPath)
  const destPath = path.join(destSectionPath, name)
  fs.renameSync(srcPath, destPath)
  return destPath
}

export function updateSectionDescription(sectionPath: string, description: string): void {
  const configPath = path.join(sectionPath, 'folder.json')
  const config: FolderConfig = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    : { description: '' }
  config.description = description
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

export function ensureIncludeDir(projectPath: string): void {
  const includePath = path.join(projectPath, '_include')
  if (!fs.existsSync(includePath)) {
    fs.mkdirSync(includePath, { recursive: true })
    fs.mkdirSync(path.join(includePath, 'components'), { recursive: true })
    fs.writeFileSync(path.join(includePath, 'variables.css'), ':root {\n  /* Add your CSS variables here */\n  --color-primary: #007aff;\n  --color-background: #ffffff;\n  --color-text: #1a1a1a;\n  --spacing-sm: 8px;\n  --spacing-md: 16px;\n  --spacing-lg: 24px;\n  --border-radius: 12px;\n}\n')
  }
}

function toPascalCase(str: string): string {
  return str.replace(/(^\w|[-_\s]\w)/g, (m) => m.replace(/[-_\s]/, '').toUpperCase())
}

export function parseCssVariables(projectPath: string): Record<string, string> {
  const cssPath = path.join(projectPath, '_include', 'variables.css')
  if (!fs.existsSync(cssPath)) return {}
  const content = fs.readFileSync(cssPath, 'utf-8')
  const vars: Record<string, string> = {}
  const regex = /(--[\w-]+)\s*:\s*([^;]+);/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    vars[match[1].trim()] = match[2].trim()
  }
  return vars
}

export function listSharedComponents(projectPath: string): string[] {
  const componentsPath = path.join(projectPath, '_include', 'components')
  if (!fs.existsSync(componentsPath)) return []
  return fs
    .readdirSync(componentsPath)
    .filter((f) => /\.(tsx|ts|jsx|js)$/.test(f))
    .map((f) => f.replace(/\.(tsx|ts|jsx|js)$/, ''))
}

export function listAssets(projectPath: string): string[] {
  const assetsPath = path.join(projectPath, '_include', 'assets')
  if (!fs.existsSync(assetsPath)) return []
  return fs.readdirSync(assetsPath).filter((f) => !f.startsWith('.'))
}

export function copyAssetsToInclude(projectPath: string, srcPaths: string[]): string[] {
  const assetsDir = path.join(projectPath, '_include', 'assets')
  fs.mkdirSync(assetsDir, { recursive: true })
  const copied: string[] = []
  for (const src of srcPaths) {
    const name = path.basename(src)
    const dest = path.join(assetsDir, name)
    fs.copyFileSync(src, dest)
    copied.push(name)
  }
  return copied
}

export function ensureSectionIncludeSymlink(sectionPath: string, projectPath: string): void {
  const linkPath = path.join(sectionPath, '_include')
  try {
    const stat = fs.lstatSync(linkPath)
    if (stat.isSymbolicLink() || stat.isDirectory()) return
  } catch {
    // Path doesn't exist — proceed to create the symlink.
  }
  const rel = path.relative(sectionPath, path.join(projectPath, '_include'))
  try {
    fs.symlinkSync(rel, linkPath, 'dir')
  } catch {
    // Not fatal if symlink creation fails (permissions, etc.).
  }
}

export function collectAllScreens(
  projectPath: string
): Array<{ name: string; urlPath: string; fsPath: string }> {
  const screens: Array<{ name: string; urlPath: string; fsPath: string }> = []

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '_include') continue
      const childPath = path.join(dir, entry.name)
      if (fs.existsSync(path.join(childPath, 'index.tsx'))) {
        const rel = path.relative(projectPath, childPath).replace(/\\/g, '/')
        screens.push({ name: entry.name, urlPath: '/' + rel, fsPath: path.join(childPath, 'index.tsx') })
      } else {
        walk(childPath)
      }
    }
  }

  walk(projectPath)
  return screens
}

export function ensureAllSectionSymlinks(projectPath: string): void {
  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '_include') continue
      const childPath = path.join(dir, entry.name)
      if (fs.existsSync(path.join(childPath, 'folder.json'))) {
        ensureSectionIncludeSymlink(childPath, projectPath)
        walk(childPath)
      }
    }
  }
  walk(projectPath)
}

export function collectScreensInSection(sectionPath: string): Array<{ name: string; relPath: string }> {
  const screens: Array<{ name: string; relPath: string }> = []

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const childPath = path.join(dir, entry.name)
      if (fs.existsSync(path.join(childPath, 'index.tsx'))) {
        screens.push({
          name: entry.name,
          relPath: path.relative(sectionPath, path.join(childPath, 'index.tsx'))
        })
      } else {
        walk(childPath)
      }
    }
  }

  walk(sectionPath)
  return screens
}

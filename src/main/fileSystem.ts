import { dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type {
  ProjectConfig,
  FolderConfig,
  TreeNode,
  ProjectTree,
  SectionNode,
  ProjectIssue,
  IssueKind,
  AssetNode,
} from '../shared/types'

let _issueSeq = 0
function makeIssue(
  kind: IssueKind,
  title: string,
  detail: string,
  issuePath: string,
  repair: ProjectIssue['repair'],
  repairCurrentValue?: string
): ProjectIssue {
  return {
    id: `issue-${++_issueSeq}`,
    kind,
    title,
    detail,
    path: issuePath,
    repair,
    repairCurrentValue,
  }
}

function push(issues: ProjectIssue[] | undefined, issue: ProjectIssue): void {
  issues?.push(issue)
}

export async function openProjectDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Open Prototoy Project',
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

export function readOrCreateProjectConfig(
  projectPath: string,
  issues?: ProjectIssue[]
): ProjectConfig {
  const configPath = path.join(projectPath, 'project.json')
  const fallbackName = path.basename(projectPath)

  if (fs.existsSync(configPath)) {
    let raw: unknown
    let parseError = false
    try {
      raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    } catch {
      raw = null
      parseError = true
    }

    const r = raw as Record<string, unknown> | null

    const name = r && typeof r.name === 'string' && r.name.trim() ? r.name.trim() : fallbackName

    const description = r && typeof r.description === 'string' ? r.description : ''

    const config: ProjectConfig = { name, description }

    const needsRepair = parseError || !r || r.name !== name || r.description !== description
    if (needsRepair) {
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      } catch {
        /* non-fatal */
      }
      if (parseError) {
        push(
          issues,
          makeIssue(
            'project-config-corrupt',
            'Project config was corrupt',
            `project.json could not be parsed and has been reset. The project name was taken from the folder name "${name}".`,
            configPath,
            'none'
          )
        )
      }
    }

    return config
  }

  const config: ProjectConfig = { name: fallbackName, description: '' }
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch {
    /* non-fatal */
  }
  return config
}

function readFolderDescription(folderJsonPath: string, issues?: ProjectIssue[]): string {
  const sectionPath = path.dirname(folderJsonPath)
  const sectionName = path.basename(sectionPath)

  try {
    const raw = JSON.parse(fs.readFileSync(folderJsonPath, 'utf-8'))
    if (typeof raw?.description === 'string') return raw.description

    const fixed = { ...(raw && typeof raw === 'object' ? raw : {}), description: '' }
    try {
      fs.writeFileSync(folderJsonPath, JSON.stringify(fixed, null, 2))
    } catch {
      /* non-fatal */
    }
    push(
      issues,
      makeIssue(
        'section-config-missing-desc',
        'Section description missing',
        `folder.json in "${sectionName}" had no description field. You can set one now.`,
        sectionPath,
        'text',
        ''
      )
    )
    return ''
  } catch {
    try {
      fs.writeFileSync(folderJsonPath, JSON.stringify({ description: '' }, null, 2))
    } catch {
      /* non-fatal */
    }
    push(
      issues,
      makeIssue(
        'section-config-corrupt',
        'Section config was corrupt',
        `folder.json in "${sectionName}" could not be parsed and has been reset. You can set a description now.`,
        sectionPath,
        'text',
        ''
      )
    )
    return ''
  }
}

function readChildren(dirPath: string, projectPath: string, issues?: ProjectIssue[]): TreeNode[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch (err) {
    push(
      issues,
      makeIssue(
        'directory-unreadable',
        'Directory could not be read',
        `"${path.basename(dirPath)}" was skipped. ${err instanceof Error ? err.message : String(err)}`,
        dirPath,
        'none'
      )
    )
    return []
  }

  const nodes: TreeNode[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('.') || entry.name === '_include') continue

    try {
      const childPath = path.join(dirPath, entry.name)
      const hasIndex = fs.existsSync(path.join(childPath, 'index.tsx'))
      const hasFolderJson = fs.existsSync(path.join(childPath, 'folder.json'))

      if (hasIndex) {
        nodes.push({ type: 'screen', name: entry.name, path: childPath })
      } else if (hasFolderJson) {
        const description = readFolderDescription(path.join(childPath, 'folder.json'), issues)
        const section: SectionNode = {
          type: 'section',
          name: entry.name,
          path: childPath,
          description,
          children: readChildren(childPath, projectPath, issues),
        }
        nodes.push(section)
      }
    } catch (err) {
      push(
        issues,
        makeIssue(
          'directory-unreadable',
          'Entry could not be read',
          `"${entry.name}" was skipped. ${err instanceof Error ? err.message : String(err)}`,
          path.join(dirPath, entry.name),
          'none'
        )
      )
    }
  }

  return nodes
}

export function readProjectTree(projectPath: string, issues?: ProjectIssue[]): ProjectTree {
  let stat: fs.Stats
  try {
    stat = fs.statSync(projectPath)
  } catch {
    throw new Error(`Project folder not found or inaccessible: "${path.basename(projectPath)}"`)
  }
  if (!stat.isDirectory()) {
    throw new Error(`Not a folder: "${path.basename(projectPath)}"`)
  }

  const config = readOrCreateProjectConfig(projectPath, issues)
  return {
    projectPath,
    config,
    children: readChildren(projectPath, projectPath, issues),
  }
}

export function createScreen(parentPath: string, name: string): string {
  const screenPath = path.join(parentPath, name)
  fs.mkdirSync(screenPath, { recursive: true })
  const stub = `import React from 'react'\n\nexport default function ${toPascalCase(name)}(): React.ReactElement {\n  return (\n    <div style={{ width: 390, height: 844, background: '#fff' }}>\n      {/* Design this screen */}\n    </div>\n  )\n}\n`
  fs.writeFileSync(path.join(screenPath, 'index.tsx'), stub)
  return screenPath
}

export function createSection(
  parentPath: string,
  name: string,
  description: string,
  projectPath?: string
): string {
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
    fs.mkdirSync(path.join(includePath, 'assets'), { recursive: true })
    fs.writeFileSync(
      path.join(includePath, 'assets', 'variables.css'),
      ':root {\n  /* Add your CSS variables here */\n  --color-primary: #007aff;\n  --color-background: #ffffff;\n  --color-text: #1a1a1a;\n  --spacing-sm: 8px;\n  --spacing-md: 16px;\n  --spacing-lg: 24px;\n  --border-radius: 12px;\n}\n'
    )
  } else {
    // Migrate old variables.css from _include root to _include/assets
    const oldVariablesPath = path.join(includePath, 'variables.css')
    const assetsPath = path.join(includePath, 'assets')
    if (!fs.existsSync(assetsPath)) {
      fs.mkdirSync(assetsPath, { recursive: true })
    }
    if (fs.existsSync(oldVariablesPath)) {
      const newVariablesPath = path.join(assetsPath, 'variables.css')
      if (!fs.existsSync(newVariablesPath)) {
        fs.copyFileSync(oldVariablesPath, newVariablesPath)
        fs.unlinkSync(oldVariablesPath)
      }
    }
  }
}

function toPascalCase(str: string): string {
  return str.replace(/(^\w|[-_\s]\w)/g, (m) => m.replace(/[-_\s]/, '').toUpperCase())
}

export function parseCssVariables(projectPath: string): Record<string, string> {
  const cssPath = path.join(projectPath, '_include', 'assets', 'variables.css')
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

export function copyAssetsToInclude(
  projectPath: string,
  srcPaths: string[],
  targetFolder?: string
): string[] {
  const assetsDir = path.join(projectPath, '_include', 'assets')
  const destDir = targetFolder ? path.join(assetsDir, targetFolder) : assetsDir
  fs.mkdirSync(destDir, { recursive: true })
  const copied: string[] = []
  for (const src of srcPaths) {
    try {
      const stat = fs.statSync(src)
      const name = path.basename(src)
      const dest = path.join(destDir, name)
      if (stat.isDirectory()) {
        fs.cpSync(src, dest, { recursive: true, force: true })
      } else {
        fs.copyFileSync(src, dest)
      }
      copied.push(targetFolder ? path.join(targetFolder, name) : name)
    } catch (err) {
      console.error(`Failed to copy ${src}:`, err)
    }
  }
  return copied
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'])
const FONT_EXTS = new Set(['ttf', 'otf', 'woff', 'woff2'])
const TEXT_EXTS = new Set(['svg', 'css', 'js', 'json', 'html', 'md', 'txt', 'jsx', 'tsx', 'ts'])

function getAssetType(filename: string): AssetNode['type'] {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (FONT_EXTS.has(ext)) return 'font'
  if (TEXT_EXTS.has(ext)) return 'text'
  return 'other'
}

export function listAssetsTree(projectPath: string): AssetNode[] {
  const assetsDir = path.join(projectPath, '_include', 'assets')
  if (!fs.existsSync(assetsDir)) return []

  function walkDir(dir: string, relBase: string): AssetNode[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    return entries
      .filter((e) => !e.name.startsWith('.'))
      .map((entry) => {
        const relPath = path.posix.join(relBase, entry.name)
        if (entry.isDirectory()) {
          const children = walkDir(path.join(dir, entry.name), relPath)
          return {
            name: entry.name,
            relPath,
            type: 'folder',
            children,
          }
        }
        const stat = fs.statSync(path.join(dir, entry.name))
        return {
          name: entry.name,
          relPath,
          type: getAssetType(entry.name),
          size: stat.size,
        }
      })
  }

  return walkDir(assetsDir, '')
}

export function createAssetFolder(projectPath: string, folderRelPath: string): void {
  const assetsDir = path.join(projectPath, '_include', 'assets')
  const newFolderPath = path.join(assetsDir, folderRelPath)
  fs.mkdirSync(newFolderPath, { recursive: true })
}

export function moveAsset(
  projectPath: string,
  assetRelPath: string,
  newParentRelPath: string
): void {
  const assetsDir = path.join(projectPath, '_include', 'assets')
  const oldPath = path.join(assetsDir, assetRelPath)
  const name = path.basename(assetRelPath)
  const newPath = newParentRelPath
    ? path.join(assetsDir, newParentRelPath, name)
    : path.join(assetsDir, name)
  fs.mkdirSync(path.dirname(newPath), { recursive: true })
  fs.renameSync(oldPath, newPath)
}

export function deleteAsset(projectPath: string, assetRelPath: string): void {
  const assetsDir = path.join(projectPath, '_include', 'assets')
  const assetPath = path.join(assetsDir, assetRelPath)
  if (!fs.existsSync(assetPath)) return

  const stat = fs.statSync(assetPath)
  if (stat.isDirectory()) {
    fs.rmSync(assetPath, { recursive: true, force: true })
  } else {
    fs.unlinkSync(assetPath)
  }
}

export function getAssetFilePath(projectPath: string, assetRelPath: string): string {
  const assetsDir = path.join(projectPath, '_include', 'assets')
  return `file://${path.join(assetsDir, assetRelPath)}`
}

export function readAssetText(projectPath: string, assetRelPath: string): string {
  const assetsDir = path.join(projectPath, '_include', 'assets')
  const assetPath = path.join(assetsDir, assetRelPath)
  return fs.readFileSync(assetPath, 'utf-8')
}

export function writeAssetText(projectPath: string, assetRelPath: string, content: string): void {
  const assetsDir = path.join(projectPath, '_include', 'assets')
  const assetPath = path.join(assetsDir, assetRelPath)
  fs.writeFileSync(assetPath, content, 'utf-8')
}

export function ensureSectionIncludeSymlink(sectionPath: string, projectPath: string): boolean {
  const linkPath = path.join(sectionPath, '_include')
  try {
    const stat = fs.lstatSync(linkPath)
    if (stat.isSymbolicLink() || stat.isDirectory()) return true
  } catch {
    // Path doesn't exist — proceed to create the symlink.
  }
  const rel = path.relative(sectionPath, path.join(projectPath, '_include'))
  try {
    fs.symlinkSync(rel, linkPath, 'dir')
    return true
  } catch {
    return false
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
        screens.push({
          name: entry.name,
          urlPath: '/' + rel,
          fsPath: path.join(childPath, 'index.tsx'),
        })
      } else {
        walk(childPath)
      }
    }
  }

  walk(projectPath)
  return screens
}

export function ensureAllSectionSymlinks(projectPath: string): string[] {
  const failures: string[] = []

  function walk(dir: string): void {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '_include') continue
      const childPath = path.join(dir, entry.name)
      if (fs.existsSync(path.join(childPath, 'folder.json'))) {
        const ok = ensureSectionIncludeSymlink(childPath, projectPath)
        if (!ok) failures.push(childPath)
        walk(childPath)
      }
    }
  }

  walk(projectPath)
  return failures
}

export function collectScreensInSection(
  sectionPath: string
): Array<{ name: string; relPath: string }> {
  const screens: Array<{ name: string; relPath: string }> = []

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const childPath = path.join(dir, entry.name)
      if (fs.existsSync(path.join(childPath, 'index.tsx'))) {
        screens.push({
          name: entry.name,
          relPath: path.relative(sectionPath, path.join(childPath, 'index.tsx')),
        })
      } else {
        walk(childPath)
      }
    }
  }

  walk(sectionPath)
  return screens
}

import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { ProjectTree } from '../shared/types'

export interface RecentProject {
  name: string
  path: string
  screens: number
  sections: number
  openedAt: string
}

const RECENT_PROJECTS_FILE = path.join(app.getPath('userData'), 'recent-projects.json')
const MAX_RECENT = 10

function readRecentProjects(): RecentProject[] {
  try {
    if (!fs.existsSync(RECENT_PROJECTS_FILE)) return []
    const data = fs.readFileSync(RECENT_PROJECTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    return []
  }
}

function writeRecentProjects(projects: RecentProject[]): void {
  try {
    fs.mkdirSync(path.dirname(RECENT_PROJECTS_FILE), { recursive: true })
    fs.writeFileSync(RECENT_PROJECTS_FILE, JSON.stringify(projects, null, 2))
  } catch (err) {
    console.error('Failed to save recent projects:', err)
  }
}

export function getRecentProjects(): RecentProject[] {
  return readRecentProjects()
}

export function addRecentProject(tree: ProjectTree): void {
  const recents = readRecentProjects()
  const screenCount = tree.children.reduce((sum, section) => sum + section.children.length, 0)
  const sectionCount = tree.children.length

  const newEntry: RecentProject = {
    name: tree.config.name,
    path: tree.projectPath,
    screens: screenCount,
    sections: sectionCount,
    openedAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Remove duplicate if exists
  const filtered = recents.filter((p) => p.path !== tree.projectPath)

  // Add to front and trim to MAX_RECENT
  const updated = [newEntry, ...filtered].slice(0, MAX_RECENT)

  writeRecentProjects(updated)
}

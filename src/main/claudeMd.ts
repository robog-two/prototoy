import * as fs from 'fs'
import * as path from 'path'
import {
  parseCssVariables,
  listSharedComponents,
  listAssets,
  collectScreensInSection
} from './fileSystem'

export function generateSectionClaudeMd(
  sectionPath: string,
  projectPath: string,
  projectName: string,
  description: string,
  previewPort: number | null
): string {
  const cssVars = parseCssVariables(projectPath)
  const components = listSharedComponents(projectPath)
  const assets = listAssets(projectPath)
  const screens = collectScreensInSection(sectionPath)
  const sectionName = path.basename(sectionPath)

  const previewUrl = previewPort ? `http://localhost:${previewPort}` : 'not yet started'

  const cssVarsSection =
    Object.keys(cssVars).length > 0
      ? Object.entries(cssVars)
          .map(([name, value]) => `- \`${name}\`: ${value}`)
          .join('\n')
      : '_No variables defined yet. Add them to `_include/variables.css`._'

  const componentsSection =
    components.length > 0
      ? components
          .map((c) => `- \`${c}\` — \`import ${c} from '@include/components/${c}'\``)
          .join('\n')
      : '_No shared components yet. Add them to `_include/components/`._'

  const assetsSection =
    assets.length > 0
      ? assets
          .map((a) => `- \`${a}\` — \`import asset from '@include/assets/${a}'\``)
          .join('\n')
      : '_No assets uploaded yet._'

  const screensSection =
    screens.length > 0
      ? screens.map((s) => `- \`${s.relPath}\` — ${s.name}`).join('\n')
      : '_No screens yet. Create a subfolder with an `index.tsx` file._'

  return `# Section: ${sectionName}

**Project**: ${projectName}
**Description**: ${description || '_No description provided._'}

## Screens in This Section

${screensSection}

## Live Preview

The preview dev server is already running at **${previewUrl}**. Do NOT stop, restart, or run \`npm run dev\` — it is managed by the Prototoy app. Open this URL in a browser to see the currently selected screen render live. When you edit and save a screen's \`index.tsx\`, the preview updates automatically via HMR.

## Available CSS Variables

These are defined in \`_include/variables.css\` and injected into every screen automatically:

${cssVarsSection}

## Shared Components

${componentsSection}

## Assets

These files are in \`_include/assets/\` and are also accessible from this section folder via the \`_include\` symlink (e.g. \`./_include/assets/logo.png\`). In \`index.tsx\`, import them using the \`@include\` alias which the preview server resolves automatically:

${assetsSection}

## Instructions

Write each screen as a **default-export React component** in its \`index.tsx\`. Follow these rules:

- Use **inline CSS styles** and **CSS custom properties** (from the variables above) for all styling.
- Do **NOT** use component libraries (shadcn, Material UI, Tailwind, Chakra, etc.) — this is a custom design prototype and pre-built components will make it feel generic.
- When you have any question about a **color, spacing, size, border radius, font, or other visual detail**, ask the user rather than guessing or falling back to defaults. The user has a specific design in mind.
- Each component renders inside a **390×844px** viewport (iPhone 14 Pro dimensions).
- Import shared components via \`@include/components/Name\`, assets via \`@include/assets/filename\`, and CSS variables via \`@include/variables.css\`.
- You can inspect available files directly: \`ls ./_include/assets/\` and \`ls ./_include/components/\`.
`
}

export function writeSectionClaudeMd(
  sectionPath: string,
  projectPath: string,
  projectName: string,
  previewPort: number | null
): void {
  const folderConfigPath = path.join(sectionPath, 'folder.json')
  let description = ''
  if (fs.existsSync(folderConfigPath)) {
    try {
      description = JSON.parse(fs.readFileSync(folderConfigPath, 'utf-8')).description || ''
    } catch {}
  }

  const content = generateSectionClaudeMd(
    sectionPath,
    projectPath,
    projectName,
    description,
    previewPort
  )
  fs.writeFileSync(path.join(sectionPath, 'CLAUDE.md'), content)
}

export function regenerateAllClaudeMds(
  projectPath: string,
  projectName: string,
  previewPort: number | null
): void {
  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '_include') continue
      const childPath = path.join(dir, entry.name)
      if (fs.existsSync(path.join(childPath, 'folder.json'))) {
        writeSectionClaudeMd(childPath, projectPath, projectName, previewPort)
        walk(childPath)
      }
    }
  }
  walk(projectPath)
}

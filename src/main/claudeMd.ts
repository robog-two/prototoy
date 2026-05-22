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
  description: string
): string {
  const cssVars = parseCssVariables(projectPath)
  const components = listSharedComponents(projectPath)
  const assets = listAssets(projectPath)
  const screens = collectScreensInSection(sectionPath)
  const sectionName = path.basename(sectionPath)

  const cssVarsSection =
    Object.keys(cssVars).length > 0
      ? Object.entries(cssVars)
          .map(([name, value]) => `- \`${name}\`: ${value}`)
          .join('\n')
      : '_No variables defined yet. Add them to a CSS file in the Art assets panel (e.g., `_include/assets/variables.css`)._'

  const componentsSection =
    components.length > 0
      ? components
          .map((c) => `- \`${c}\` — \`import ${c} from '@include/components/${c}'\``)
          .join('\n')
      : '_No shared components yet. Add them to `_include/components/`._'

  const assetsSection =
    assets.length > 0
      ? assets
          .map((a) => {
            const isCss = a.endsWith('.css')
            return isCss
              ? `- \`${a}\` — CSS file: \`import '@include/assets/${a}'\``
              : `- \`${a}\` — \`import asset from '@include/assets/${a}'\``
          })
          .join('\n')
      : '_No assets uploaded yet. Add images, fonts, and CSS files (for colors/typography) to the Art assets panel._'

  const screensSection =
    screens.length > 0
      ? screens.map((s) => `- \`${s.relPath}\` — ${s.name}`).join('\n')
      : '_No screens yet. Create a subfolder with an `index.tsx` file._'

  return `# Section: ${sectionName}

**Project**: ${projectName}
**Description**: ${description || '_No description provided._'}

## Screens in This Section

${screensSection}

## Shared Components

Reusable UI components for this section:

${componentsSection}

## Assets

Images and media files available to import:

${assetsSection}

## CSS Variables

Use these design tokens for consistent styling:

${cssVarsSection}

## Scope for Claude Code Agents

When working in Claude Code, **stay in your lane**: you may edit screens, shared components, and shared styles upon the user's request. However, you **cannot** edit the external build system, preview server, or Prototoy frame itself — these are managed by the parent app and should never be modified.

- ✅ **You CAN**: Create/edit screens in this section, add shared components to \`_include/components/\`, add/edit CSS files in \`_include/assets/\`
- ❌ **You CANNOT**: Modify \`.prototoy/\` config, package.json, build scripts, webpack/vite config, or any Prototoy infrastructure

## Instructions

Write each screen as a **default-export React component** in its \`index.tsx\`. Follow these rules:

- Use **inline CSS styles** and **CSS custom properties** for all styling.
- Do **NOT** use component libraries (shadcn, Material UI, Tailwind, Chakra, etc.) — this is a custom design prototype and pre-built components will make it feel generic.
- When you have any question about a **color, spacing, size, border radius, font, or other visual detail**, ask the user rather than guessing or falling back to defaults. The user has a specific design in mind.
- **Store colors and fonts as CSS variables** in CSS files in the \`_include/assets/\` folder (e.g., \`_include/assets/colors.css\` or \`_include/assets/typography.css\`), then import them in your screens with \`import '@include/assets/colors.css'\`. This keeps design tokens centralized and reusable across all screens.

### Mobile-First Responsive Design

Design **mobile-first** using CSS media queries:

- Start with styles optimized for the base viewport (416×754px)
- Use CSS variables for flexible sizing
- Add media queries for larger screens: \`@media (min-width: 768px) { ... }\`
- Use flexbox and grid with \`flex-wrap\` and \`flex-direction\` for responsive layouts
- Avoid fixed widths; prefer \`max-width\` with percentages or CSS variables
- Test at different viewport sizes by resizing the window

Example:
\`\`\`jsx
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sp-4)',
  padding: 'var(--sp-4)',
  maxWidth: '100%',
  '@media (min-width: 768px)': {
    flexDirection: 'row',
    padding: 'var(--sp-8)'
  }
}}>
  {/* content */}
</div>
\`\`\`

- Import shared components via \`@include/components/Name\`, assets via \`@include/assets/filename\`
- You can inspect available files directly: \`ls ./_include/assets/\` and \`ls ./_include/components/\`

## Linking Between Screens

To create interactive navigation between screens:

1. **Find the target screen's path**: The URL for each screen is derived from its folder structure. For example:
   - A screen at \`Onboarding/Welcome/index.tsx\` has URL path \`/Onboarding/Welcome\`
   - A screen at \`Settings/Profile/index.tsx\` has URL path \`/Settings/Profile\`

2. **Create navigation links** using a simple link component or button:
   \`\`\`jsx
   <a href="/SectionName/ScreenName" style={{ textDecoration: 'none' }}>
     <button>Go to next screen</button>
   </a>
   \`\`\`
   Or with an onClick handler:
   \`\`\`jsx
   <button onClick={() => window.location.href = '/SectionName/ScreenName'}>
     Next
   </button>
   \`\`\`

3. **Use relative paths** if linking within the same section:
   \`\`\`jsx
   <a href="/SectionName/OtherScreen">Link</a>
   \`\`\`

4. **Return to a previous screen** using the browser back button:
   \`\`\`jsx
   <button onClick={() => window.history.back()}>Back</button>
   \`\`\`

The preview automatically handles routing — just use standard HTML anchors or \`window.location.href\` to navigate, and the preview will load the target screen in the iPhone frame.
`
}

export function writeSectionClaudeMd(
  sectionPath: string,
  projectPath: string,
  projectName: string
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
    description
  )
  fs.writeFileSync(path.join(sectionPath, 'CLAUDE.md'), content)
}

export function regenerateAllClaudeMds(
  projectPath: string,
  projectName: string
): void {
  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '_include') continue
      const childPath = path.join(dir, entry.name)
      if (fs.existsSync(path.join(childPath, 'folder.json'))) {
        writeSectionClaudeMd(childPath, projectPath, projectName)
        walk(childPath)
      }
    }
  }
  walk(projectPath)
}

export function generateSectionSkill(sectionPath: string): void {
  const skillDir = path.join(sectionPath, '.claude', 'skills')
  fs.mkdirSync(skillDir, { recursive: true })

  const skillContent = `---
name: review-changes
description: Review your changes and let the user decide if they look right
metadata:
  scope: section
---

Review your edits:
1. Show the user what changed in the code
2. Ask if the changes match their intent
3. Let them decide if further adjustments are needed

Don't run or build anything — just present the changes and wait for feedback.
`

  fs.writeFileSync(path.join(skillDir, 'review-changes.md'), skillContent)
}

export function regenerateAllSkills(projectPath: string): void {
  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '_include') continue
      const childPath = path.join(dir, entry.name)
      if (fs.existsSync(path.join(childPath, 'folder.json'))) {
        generateSectionSkill(childPath)
        walk(childPath)
      }
    }
  }
  walk(projectPath)
}

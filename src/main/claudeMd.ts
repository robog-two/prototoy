import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Per-section CLAUDE.md
//
// This file is loaded into *every* Claude Code conversation opened in a
// section, so it stays short: identity, hard constraints, and pointers only.
// Detailed how-to lives in the skills below (progressive disclosure), and
// live inventories (screens/components/assets/tokens) are discovered on demand
// rather than embedded here — Claude can read them from the filesystem.
// ---------------------------------------------------------------------------

export function generateSectionClaudeMd(
  sectionPath: string,
  projectName: string,
  description: string
): string {
  const sectionName = path.basename(sectionPath)

  return `# Section: ${sectionName}

This folder is one **section** of the Prototoy prototype **${projectName}**.
${description ? description : '_No section description provided._'}

## How this section works

- Each **screen** is a subfolder containing an \`index.tsx\` that **default-exports a React component**.
- Shared components and assets live in \`_include/\` and are imported via the \`@include/...\` alias.
- The preview routes by folder path — a screen at \`Onboarding/Welcome/index.tsx\` is served at \`/Onboarding/Welcome\`.

## Scope — stay in your lane

**IMPORTANT:** You work only on prototype content. You **MUST NOT** touch Prototoy's infrastructure.

- ✅ **CAN**: create/edit screens in this section, add shared components to \`_include/components/\`, add/edit CSS files in \`_include/assets/\`.
- ❌ **CANNOT**: modify \`.prototoy/\` config, \`package.json\`, build scripts, vite/webpack config, the preview server, or any Prototoy infrastructure — the parent app manages these.

## Non-negotiable style rules

- Style with **inline styles and CSS custom properties only**. Keep colors/fonts/spacing as CSS variables in \`_include/assets/\` and import them.
- **Do NOT use component libraries** (shadcn, Material UI, Tailwind, Chakra, etc.). This is a bespoke design — pre-built components make it look generic.
- When unsure about any **visual detail** (color, spacing, size, radius, font), **ask the user** rather than guessing. They have a specific design in mind.

## Where to find more

Detailed workflows live in skills, loaded on demand:

- **building-screens** — writing and styling a screen, mobile-first responsive layout.
- **linking-screens** — navigation between screens.
- **shared-design-system** — using and extending \`_include/\` components, assets, and design tokens.
- **review-changes** — present your edits for the user to sign off.

Discover what already exists instead of guessing:

\`\`\`bash
ls _include/components/             # shared components
ls -R _include/assets/              # images, fonts, CSS files
cat _include/assets/variables.css   # design tokens (CSS variables)
\`\`\`
`
}

export function writeSectionClaudeMd(
  sectionPath: string,
  _projectPath: string,
  projectName: string
): void {
  const folderConfigPath = path.join(sectionPath, 'folder.json')
  let description = ''
  if (fs.existsSync(folderConfigPath)) {
    try {
      description = JSON.parse(fs.readFileSync(folderConfigPath, 'utf-8')).description || ''
    } catch {}
  }

  const content = generateSectionClaudeMd(sectionPath, projectName, description)
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

// ---------------------------------------------------------------------------
// Skills + subagent
//
// These are static (independent of project state), so they're constant
// templates written into each section's `.claude/`. They follow Anthropic's
// Agent Skills format: gerund `name`, a third-person `description` that says
// what the skill does *and* when to use it, and a body kept well under the
// 500-line guideline.
// ---------------------------------------------------------------------------

const BUILDING_SCREENS_SKILL = `---
name: building-screens
description: Guidance for creating and editing screens in a Prototoy section — the React component shape, inline-CSS and CSS-variable styling, the no-component-library rule, and mobile-first responsive layout. Use when creating, editing, or styling a screen (index.tsx).
---

# Building screens

Each screen is a subfolder with an \`index.tsx\` that **default-exports a React component**.

## Styling rules

- Use **inline styles** and **CSS custom properties** for all styling.
- **Never use component libraries** (shadcn, Material UI, Tailwind, Chakra, etc.). This is a bespoke design — pre-built components make it look generic.
- Keep colors, fonts, spacing, and radii as CSS variables in \`_include/assets/\` (see the \`shared-design-system\` skill) and reference them with \`var(--token)\`.
- When a visual detail (color, spacing, size, radius, font) isn't specified, **ask the user** — don't fall back to defaults.

## Mobile-first responsive design

Design **mobile-first**, then add larger breakpoints:

- Start from the base viewport (416×754px).
- Use CSS variables for flexible sizing; avoid fixed widths — prefer \`max-width\` with percentages or variables.
- Use flexbox/grid with \`flex-wrap\` and \`flex-direction\` for layouts that reflow.
- Test by resizing the preview window.

Inline style objects **cannot** hold media queries. Put base layout in inline styles, and breakpoint rules in a CSS file in \`_include/assets/\` that you import and target by class:

\`\`\`css
/* _include/assets/example.css */
.layout { flex-direction: column; padding: var(--sp-4); }
@media (min-width: 768px) {
  .layout { flex-direction: row; padding: var(--sp-8); }
}
\`\`\`

\`\`\`jsx
import '@include/assets/example.css'

export default function Example() {
  return (
    <div className="layout" style={{ display: 'flex', gap: 'var(--sp-4)', maxWidth: '100%' }}>
      {/* content */}
    </div>
  )
}
\`\`\`

For navigation between screens, see the \`linking-screens\` skill. For shared components, assets, and tokens, see \`shared-design-system\`.
`

const LINKING_SCREENS_SKILL = `---
name: linking-screens
description: How to create navigation between screens in a Prototoy prototype — deriving a screen's URL from its folder path, linking with anchors or window.location, and back navigation. Use when wiring up navigation, buttons, or links between screens.
---

# Linking between screens

The preview routes by folder structure, so a screen's URL is its path under the project:

- \`Onboarding/Welcome/index.tsx\` → \`/Onboarding/Welcome\`
- \`Settings/Profile/index.tsx\` → \`/Settings/Profile\`

## Navigate with a standard anchor

\`\`\`jsx
<a href="/SectionName/ScreenName" style={{ textDecoration: 'none' }}>
  <button>Go to next screen</button>
</a>
\`\`\`

Or programmatically:

\`\`\`jsx
<button onClick={() => { window.location.href = '/SectionName/ScreenName' }}>
  Next
</button>
\`\`\`

## Go back

\`\`\`jsx
<button onClick={() => window.history.back()}>Back</button>
\`\`\`

The preview handles routing automatically — use plain anchors or \`window.location.href\` and the target screen loads in the phone frame.
`

const SHARED_DESIGN_SYSTEM_SKILL = `---
name: shared-design-system
description: How to use and extend a Prototoy project's shared design system — importing shared components and assets via the @include alias, using CSS-variable design tokens, and discovering what already exists. Use when importing shared components or assets, using design tokens, or adding new shared resources.
---

# Shared design system

Shared code and assets live in the project's \`_include/\` folder (symlinked into every section) and are imported via the \`@include\` alias.

## Discover what exists

Always check before creating something new or guessing a name:

\`\`\`bash
ls _include/components/             # shared React components
ls -R _include/assets/              # images, fonts, CSS files
cat _include/assets/variables.css   # design tokens (CSS custom properties)
\`\`\`

## Import conventions

- **Component:** \`import ComponentName from '@include/components/ComponentName'\`
- **Image / font / other asset:** \`import asset from '@include/assets/file.png'\`
- **CSS file (tokens, fonts):** \`import '@include/assets/file.css'\`

## Design tokens

Colors, fonts, spacing, and radii are CSS custom properties defined in \`_include/assets/variables.css\` (and any other CSS files there). Reference them with \`var(--token-name)\` and import the CSS file in the screen.

## Adding new shared resources

- New reusable component → add a \`.tsx\` file to \`_include/components/\`.
- New token → add a CSS variable to \`_include/assets/variables.css\` (or another CSS file there).
- New image/font → place it in \`_include/assets/\` (in the app, use the Art assets panel).

Centralizing tokens and components here keeps every screen consistent and reusable.
`

const REVIEW_CHANGES_SKILL = `---
name: review-changes
description: Presents the edits made to screens so the user can decide whether they match their intent, without building or running anything. Use when you have finished a set of screen changes and want the user to sign off.
---

# Review changes

Walk the user through what you changed and let them decide:

1. Show what changed in the code — the screens/components you edited and the key differences.
2. Ask whether the changes match their intent.
3. Let them decide if further adjustments are needed.

Don't run or build anything — just present the changes and wait for feedback.
`

const SCREEN_REVIEWER_AGENT = `---
name: screen-reviewer
description: Reviews changes to screens in a fresh context for adherence to this prototype's design constraints (inline CSS and CSS variables, no component libraries, correct @include usage, design tokens) and flags correctness gaps. Use after editing a screen to get an independent review.
tools: Read, Grep, Glob, Bash
---

You are reviewing edits to screens in a Prototoy prototype. You did not write this code — evaluate it on its own terms.

Check the changed screens against these constraints:

- **Styling:** inline styles and CSS custom properties only. Flag any component library (shadcn, Material UI, Tailwind, Chakra, etc.).
- **Design tokens:** colors, fonts, spacing, and radii come from CSS variables in \`_include/assets/\` (read \`variables.css\`). Flag stray literals that duplicate an existing token.
- **Imports:** shared code and assets use the \`@include/...\` alias correctly (\`@include/components/...\`, \`@include/assets/...\`).
- **Component shape:** each screen \`index.tsx\` default-exports a React component.
- **Scope:** no edits to Prototoy infrastructure (\`.prototoy/\`, \`package.json\`, build/vite config, the preview server).
- **Responsive:** layouts are mobile-first; media queries live in CSS files, not inline style objects.

Report only gaps that affect correctness or violate these constraints — don't invent style preferences or over-engineer. For each finding give the file, the issue, and a concrete fix. If everything holds, say so plainly.
`

function writeSkill(skillsDir: string, name: string, body: string): void {
  const dir = path.join(skillsDir, name)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'SKILL.md'), body)
}

// Writes the on-demand skills and the verification subagent into a section's
// `.claude/` directory, and removes the legacy flat skill file if present.
export function generateSectionResources(sectionPath: string): void {
  const skillsDir = path.join(sectionPath, '.claude', 'skills')
  fs.mkdirSync(skillsDir, { recursive: true })

  writeSkill(skillsDir, 'building-screens', BUILDING_SCREENS_SKILL)
  writeSkill(skillsDir, 'linking-screens', LINKING_SCREENS_SKILL)
  writeSkill(skillsDir, 'shared-design-system', SHARED_DESIGN_SYSTEM_SKILL)
  writeSkill(skillsDir, 'review-changes', REVIEW_CHANGES_SKILL)

  // Migrate away from the old flat-file skill format.
  const legacyReview = path.join(skillsDir, 'review-changes.md')
  try {
    if (fs.existsSync(legacyReview)) fs.unlinkSync(legacyReview)
  } catch {
    /* non-fatal */
  }

  const agentsDir = path.join(sectionPath, '.claude', 'agents')
  fs.mkdirSync(agentsDir, { recursive: true })
  fs.writeFileSync(path.join(agentsDir, 'screen-reviewer.md'), SCREEN_REVIEWER_AGENT)
}

export function regenerateAllSkills(projectPath: string): void {
  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '_include') continue
      const childPath = path.join(dir, entry.name)
      if (fs.existsSync(path.join(childPath, 'folder.json'))) {
        generateSectionResources(childPath)
        walk(childPath)
      }
    }
  }
  walk(projectPath)
}

// Accident guards for Claude Code hooks. Not a security boundary: see the kit README.
import { readFileSync } from 'node:fs'
import path from 'node:path'

const COMMAND_START = String.raw`(?:^|[;&|(\n]\s*)`
const RM_RECURSIVE_FORCE = String.raw`\brm\s+(?:-[a-zA-Z]*(?:rf|fr)[a-zA-Z]*|-r\s+-f|-f\s+-r|--recursive\s+--force|--force\s+--recursive)\s+`

const ALWAYS_BLOCKED = [
  { pattern: /\bgit\s+push\b[^;&|\n]*(?:\s|:)(?:main|master)(?:\s|$)/, reason: 'Pushing to the main branch is not allowed. Use a pull request.' },
  { pattern: /\bgit\s+push\b[^;&|\n]*\s(?:--force(?:-with-lease)?|-f)(?:\s|=|$)/, reason: 'Force pushing is not allowed.' },
  { pattern: /(?:^|\s)--no-verify(?:\s|$)/, reason: 'Skipping git hooks is not allowed. Fix the cause instead.' },
  { pattern: /\bgit\s+config\s+--global\b/, reason: 'Changing global git configuration is not allowed.' },
  { pattern: new RegExp(`${RM_RECURSIVE_FORCE}(?:/|~|\\$HOME|\\.|\\.\\.|\\*)(?:/?\\*?)(?:\\s|$)`), reason: 'Recursively deleting a root, home or working directory is not allowed.' },
  { pattern: /\bgh\s+auth\s+token\b/, reason: 'Reading the GitHub token is not allowed.' },
  { pattern: /\bgh\s+pr\s+merge\b/, reason: 'Merging is done by the orchestrator or a human.' },
  { pattern: /\bgh\s+api\b[^;&|\n]*\/statuses\//, reason: 'Setting commit statuses is done by the orchestrator.' },
]

const AGENT_BLOCKED = [
  { pattern: new RegExp(`${COMMAND_START}gh\\s`), reason: 'Pipeline agents do not use gh. The orchestrator talks to GitHub.' },
  { pattern: /\bgit\s+push\b/, reason: 'Pipeline agents do not push. The orchestrator handles it.' },
]

export function checkCommand(command, { agentMode = false } = {}) {
  const rules = agentMode ? [...ALWAYS_BLOCKED, ...AGENT_BLOCKED] : ALWAYS_BLOCKED
  return rules.find((rule) => rule.pattern.test(command))?.reason ?? null
}

function toRelative(filePath, projectDir) {
  const relative = path.relative(path.resolve(projectDir), path.resolve(projectDir, filePath))
  return relative.split(path.sep).join('/')
}

function matchesEntry(relative, entry) {
  return entry.endsWith('/') ? relative.startsWith(entry) : relative === entry
}

export function checkPath(tool, filePath, { projectDir, protectedPaths = [], agentMode = false }) {
  const relative = toRelative(filePath, projectDir)
  const name = path.posix.basename(relative)

  if (/^\.env(\..+)?$/.test(name) && name !== '.env.example') {
    return `${relative} may contain secrets and is off limits.`
  }
  if (agentMode && tool !== 'Read' && protectedPaths.some((entry) => matchesEntry(relative, entry))) {
    return `${relative} is a protected path. Report that it needs changing instead.`
  }
  return null
}

export function loadProtectedPaths(projectDir) {
  try {
    const config = JSON.parse(readFileSync(path.join(projectDir, 'project.config.json'), 'utf8'))
    return config.protectedPaths ?? []
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

export async function runHook(decide) {
  try {
    let raw = ''
    for await (const chunk of process.stdin) raw += chunk
    const reason = decide(JSON.parse(raw))
    if (reason) {
      process.stderr.write(`${reason}\n`)
      process.exit(2)
    }
  } catch (error) {
    // Fail closed: a guard that cannot decide must not wave a tool call through.
    process.stderr.write(`Guard failed, blocking: ${error.message}\n`)
    process.exit(2)
  }
}

export const isAgentMode = () => process.env.WF_AGENT === '1'

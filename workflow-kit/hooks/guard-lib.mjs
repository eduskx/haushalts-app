// Accident guards for Claude Code hooks. Not a security boundary: see the kit README.
import { readFileSync } from 'node:fs'
import path from 'node:path'

const COMMAND_START = String.raw`(?:^|[;&|(\n]\s*)(?:\w+=\S*\s+)*`
const GIT_PUSH = String.raw`\bgit\s+(?:-[cC]\s+\S+\s+)*push\b[^;&|\n]*`
const ENV_FILE = String.raw`(?:^|[\s<>'"=/])\.env(?!\.example(?:$|[\s;&|'")]))(?:\.[\w-]+)?(?=$|[\s;&|'")])`
const RM_RECURSIVE_FORCE = String.raw`\brm\s+(?:-[a-zA-Z]*(?:rf|fr)[a-zA-Z]*|-r\s+-f|-f\s+-r|--recursive\s+--force|--force\s+--recursive)\s+`

const ALWAYS_BLOCKED = [
  { pattern: new RegExp(`${GIT_PUSH}(?:\\s|:|\\+|refs/heads/)(?:main|master)(?=\\s|;|&|\\||$)`), reason: 'Pushing to the main branch is not allowed. Use a pull request.' },
  { pattern: new RegExp(`${GIT_PUSH}\\s(?:--force(?:-with-lease)?|-f|\\+\\S+)(?:\\s|=|$)`), reason: 'Force pushing is not allowed.' },
  { pattern: /(?:^|\s)--no-verify(?:\s|$)/, reason: 'Skipping git hooks is not allowed. Fix the cause instead.' },
  { pattern: /\bgit\s+config\s+--global\b/, reason: 'Changing global git configuration is not allowed.' },
  { pattern: new RegExp(`${RM_RECURSIVE_FORCE}(?:/|~|\\$HOME|\\.|\\.\\.|\\*)(?:/?\\*?)(?:\\s|$)`), reason: 'Recursively deleting a root, home or working directory is not allowed.' },
  { pattern: new RegExp(ENV_FILE), reason: 'Env files may contain secrets and are off limits.' },
  { pattern: new RegExp(`${COMMAND_START}gh\\s+auth\\s+token\\b`), reason: 'Reading the GitHub token is not allowed.' },
  { pattern: new RegExp(`${COMMAND_START}gh\\s+pr\\s+merge\\b`), reason: 'Merging is done by the orchestrator or a human.' },
  { pattern: new RegExp(`${COMMAND_START}gh\\s+api\\b[^;&|\\n]*/statuses/`), reason: 'Setting commit statuses is done by the orchestrator.' },
]

const AGENT_BLOCKED = [
  { pattern: new RegExp(`${COMMAND_START}gh\\s`), reason: 'Pipeline agents do not use gh. The orchestrator talks to GitHub.' },
  { pattern: new RegExp(GIT_PUSH), reason: 'Pipeline agents do not push. The orchestrator handles it.' },
]

// Shell commands that write to their file arguments. Best effort: a script can still get around it.
const WRITES_FILES = /(?:>|\b(?:sed\s+(?:-\S+\s+)*-i|tee|mv|cp|rm|ln|chmod|truncate|dd)\b)/

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Removes the paths a ticket may change, so that only the others can trigger a block.
// A path with ".." stays in, because it can lead out of the allowed folder.
function withoutAllowedPaths(command, allowedPaths) {
  return allowedPaths.reduce((rest, entry) => {
    const tail = entry.endsWith('/') ? String.raw`[^\s;&|'")]*` : ''
    const pattern = new RegExp(`(?<=^|[\\s<>'"=])(?:\\./)?${escapeRegex(entry)}${tail}(?=$|[\\s;&|'")])`, 'g')
    return rest.replace(pattern, (match) => (match.includes('..') ? match : ' '))
  }, command)
}

function writesProtectedPath(command, protectedPaths) {
  if (!WRITES_FILES.test(command)) return null
  return protectedPaths.find((entry) => {
    const escaped = escapeRegex(entry)
    return new RegExp(`(?:^|[\\s<>'"=/])(?:\\./)?${escaped}(?:$|[\\s;&|'")]|(?<=/)\\S)`).test(command)
  })
}

export function checkCommand(command, { agentMode = false, protectedPaths = [], allowedPaths = [] } = {}) {
  const rules = agentMode ? [...ALWAYS_BLOCKED, ...AGENT_BLOCKED] : ALWAYS_BLOCKED
  const reason = rules.find((rule) => rule.pattern.test(command))?.reason
  if (reason) return reason
  const hit = agentMode ? writesProtectedPath(withoutAllowedPaths(command, allowedPaths), protectedPaths) : null
  return hit ? `${hit} is a protected path. Report that it needs changing instead.` : null
}

function toRelative(filePath, projectDir) {
  const relative = path.relative(path.resolve(projectDir), path.resolve(projectDir, filePath))
  // A path inside a worktree counts as the same path in the main checkout.
  return relative.split(path.sep).join('/').replace(/^\.claude\/worktrees\/[^/]+\//, '')
}

export function matchesEntry(relative, entry) {
  return entry.endsWith('/') ? relative.startsWith(entry) : relative === entry
}

export function checkPath(tool, filePath, { projectDir, protectedPaths = [], allowedPaths = [], agentMode = false }) {
  const relative = toRelative(filePath, projectDir)
  const name = path.posix.basename(relative)

  if (/^\.env(\..+)?$/.test(name) && name !== '.env.example') {
    return `${relative} may contain secrets and is off limits.`
  }
  const isAllowed = allowedPaths.some((entry) => matchesEntry(relative, entry))
  if (agentMode && tool !== 'Read' && !isAllowed && protectedPaths.some((entry) => matchesEntry(relative, entry))) {
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

// Set by the orchestrator from the ticket's allowProtected line.
export const loadAllowedPaths = () => (process.env.WF_ALLOW_PROTECTED ?? '').split(',').filter(Boolean)

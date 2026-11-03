// wf check: the diff rules read git only and run no project code. commands.check runs code
// an agent wrote, so it stays out of any environment that holds credentials.
import { execFileSync, spawnSync } from 'node:child_process'
import { findForbiddenTerms } from '../checks/forbidden-terms.mjs'
import { matchesEntry } from '../hooks/guard-lib.mjs'

// Generated or test code does not count towards the diff limit.
const TEST_FILE = /(?:^|\/)(?:__tests__|tests?|e2e)\/|\.(?:test|spec)\.[^/]+$/
const LOCKFILE = /(?:^|\/)(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/
const SQL_FILE = /\.sql$/i
const SQL_COMMENT = /\/\*[\s\S]*?\*\/|--.*$/gm

const CREDENTIAL_NAME = /token|api_?key|secret|password|credential|private_?key/i
const PASSED_ENV = ['PATH', 'HOME', 'USER', 'SHELL', 'LANG', 'LC_ALL', 'TERM', 'TMPDIR', 'CI', 'PNPM_HOME']
const OUTPUT_TAIL = 8000

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
}

// Renames count as delete plus add, so moving a protected file away still shows up.
const diffArgs = (from) => ['diff', '--no-renames', '--no-ext-diff', '--no-textconv', from, 'HEAD']

export function resolveBase(cwd) {
  for (const ref of ['origin/HEAD', 'origin/main']) {
    const found = spawnSync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd })
    if (found.status === 0) return ref
  }
  return 'main'
}

export function loadConfigAt(cwd, ref) {
  return JSON.parse(git(cwd, 'show', `${ref}:project.config.json`))
}

function readNumstat(cwd, from) {
  return git(cwd, ...diffArgs(from), '--numstat', '-z')
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const [added, deleted, ...file] = entry.split('\t')
      // Binary files report "-" and count as no lines.
      return { file: file.join('\t'), lines: (Number(added) || 0) + (Number(deleted) || 0) }
    })
}

function addedText(cwd, from, file) {
  const diff = git(cwd, ...diffArgs(from), '--unified=0', '--', `:(literal)${file}`)
  const body = diff.slice(Math.max(diff.indexOf('\n@@'), 0))
  return body
    .split('\n')
    .filter((line) => line.startsWith('+'))
    .map((line) => line.slice(1))
    .join('\n')
}

// Checks statement by statement: a WHERE in a later statement must not excuse an earlier one.
function findDestructiveSql(text, patterns) {
  const stripped = text.replace(SQL_COMMENT, ' ')
  const statements = [...text.split(';'), ...stripped.split(';')]
  return patterns.filter((pattern) => {
    const regex = new RegExp(pattern, 'i')
    return statements.some((statement) => regex.test(statement))
  })
}

export function inspectDiff({ cwd, base, config, allowProtected = [] }) {
  const from = git(cwd, 'merge-base', base, 'HEAD').trim()
  const stats = readNumstat(cwd, from)
  const files = stats.map(({ file }) => file)
  const violations = []
  const reasons = []

  if (git(cwd, 'status', '--porcelain').trim()) {
    violations.push({ rule: 'uncommitted', detail: 'Uncommitted changes are not part of the diff.' })
  }

  const counted = stats.filter(({ file }) => !TEST_FILE.test(file) && !LOCKFILE.test(file))
  const diffLines = counted.reduce((sum, { lines }) => sum + lines, 0)
  const maxDiffLines = config.limits.maxDiffLines
  if (diffLines > maxDiffLines) {
    violations.push({ rule: 'limits.maxDiffLines', detail: `${diffLines} lines, limit ${maxDiffLines}` })
  }

  const isProtected = (file) => config.protectedPaths.some((entry) => matchesEntry(file, entry))
  const isAllowed = (file) => allowProtected.some((entry) => matchesEntry(file, entry))
  const protectedFiles = files.filter(isProtected)
  for (const file of protectedFiles) {
    reasons.push(`protectedPaths: ${file}`)
    if (!isAllowed(file)) violations.push({ rule: 'protectedPaths', detail: `${file} needs allowProtected` })
  }

  for (const file of files.filter((name) => SQL_FILE.test(name))) {
    for (const pattern of findDestructiveSql(addedText(cwd, from, file), config.destructiveSql ?? [])) {
      reasons.push(`destructiveSql: ${file} matches ${pattern}`)
    }
  }

  const changed = new Set(files)
  for (const { file, line, term } of findForbiddenTerms(cwd, config.forbiddenTerms ?? {})) {
    if (changed.has(file)) violations.push({ rule: 'forbiddenTerms', detail: `${file}:${line} contains "${term}"` })
  }

  return { base, files, diffLines, maxDiffLines, violations, human: { required: reasons.length > 0, reasons } }
}

// Returns why commands.check must not run here, or null. WF_SANDBOX is a marker against
// accidents and proves nothing: a keyring login stays invisible, only the sandbox keeps it out.
export function findCommandBlocker(env) {
  if (env.WF_SANDBOX !== '1') return 'WF_SANDBOX=1 is not set. It runs agent code, so only run it in the sandbox.'
  const names = Object.keys(env).filter((name) => env[name] && CREDENTIAL_NAME.test(name))
  return names.length > 0 ? `The environment holds credentials: ${names.join(', ')}` : null
}

// An allowlist, so that a credential under an unexpected name stays out as well.
export const strippedEnv = (env) =>
  Object.fromEntries(PASSED_ENV.filter((name) => env[name]).map((name) => [name, env[name]]))

export function runCheckCommand({ command, cwd, env }) {
  const result = spawnSync(command, {
    shell: true,
    cwd,
    env: strippedEnv(env),
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
  const passed = result.status === 0
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(-OUTPUT_TAIL)
  return passed ? { status: 'passed', code: 0 } : { status: 'failed', code: result.status, output }
}

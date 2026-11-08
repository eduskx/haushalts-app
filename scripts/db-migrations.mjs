// Copies module migrations from packages/kit/*/migrations into the app's
// supabase/migrations and pins them by hash, so a later edit of an already
// copied migration is caught by `pnpm rules`.
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')

function paths(root) {
  const supabase = path.join(root, 'apps/web/supabase')
  return { target: path.join(supabase, 'migrations'), lock: path.join(supabase, 'modules.lock.json') }
}

function readLock(file) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
}

function kitDependencies(kit, name) {
  const file = path.join(kit, name, 'package.json')
  if (!existsSync(file)) return []
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.peerDependencies }
  return Object.keys(deps)
    .filter((dep) => dep.startsWith('@kit/'))
    .map((dep) => dep.slice('@kit/'.length))
}

/** Module names, dependencies first, alphabetical as tie-break. Throws on a dependency cycle. */
function moduleOrder(kit) {
  const names = readdirSync(kit, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  const deps = new Map(names.map((name) => [name, kitDependencies(kit, name).filter((dep) => names.includes(dep))]))
  const ordered = []
  const visiting = []
  const visit = (name) => {
    if (ordered.includes(name)) return
    if (visiting.includes(name)) {
      throw new Error(`Dependency cycle between kit modules: ${[...visiting, name].join(' -> ')}`)
    }
    visiting.push(name)
    ;[...deps.get(name)].sort().forEach(visit)
    visiting.pop()
    ordered.push(name)
  }
  names.forEach(visit)
  return ordered
}

function sourceMigrations(root) {
  const kit = path.join(root, 'packages/kit')
  if (!existsSync(kit)) return []
  return moduleOrder(kit).flatMap((module) => {
    const dir = path.join(kit, module, 'migrations')
    if (!existsSync(dir)) return []
    return readdirSync(dir)
      .filter((name) => name.endsWith('.sql'))
      .sort()
      .map((name) => ({ key: `packages/kit/${module}/migrations/${name}`, module, name }))
  })
}

const PREFIX = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_/

function prefixTime(file) {
  const match = PREFIX.exec(file)
  if (!match) return 0
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number)
  return Date.UTC(year, month - 1, day, hour, minute, second)
}

function timestamp(time) {
  return new Date(time).toISOString().replace(/\D/g, '').slice(0, 14)
}

/** Copies migrations not yet installed, each with a version prefix newer than all existing ones. Returns the new file names. */
export function installModules(root, now = new Date()) {
  const { target, lock: lockFile } = paths(root)
  const lock = readLock(lockFile)
  const existing = [...readdirSync(target), ...Object.values(lock).map((entry) => entry.file)]
  const newest = Math.max(0, ...existing.map(prefixTime))
  const installed = []
  let tick = Math.max(Math.floor(now.getTime() / 1000) * 1000, newest + 1000)
  for (const { key, module, name } of sourceMigrations(root)) {
    if (lock[key]) continue
    const file = `${timestamp(tick)}_${module}_${name}`
    tick += 1000
    copyFileSync(path.join(root, key), path.join(target, file))
    lock[key] = { file, sha256: sha256(path.join(root, key)) }
    installed.push(file)
  }
  if (installed.length > 0) writeFileSync(lockFile, `${JSON.stringify(lock, null, 2)}\n`)
  return installed
}

/** Returns one message per copied migration whose source or copy no longer matches its recorded hash. */
export function verifyMigrations(root) {
  const { target, lock: lockFile } = paths(root)
  const problems = []
  for (const [key, entry] of Object.entries(readLock(lockFile))) {
    const source = path.join(root, key)
    const copy = path.join(target, entry.file)
    if (!existsSync(source) || sha256(source) !== entry.sha256) {
      problems.push(`${key} changed after it was copied. Add a new migration instead.`)
    }
    if (!existsSync(copy) || sha256(copy) !== entry.sha256) {
      problems.push(`${entry.file} differs from the recorded hash. Never edit a copied migration.`)
    }
  }
  return problems
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  if (process.argv[2] === 'verify') {
    const problems = verifyMigrations(root)
    problems.forEach((problem) => console.error(problem))
    process.exit(problems.length > 0 ? 1 : 0)
  }
  const installed = installModules(root)
  console.log(installed.length > 0 ? `Installed:\n${installed.join('\n')}` : 'Nothing to install.')
}

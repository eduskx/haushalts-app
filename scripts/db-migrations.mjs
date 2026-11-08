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

function sourceMigrations(root) {
  const kit = path.join(root, 'packages/kit')
  if (!existsSync(kit)) return []
  return readdirSync(kit, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const dir = path.join(kit, entry.name, 'migrations')
      if (!existsSync(dir)) return []
      return readdirSync(dir)
        .filter((name) => name.endsWith('.sql'))
        .sort()
        .map((name) => ({ key: `packages/kit/${entry.name}/migrations/${name}`, module: entry.name, name }))
    })
}

function timestamp(time) {
  return new Date(time).toISOString().replace(/\D/g, '').slice(0, 14)
}

/** Copies migrations not yet installed, with a unique timestamp prefix. Returns the new file names. */
export function installModules(root, now = new Date()) {
  const { target, lock: lockFile } = paths(root)
  const lock = readLock(lockFile)
  const installed = []
  let tick = now.getTime()
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

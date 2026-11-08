import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { installModules, verifyMigrations } from './db-migrations.mjs'

function repo() {
  const root = mkdtempSync(path.join(tmpdir(), 'db-migrations-'))
  mkdirSync(path.join(root, 'packages/kit/auth/migrations'), { recursive: true })
  mkdirSync(path.join(root, 'apps/web/supabase/migrations'), { recursive: true })
  writeFileSync(path.join(root, 'packages/kit/auth/migrations/0001_init.sql'), 'select 1;')
  return root
}

const copies = (root) => readdirSync(path.join(root, 'apps/web/supabase/migrations'))
const at = (iso) => new Date(iso)

describe('db:install-modules', () => {
  it('copies a module migration with a timestamp in the file name', () => {
    const root = repo()
    installModules(root, at('2026-11-08T10:00:00Z'))
    assert.deepEqual(copies(root), ['20261108100000_auth_0001_init.sql'])
  })

  it('does not copy an already copied migration again', () => {
    const root = repo()
    installModules(root, at('2026-11-08T10:00:00Z'))
    const second = installModules(root, at('2026-11-09T10:00:00Z'))
    assert.deepEqual(second, [])
    assert.equal(copies(root).length, 1)
  })

  it('copies only the new migration on a later run', () => {
    const root = repo()
    installModules(root, at('2026-11-08T10:00:00Z'))
    writeFileSync(path.join(root, 'packages/kit/auth/migrations/0002_more.sql'), 'select 2;')
    assert.equal(installModules(root, at('2026-11-09T10:00:00Z')).length, 1)
    assert.equal(copies(root).length, 2)
  })
})

describe('install order and versions', () => {
  const kitModule = (root, name, deps = {}) => {
    mkdirSync(path.join(root, `packages/kit/${name}/migrations`), { recursive: true })
    writeFileSync(path.join(root, `packages/kit/${name}/package.json`), JSON.stringify({ name: `@kit/${name}`, dependencies: deps }))
    writeFileSync(path.join(root, `packages/kit/${name}/migrations/0001_init.sql`), `select '${name}';`)
  }

  it('copies a dependency before the module that needs it', () => {
    const root = repo()
    kitModule(root, 'core')
    kitModule(root, 'auth', { '@kit/core': 'workspace:*' })
    const files = installModules(root, at('2026-11-08T10:00:00Z'))
    assert.deepEqual(files.map((file) => file.split('_')[1]), ['core', 'auth'])
  })

  it('fails with a clear message on a dependency cycle', () => {
    const root = repo()
    kitModule(root, 'a', { '@kit/b': 'workspace:*' })
    kitModule(root, 'b', { '@kit/a': 'workspace:*' })
    assert.throws(() => installModules(root), /cycle/)
  })

  it('never reuses a version prefix within the same second', () => {
    const root = repo()
    const first = installModules(root, at('2026-11-08T10:00:00Z'))
    writeFileSync(path.join(root, 'packages/kit/auth/migrations/0002_more.sql'), 'select 2;')
    const second = installModules(root, at('2026-11-08T10:00:00Z'))
    assert.ok(second[0].slice(0, 14) > first[0].slice(0, 14))
  })
})

describe('migration hash comparison', () => {
  it('passes for untouched migrations', () => {
    const root = repo()
    installModules(root)
    assert.deepEqual(verifyMigrations(root), [])
  })

  it('fails when the source of a copied migration changes', () => {
    const root = repo()
    installModules(root)
    writeFileSync(path.join(root, 'packages/kit/auth/migrations/0001_init.sql'), 'select 99;')
    assert.equal(verifyMigrations(root).length, 1)
  })

  it('fails when the copy is edited', () => {
    const root = repo()
    const [file] = installModules(root)
    writeFileSync(path.join(root, 'apps/web/supabase/migrations', file), 'select 99;')
    assert.equal(verifyMigrations(root).length, 1)
  })
})

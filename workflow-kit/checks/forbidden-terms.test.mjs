import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { findForbiddenTerms } from './forbidden-terms.mjs'

function project(files) {
  const dir = mkdtempSync(path.join(tmpdir(), 'terms-'))
  const config = { forbiddenTerms: { paths: ['packages/'], terms: ['partner'] } }
  writeFileSync(path.join(dir, 'project.config.json'), JSON.stringify(config))
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), content)
  }
  return dir
}

describe('findForbiddenTerms', () => {
  it('finds a term under a listed path, with file and line', () => {
    const dir = project({ 'packages/kit/a/x.ts': 'ok\nconst partner = 1\n' })
    assert.deepEqual(findForbiddenTerms(dir), [{ file: 'packages/kit/a/x.ts', line: 2, term: 'partner' }])
  })

  it('ignores case and matches inside identifiers', () => {
    const dir = project({ 'packages/kit/a/x.ts': 'const myPartnerId = 1\n' })
    assert.equal(findForbiddenTerms(dir).length, 1)
  })

  it('accepts the same file outside the listed paths', () => {
    const dir = project({ 'apps/web/x.ts': 'const partner = 1\n' })
    assert.deepEqual(findForbiddenTerms(dir), [])
  })

  it('skips dependencies and build output', () => {
    const dir = project({ 'packages/kit/a/node_modules/b/x.js': 'partner', 'packages/kit/a/dist/x.js': 'partner' })
    assert.deepEqual(findForbiddenTerms(dir), [])
  })

  it('passes when the listed path does not exist', () => {
    assert.deepEqual(findForbiddenTerms(project({})), [])
  })
})

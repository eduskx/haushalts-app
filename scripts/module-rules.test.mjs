// Proves that the machine checks in `pnpm check` fail on real violations.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bin = (name) => path.join(root, 'node_modules/.bin', name)

function project(files) {
  const dir = mkdtempSync(path.join(tmpdir(), 'rules-'))
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), content)
  }
  return dir
}

function cruise(files) {
  const dir = project(files)
  return spawnSync(bin('depcruise'), ['packages', 'apps', '--config', path.join(root, '.dependency-cruiser.cjs')], {
    cwd: dir,
    encoding: 'utf8',
  })
}

const fails = (name, files, rule) =>
  it(`fails: ${name}`, () => {
    const result = cruise(files)
    assert.equal(result.status > 0, true, result.stdout + result.stderr)
    assert.match(result.stdout, new RegExp(rule))
  })

const passes = (name, files) =>
  it(`passes: ${name}`, () => {
    const result = cruise(files)
    assert.equal(result.status, 0, result.stdout + result.stderr)
  })

const baseline = { 'apps/web/main.js': 'export {}\n' }

describe('dependency rules', () => {
  fails('kit imports a feature', {
    ...baseline,
    'packages/kit/core/a.js': "import '../../features/lists/b.js'\n",
    'packages/features/lists/b.js': 'export {}\n',
  }, 'kit-not-to-features')

  fails('packages import an app', {
    'packages/kit/core/a.js': "import '../../../apps/web/main.js'\n",
    ...baseline,
  }, 'packages-not-to-apps')

  fails('a feature imports another feature', {
    ...baseline,
    'packages/features/lists/a.js': "import '../chores/b.js'\n",
    'packages/features/chores/b.js': 'export {}\n',
  }, 'features-not-to-features')

  fails('a kit package imports outside its table row', {
    ...baseline,
    'packages/kit/core/a.js': "import '../ui/b.js'\n",
    'packages/kit/ui/b.js': 'export {}\n',
  }, 'kit-core-imports')

  fails('a kit package missing from the table imports another kit package', {
    ...baseline,
    'packages/kit/unknown/a.js': "import '../core/b.js'\n",
    'packages/kit/core/b.js': 'export {}\n',
  }, 'kit-package-not-in-contract')

  passes('a kit package imports what its row allows, a feature imports the kit, an app imports everything', {
    'packages/kit/config/c.js': 'export {}\n',
    'packages/kit/core/a.js': "import '../config/c.js'\n",
    'packages/kit/ui/b.js': "import '../core/a.js'\n",
    'packages/features/lists/d.js': "import '../../kit/ui/b.js'\n",
    'apps/web/main.js': "import '../../packages/features/lists/d.js'\n",
  })

  it('fails on a workspace package import, not only on relative paths', () => {
    const dir = project({
      ...baseline,
      'packages/kit/core/a.js': "import '@feature/lists'\n",
      'packages/features/lists/package.json': '{"name":"@feature/lists","main":"b.js"}',
      'packages/features/lists/b.js': 'export {}\n',
    })
    mkdirSync(path.join(dir, 'node_modules/@feature'), { recursive: true })
    symlinkSync(path.join(dir, 'packages/features/lists'), path.join(dir, 'node_modules/@feature/lists'))
    const result = spawnSync(bin('depcruise'), ['packages', 'apps', '--config', path.join(root, '.dependency-cruiser.cjs')], {
      cwd: dir,
      encoding: 'utf8',
    })
    assert.equal(result.status > 0, true, result.stdout + result.stderr)
    assert.match(result.stdout, /kit-not-to-features/)
  })
})

describe('knip', () => {
  it('reports an unused export as an error', () => {
    const dir = project({
      'package.json': '{"name":"t","private":true,"workspaces":["packages/kit/*"]}',
      'packages/kit/core/package.json': '{"name":"@kit/core","exports":{".":"./src/index.ts"}}',
      'packages/kit/core/src/index.ts': "export { used } from './helper.ts'\n",
      'packages/kit/core/src/helper.ts': 'export const used = 1\nexport const unused = 2\n',
    })
    cpSync(path.join(root, 'knip.json'), path.join(dir, 'knip.json'))
    const result = spawnSync(bin('knip'), [], { cwd: dir, encoding: 'utf8' })
    assert.equal(result.status > 0, true, result.stdout + result.stderr)
    assert.match(result.stdout, /unused/)
  })
})

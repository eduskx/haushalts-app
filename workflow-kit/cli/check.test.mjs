import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { findCommandBlocker, inspectDiff, loadConfigAt, runCheckCommand } from './check.mjs'
import { main } from './wf.mjs'

const baseConfig = {
  commands: { check: 'true' },
  limits: { maxDiffLines: 5 },
  protectedPaths: ['locked/', 'LOCK.md', 'project.config.json'],
  destructiveSql: ['\\bdrop\\s+table\\b', '\\bdelete\\s+from\\b(?![\\s\\S]*\\bwhere\\b)'],
  forbiddenTerms: { paths: ['lib/'], terms: ['banned'] },
}

function write(dir, files) {
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), content)
  }
}

const run = (dir, ...args) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd: dir, encoding: 'utf8' })

function commitAll(dir, message) {
  run(dir, 'add', '-A')
  run(dir, 'commit', '-q', '--allow-empty', '-m', message)
}

// A repo with a base branch and one commit of changes on top of it.
function repo(changes, { config = baseConfig, initial = {} } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'wf-check-'))
  run(dir, 'init', '-q', '-b', 'main')
  write(dir, { 'project.config.json': JSON.stringify(config), 'README.md': 'x\n', ...initial })
  commitAll(dir, 'base')
  run(dir, 'switch', '-q', '-c', 'work')
  write(dir, changes)
  commitAll(dir, 'work')
  return dir
}

const inspect = (dir, allowProtected) => inspectDiff({ cwd: dir, base: 'main', config: baseConfig, allowProtected })
const rules = (result) => result.violations.map(({ rule }) => rule)
const lines = (count) => 'line\n'.repeat(count)

describe('inspectDiff', () => {
  it('passes a small harmless diff without a human', () => {
    const result = inspect(repo({ 'src/a.ts': lines(5) }))
    assert.deepEqual(result.violations, [])
    assert.equal(result.human.required, false)
    assert.equal(result.diffLines, 5)
  })

  it('fails above maxDiffLines', () => {
    assert.deepEqual(rules(inspect(repo({ 'src/a.ts': lines(6) }))), ['limits.maxDiffLines'])
  })

  it('does not count tests and lockfiles towards the limit', () => {
    const result = inspect(
      repo({
        'src/a.test.ts': lines(50),
        'src/tests/b.ts': lines(50),
        'supabase/tests/c.sql': lines(50),
        'pnpm-lock.yaml': lines(50),
        'src/d.ts': lines(1),
      }),
    )
    assert.equal(result.diffLines, 1)
    assert.deepEqual(result.violations, [])
  })

  it('sends protected paths to a human and fails them without allowProtected', () => {
    const result = inspect(repo({ 'locked/a.md': 'x\n' }))
    assert.deepEqual(rules(result), ['protectedPaths'])
    assert.equal(result.human.required, true)
  })

  it('still sends allowed protected paths to a human', () => {
    const result = inspect(repo({ 'locked/a.md': 'x\n', 'LOCK.md': 'x\n' }), ['locked/', 'LOCK.md'])
    assert.deepEqual(result.violations, [])
    assert.equal(result.human.required, true)
  })

  it('allowProtected opens only what it names', () => {
    const result = inspect(repo({ 'locked/a.md': 'x\n', 'locked/b.md': 'x\n' }), ['locked/a.md'])
    assert.deepEqual(result.violations.map(({ detail }) => detail), ['locked/b.md needs allowProtected'])
  })

  it('notices a protected file that was renamed away', () => {
    const dir = repo({}, { initial: { 'locked/a.md': lines(3) } })
    run(dir, 'mv', 'locked/a.md', 'free.md')
    commitAll(dir, 'move')
    assert.equal(inspect(dir).human.required, true)
  })

  it('compares with the merge base, so newer base commits do not count', () => {
    const dir = repo({ 'src/a.ts': 'x\n' })
    run(dir, 'switch', '-q', 'main')
    write(dir, { 'locked/new.md': lines(20) })
    commitAll(dir, 'newer')
    run(dir, 'switch', '-q', 'work')
    const result = inspect(dir)
    assert.deepEqual(result.files, ['src/a.ts'])
    assert.equal(result.human.required, false)
  })

  describe('destructive SQL', () => {
    const humanFor = (sql, options) => inspect(repo({ 'db/1.sql': sql }, options)).human.required

    it('finds it case-insensitively and across lines', () => {
      assert.equal(humanFor('DROP TABLE a;\n'), true)
      assert.equal(humanFor('drop\n  table a;\n'), true)
    })

    it('finds it behind a comment in the middle', () => {
      assert.equal(humanFor('drop /* x */ table a;\n'), true)
    })

    it('leaves harmless SQL alone', () => {
      assert.equal(humanFor('create table a (id int);\n'), false)
      assert.equal(humanFor('delete from a where id = 1;\n'), false)
    })

    it('does not let a later WHERE excuse an earlier delete', () => {
      assert.equal(humanFor('delete from a;\ndelete from b where id = 1;\n'), true)
    })

    it('reads only added lines', () => {
      const dir = repo({ 'db/1.sql': 'select 1;\n' }, { initial: { 'db/1.sql': 'drop table a;\n' } })
      assert.equal(inspect(dir).human.required, false)
    })

    it('ignores other file types', () => {
      assert.equal(inspect(repo({ 'docs/a.md': 'drop table a\n' })).human.required, false)
    })
  })

  describe('forbidden terms', () => {
    it('fails on a changed file', () => {
      assert.deepEqual(rules(inspect(repo({ 'lib/a.ts': 'const Banned = 1\n' }))), ['forbiddenTerms'])
    })

    it('ignores files outside the configured paths and unchanged files', () => {
      assert.deepEqual(rules(inspect(repo({ 'src/a.ts': 'banned\n' }))), [])
      const dir = repo({ 'src/a.ts': 'x\n' }, { initial: { 'lib/old.ts': 'banned\n' } })
      assert.deepEqual(rules(inspect(dir)), [])
    })
  })

  it('fails on uncommitted changes', () => {
    const dir = repo({ 'src/a.ts': 'x\n' })
    write(dir, { 'lib/hidden.ts': 'banned\n' })
    assert.ok(rules(inspect(dir)).includes('uncommitted'))
  })

  it('skips deleted files instead of crashing', () => {
    const dir = repo({}, { initial: { 'lib/a.ts': 'x\n' } })
    rmSync(path.join(dir, 'lib/a.ts'))
    commitAll(dir, 'delete')
    assert.deepEqual(inspect(dir).violations, [])
  })
})

describe('loadConfigAt', () => {
  it('reads the config of the base, not of the checkout', () => {
    const loosened = { ...baseConfig, protectedPaths: [] }
    const dir = repo({ 'project.config.json': JSON.stringify(loosened) })
    assert.deepEqual(loadConfigAt(dir, 'main').protectedPaths, baseConfig.protectedPaths)
  })
})

describe('findCommandBlocker', () => {
  it('refuses without the sandbox marker', () => {
    assert.match(findCommandBlocker({ PATH: '/bin' }), /WF_SANDBOX/)
  })

  for (const name of ['GH_TOKEN', 'GITHUB_TOKEN', 'LINEAR_API_KEY', 'SUPABASE_SERVICE_SECRET', 'SOME_PASSWORD']) {
    it(`refuses with ${name} in the environment, even with the marker`, () => {
      assert.match(findCommandBlocker({ WF_SANDBOX: '1', [name]: 'value' }), new RegExp(name))
    })
  }

  it('allows a marked environment without credentials', () => {
    assert.equal(findCommandBlocker({ WF_SANDBOX: '1', PATH: '/bin', GH_TOKEN: '' }), null)
  })
})

describe('runCheckCommand', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'wf-cmd-'))
  const env = { PATH: process.env.PATH, ANYTHING_ELSE: 'visible' }

  it('reports success', () => {
    assert.equal(runCheckCommand({ command: 'true', cwd: dir, env }).status, 'passed')
  })

  it('reports failure with code and output', () => {
    const result = runCheckCommand({ command: 'echo broken; exit 3', cwd: dir, env })
    assert.equal(result.status, 'failed')
    assert.equal(result.code, 3)
    assert.match(result.output, /broken/)
  })

  it('passes only known variables to the command', () => {
    assert.equal(runCheckCommand({ command: 'test -z "$ANYTHING_ELSE"', cwd: dir, env }).status, 'passed')
  })
})

describe('wf check', () => {
  async function check(dir, args, env = {}) {
    const out = []
    const code = await main(['check', '--base', 'main', '--json', ...args], {
      cwd: dir,
      env: { PATH: process.env.PATH, ...env },
      out: (line) => out.push(line),
    })
    return { code, result: JSON.parse(out[0]) }
  }

  it('does not run the command outside the sandbox and fails', async () => {
    const marker = 'ran.txt'
    const config = { ...baseConfig, commands: { check: `touch ${marker}` } }
    const dir = repo({ 'src/a.ts': 'x\n' }, { config })
    const { code, result } = await check(dir, [])
    assert.equal(code, 1)
    assert.equal(result.command.status, 'not_run')
    assert.equal(result.ok, false)
    assert.throws(() => execFileSync('test', ['-e', path.join(dir, marker)]))
  })

  it('does not run the command with a token in the environment', async () => {
    const dir = repo({ 'src/a.ts': 'x\n' })
    const { result } = await check(dir, [], { WF_SANDBOX: '1', GH_TOKEN: 'value' })
    assert.equal(result.command.status, 'not_run')
    assert.match(result.command.reason, /GH_TOKEN/)
  })

  it('runs the command in the sandbox', async () => {
    const { code, result } = await check(repo({ 'src/a.ts': 'x\n' }), [], { WF_SANDBOX: '1' })
    assert.equal(code, 0)
    assert.equal(result.command.status, 'passed')
    assert.equal(result.human.required, false)
  })

  it('fails when the command fails', async () => {
    const config = { ...baseConfig, commands: { check: 'false' } }
    const { code, result } = await check(repo({ 'src/a.ts': 'x\n' }, { config }), [], { WF_SANDBOX: '1' })
    assert.equal(code, 1)
    assert.equal(result.violations[0].rule, 'commands.check')
  })

  it('--diff-only judges the diff and needs neither marker nor command', async () => {
    const { code, result } = await check(repo({ 'src/a.ts': 'x\n' }), ['--diff-only'], { GH_TOKEN: 'value' })
    assert.equal(code, 0)
    assert.equal(result.command.status, 'skipped')
  })

  it('takes allowProtected from the flag', async () => {
    const dir = repo({ 'locked/a.md': 'x\n' })
    assert.equal((await check(dir, ['--diff-only'])).code, 1)
    const { code, result } = await check(dir, ['--diff-only', '--allow-protected', 'locked/a.md,other.md'])
    assert.equal(code, 0)
    assert.equal(result.human.required, true)
  })

  it('judges by the base config even if the diff loosens it', async () => {
    const loosened = { ...baseConfig, protectedPaths: [], limits: { maxDiffLines: 9999 } }
    const dir = repo({ 'project.config.json': JSON.stringify(loosened), 'locked/a.md': lines(20) })
    const { code, result } = await check(dir, ['--diff-only'])
    assert.equal(code, 1)
    assert.equal(result.human.required, true)
    assert.equal(result.maxDiffLines, 5)
  })
})

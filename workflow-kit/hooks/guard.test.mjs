import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { checkCommand, checkPath } from './guard-lib.mjs'

describe('checkCommand', () => {
  const blocked = [
    'git push origin main',
    'git push origin HEAD:main',
    'git push -u origin master',
    'git push --force origin feature',
    'git push -f',
    'git push --force-with-lease',
    'git commit --no-verify -m x',
    'git config --global user.name x',
    'rm -rf /',
    'rm -rf ~',
    'rm -fr .',
    'rm -r -f $HOME',
    'gh auth token',
    'gh pr merge 3 --squash',
    'gh api repos/a/b/statuses/abc -f state=success',
    'echo ok && git push origin main',
    'git -C . push origin main',
    'git push origin main:refs/heads/main',
    'git push origin +main',
    'git push origin main;',
    'git push origin +feature',
    'cat .env',
    'source apps/web/.env.local',
    'grep KEY < .env',
    'GH_TOKEN=x gh pr merge 3',
  ]
  for (const command of blocked) {
    it(`blocks: ${command}`, () => assert.ok(checkCommand(command)))
  }

  const allowed = [
    'git push -u origin phase-0/workshop',
    'git push origin fix-main-menu',
    'git status',
    'rm -rf node_modules',
    'rm -rf ./dist',
    'gh pr create --fill',
    'gh pr view 3',
    'pnpm check',
    'echo "main"',
    'git commit -m "docs: gh pr merge erklaert"',
    'cat .env.example',
    'cat .environment',
  ]
  for (const command of allowed) {
    it(`allows: ${command}`, () => assert.equal(checkCommand(command), null))
  }

  it('blocks all pushes and gh in agent mode', () => {
    assert.ok(checkCommand('git push -u origin feature', { agentMode: true }))
    assert.ok(checkCommand('gh issue list', { agentMode: true }))
    assert.ok(checkCommand('ls && gh pr view 1', { agentMode: true }))
  })

  it('blocks gh behind an env variable in agent mode', () => {
    assert.ok(checkCommand('GH_TOKEN=x gh pr view 1', { agentMode: true }))
  })

  it('blocks shell writes to protected paths in agent mode only', () => {
    const protectedPaths = ['CLAUDE.md', 'project.config.json', 'workflow-kit/']
    const agent = { agentMode: true, protectedPaths }
    for (const command of [
      'sed -i s/a/b/ CLAUDE.md',
      "sed -i '' s/a/b/ CLAUDE.md",
      'echo x >> project.config.json',
      'echo x > ./CLAUDE.md',
      'rm workflow-kit/agents/x.md',
      'tee workflow-kit/x.md',
    ]) {
      assert.ok(checkCommand(command, agent), command)
      assert.equal(checkCommand(command, { protectedPaths }), null, command)
    }
    assert.equal(checkCommand('cat CLAUDE.md', agent), null)
    assert.equal(checkCommand('echo x > notes/CLAUDE.md.bak', agent), null)
    assert.equal(checkCommand('cp a.txt workflow-kit-notes/b.txt', agent), null)
  })

  it('does not mistake other words for gh in agent mode', () => {
    assert.equal(checkCommand('pnpm high-score', { agentMode: true }), null)
  })
})

describe('checkPath', () => {
  const projectDir = path.resolve('project')
  const options = { projectDir, protectedPaths: ['workflow-kit/', 'CLAUDE.md'] }

  it('blocks env files in every mode', () => {
    assert.ok(checkPath('Read', '.env', options))
    assert.ok(checkPath('Read', 'apps/web/.env.production', options))
    assert.equal(checkPath('Read', '.env.example', options), null)
  })

  it('leaves protected paths alone outside agent mode', () => {
    assert.equal(checkPath('Edit', 'CLAUDE.md', options), null)
  })

  it('blocks writes to protected paths in agent mode', () => {
    const agent = { ...options, agentMode: true }
    assert.ok(checkPath('Edit', 'CLAUDE.md', agent))
    assert.ok(checkPath('Write', 'workflow-kit/agents/x.md', agent))
    assert.ok(checkPath('Write', path.join(projectDir, 'workflow-kit', 'x.md'), agent))
    assert.ok(checkPath('Write', 'apps/../workflow-kit/x.md', agent))
    assert.equal(checkPath('Read', 'CLAUDE.md', agent), null)
    assert.equal(checkPath('Write', 'packages/kit/ui/index.ts', agent), null)
    assert.equal(checkPath('Write', 'workflow-kit-notes.md', agent), null)
    assert.ok(checkPath('Write', path.join(projectDir, '.claude/worktrees/t1/CLAUDE.md'), agent))
    assert.equal(checkPath('Write', path.join(projectDir, '.claude/worktrees/t1/src/a.ts'), agent), null)
  })
})

describe('hook scripts', () => {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const run = (script, input, env = {}) =>
    spawnSync(process.execPath, [path.join(here, script)], {
      input,
      encoding: 'utf8',
      env: { ...process.env, WF_AGENT: '', ...env },
    })

  it('exits 2 with the reason on a blocked command', () => {
    const result = run('guard-bash.mjs', JSON.stringify({ tool_input: { command: 'git push origin main' } }))
    assert.equal(result.status, 2)
    assert.match(result.stderr, /main branch/)
  })

  it('exits 0 on an allowed command', () => {
    assert.equal(run('guard-bash.mjs', JSON.stringify({ tool_input: { command: 'git status' } })).status, 0)
  })

  it('fails closed on invalid input', () => {
    assert.equal(run('guard-bash.mjs', 'not json').status, 2)
  })

  it('reads protected paths from the project config', () => {
    const projectDir = mkdtempSync(path.join(tmpdir(), 'guard-'))
    writeFileSync(path.join(projectDir, 'project.config.json'), JSON.stringify({ protectedPaths: ['locked.md'] }))
    const input = JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'locked.md' } })
    const env = { CLAUDE_PROJECT_DIR: projectDir }
    assert.equal(run('guard-paths.mjs', input, { ...env, WF_AGENT: '1' }).status, 2)
    assert.equal(run('guard-paths.mjs', input, env).status, 0)
  })
})

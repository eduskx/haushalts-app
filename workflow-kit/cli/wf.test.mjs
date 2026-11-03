import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { config, fakeTracker, ticket } from './test-support.mjs'
import { main } from './wf.mjs'

function project() {
  const dir = mkdtempSync(path.join(tmpdir(), 'wf-'))
  spawnSync('git', ['init', '-q'], { cwd: dir })
  writeFileSync(path.join(dir, 'project.config.json'), JSON.stringify(config))
  return dir
}

async function run(args, tickets) {
  const lines = []
  const code = await main(args, { cwd: project(), tracker: fakeTracker(tickets), out: (line) => lines.push(line) })
  return { code, lines }
}

describe('wf next', () => {
  const tickets = [
    ticket('T-1', { labels: ['needs-human'], createdAt: '2025-01-01T00:00:00.000Z' }),
    ticket('T-2', { labels: ['human-task'], createdAt: '2025-01-01T00:00:00.000Z' }),
    ticket('T-3', { blockedBy: [{ identifier: 'T-9', status: 'Todo' }], createdAt: '2025-01-01T00:00:00.000Z' }),
    ticket('T-4'),
  ]

  it('names the next ticket and the waiting count', async () => {
    const { code, lines } = await run(['next'], tickets)
    assert.equal(code, 0)
    assert.deepEqual(lines, ['T-4 Title of T-4', 'Waiting for intake: 1'])
  })

  it('prints JSON without the ticket text', async () => {
    const { lines } = await run(['next', '--json'], tickets)
    assert.deepEqual(JSON.parse(lines[0]), {
      next: { identifier: 'T-4', title: 'Title of T-4' },
      waitingForIntake: 1,
    })
  })

  it('says so when nothing can start', async () => {
    const { code, lines } = await run(['next'], tickets.slice(0, 3))
    assert.equal(code, 0)
    assert.equal(lines[0], 'No startable ticket.')
  })
})

describe('wf', () => {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'wf.mjs')

  it('shows the usage for an unknown command', async () => {
    const { code, lines } = await run(['nonsense'], [])
    assert.equal(code, 2)
    assert.match(lines[0], /Usage/)
  })

  it('fails with a clear message without an API key', () => {
    const env = { ...process.env }
    delete env.LINEAR_API_KEY
    const result = spawnSync(process.execPath, [script, 'next'], { cwd: project(), env, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /LINEAR_API_KEY is not set/)
  })
})

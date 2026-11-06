import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { selectNext } from './next.mjs'
import { config, ticket } from './test-support.mjs'

const pick = (...tickets) => selectNext(tickets, config).next?.identifier ?? null
const done = (identifier) => ({ identifier, status: 'Done' })

describe('selectNext', () => {
  it('takes the oldest startable ticket', () => {
    assert.equal(
      pick(
        ticket('T-3', { createdAt: '2026-03-01T00:00:00.000Z' }),
        ticket('T-1', { createdAt: '2026-01-01T00:00:00.000Z' }),
        ticket('T-2', { createdAt: '2026-02-01T00:00:00.000Z' }),
      ),
      'T-1',
    )
  })

  it('returns nothing without tickets', () => {
    assert.deepEqual(selectNext([], config), { next: null, waitingForIntake: 0 })
  })

  const neverPicked = {
    'needs-human': ticket('T-1', { labels: ['needs-human'] }),
    'human-task': ticket('T-1', { labels: ['ui', 'human-task'] }),
    'a label in other casing': ticket('T-1', { labels: ['Needs-Human'] }),
    'an open blocker': ticket('T-1', { blockedBy: [{ identifier: 'T-9', status: 'In Progress' }] }),
    'one open blocker among done ones': ticket('T-1', {
      blockedBy: [done('T-8'), { identifier: 'T-9', status: 'Todo' }],
    }),
    'a canceled blocker': ticket('T-1', { blockedBy: [{ identifier: 'T-9', status: 'Canceled' }] }),
    'a foreign author': ticket('T-1', { authorId: 'someone-else' }),
    'no known author': ticket('T-1', { authorId: null }),
    'another status': ticket('T-1', { status: 'Backlog' }),
    'work already running': ticket('T-1', { status: 'In Progress' }),
  }
  for (const [name, candidate] of Object.entries(neverPicked)) {
    it(`never picks a ticket with ${name}`, () => {
      assert.equal(pick(candidate), null)
    })
  }

  it('skips older tickets that may not start', () => {
    const older = { createdAt: '2025-01-01T00:00:00.000Z' }
    assert.equal(
      pick(
        ticket('T-1', { ...older, labels: ['needs-human'] }),
        ticket('T-2', { ...older, labels: ['human-task'] }),
        ticket('T-3', { ...older, blockedBy: [{ identifier: 'T-9', status: 'Todo' }] }),
        ticket('T-4'),
      ),
      'T-4',
    )
  })

  it('accepts human-review and blockers that are done', () => {
    assert.equal(pick(ticket('T-1', { labels: ['human-review'], blockedBy: [done('T-9')] })), 'T-1')
  })

  it('counts the tickets waiting for intake, even blocked ones', () => {
    const { waitingForIntake } = selectNext(
      [
        ticket('T-1', { labels: ['needs-human'] }),
        ticket('T-2', { labels: ['needs-human'], blockedBy: [{ identifier: 'T-9', status: 'Todo' }] }),
        ticket('T-3', { labels: ['human-task'] }),
        ticket('T-4'),
        ticket('T-5', { labels: ['needs-human'], status: 'Done' }),
      ],
      config,
    )
    assert.equal(waitingForIntake, 2)
  })
})

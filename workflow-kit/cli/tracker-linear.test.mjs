import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { config } from './test-support.mjs'
import { createLinearTracker } from './tracker-linear.mjs'

const issue = (identifier, fields = {}) => ({
  id: `uuid-${identifier}`,
  identifier,
  title: identifier,
  description: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  creator: { id: 'allowed-user' },
  state: { name: 'Todo' },
  labels: { nodes: [] },
  inverseRelations: { nodes: [] },
  ...fields,
})

const page = (nodes, endCursor = null) => ({
  ok: true,
  status: 200,
  json: async () => ({ data: { issues: { nodes, pageInfo: { hasNextPage: endCursor !== null, endCursor } } } }),
})

function tracker(responses) {
  const requests = []
  const fetch = async (url, init) => {
    requests.push({ url, headers: init.headers, ...JSON.parse(init.body) })
    return responses.shift()
  }
  return { requests, instance: createLinearTracker({ apiKey: 'test-key', config, fetch }) }
}

describe('createLinearTracker', () => {
  it('refuses to start without an API key', () => {
    assert.throws(() => createLinearTracker({ apiKey: undefined, config }), /LINEAR_API_KEY/)
  })

  it('filters by the team, project and ready status from the config', async () => {
    const { requests, instance } = tracker([page([])])
    await instance.listReadyTickets()
    assert.deepEqual(requests[0].variables, { team: 'TEAM', project: 'demo', status: 'Todo', after: null })
    assert.equal(requests[0].headers.Authorization, 'test-key')
  })

  it('turns an issue into a ticket', async () => {
    const { instance } = tracker([
      page([
        issue('T-1', {
          description: 'Text',
          labels: { nodes: [{ name: 'ui' }] },
          inverseRelations: {
            nodes: [
              { type: 'blocks', issue: { identifier: 'T-9', state: { name: 'Done' } } },
              { type: 'related', issue: { identifier: 'T-8', state: { name: 'Todo' } } },
            ],
          },
        }),
      ]),
    ])
    const [ticket] = await instance.listReadyTickets()
    assert.deepEqual(ticket, {
      id: 'uuid-T-1',
      identifier: 'T-1',
      title: 'T-1',
      description: 'Text',
      createdAt: '2026-01-01T00:00:00.000Z',
      authorId: 'allowed-user',
      status: 'Todo',
      labels: ['ui'],
      blockedBy: [{ identifier: 'T-9', status: 'Done' }],
    })
  })

  it('keeps a missing creator and description unknown instead of failing', async () => {
    const { instance } = tracker([page([issue('T-1', { creator: null })])])
    const [ticket] = await instance.listReadyTickets()
    assert.equal(ticket.authorId, null)
    assert.equal(ticket.description, '')
  })

  it('reads every page', async () => {
    const { requests, instance } = tracker([page([issue('T-1')], 'cursor'), page([issue('T-2')])])
    const tickets = await instance.listReadyTickets()
    assert.deepEqual(tickets.map(({ identifier }) => identifier), ['T-1', 'T-2'])
    assert.equal(requests[1].variables.after, 'cursor')
  })

  it('loads one ticket with its comments', async () => {
    const data = issue('T-1', {
      comments: {
        nodes: [
          { body: 'Hi', createdAt: '2026-01-02T00:00:00.000Z', user: { id: 'allowed-user' } },
          { body: 'Bot', createdAt: '2026-01-03T00:00:00.000Z', user: null },
        ],
      },
    })
    const { requests, instance } = tracker([{ ok: true, status: 200, json: async () => ({ data: { issue: data } }) }])
    const ticket = await instance.getTicket('T-1')
    assert.equal(requests[0].variables.identifier, 'T-1')
    assert.deepEqual(ticket.comments.map(({ authorId }) => authorId), ['allowed-user', null])
  })

  it('reports API errors without the key', async () => {
    const { instance } = tracker([
      { ok: false, status: 400, statusText: 'Bad', json: async () => ({ errors: [{ message: 'Query too complex' }] }) },
    ])
    await assert.rejects(instance.listReadyTickets(), (error) => {
      assert.match(error.message, /400.*Query too complex/)
      assert.doesNotMatch(error.message, /test-key/)
      return true
    })
  })
})

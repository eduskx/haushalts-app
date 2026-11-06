import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { agentEnv, buildAgentRun, loadSchema } from './agent.mjs'
import { config, ticket } from './test-support.mjs'

const env = {
  PATH: '/bin',
  HOME: '/home/agent',
  GH_TOKEN: 'secret-a',
  GITHUB_TOKEN: 'secret-b',
  LINEAR_API_KEY: 'secret-c',
  UNEXPECTED_NAME: 'secret-d',
}
const run = (fields, role = 'implementer') =>
  buildAgentRun({ role, ticket: ticket('T-1', fields), config, env })

describe('agentEnv', () => {
  it('holds no credentials, whatever their name', () => {
    const result = agentEnv(env, [])
    assert.doesNotMatch(JSON.stringify(result), /secret-/)
    assert.equal(result.PATH, '/bin')
  })

  it('sets the markers and the allowed paths', () => {
    const result = agentEnv(env, ['a.md', 'b/'])
    assert.equal(result.WF_AGENT, '1')
    assert.equal(result.WF_SANDBOX, '1')
    assert.equal(result.WF_ALLOW_PROTECTED, 'a.md,b/')
  })
})

describe('loadSchema', () => {
  it('finds the schema of each agent inside the kit', () => {
    for (const role of ['implementer', 'reviewer', 'tester']) {
      assert.equal(typeof JSON.parse(loadSchema(role).schema), 'object', role)
    }
  })

  it('fails for an unknown agent', () => {
    assert.throws(() => loadSchema('nobody'), /No result schema/)
  })
})

describe('buildAgentRun', () => {
  it('hands over the config values the agents name', () => {
    const { prompt } = run({})
    for (const value of ['check-cmd', 'docs/contract.md', 'locked/', 'Answers', '"maxDiffLines": 300']) {
      assert.ok(prompt.includes(value), value)
    }
  })

  it('leaves out what agents do not need', () => {
    const { prompt } = run({})
    assert.doesNotMatch(prompt, /allowed-user|owner\/demo/)
  })

  it('passes allowProtected from the answers section to prompt and hook', () => {
    const { prompt, allowProtected, env: runEnv } = run({
      description: '## Answers\n\n* allowProtected: `LOCK.md` (2026-11-03)',
    })
    assert.deepEqual(allowProtected, ['LOCK.md'])
    assert.equal(runEnv.WF_ALLOW_PROTECTED, 'LOCK.md')
    assert.match(prompt, /"allowProtected": \[\s*"LOCK.md"\s*\]/)
  })

  it('includes the schema of the role', () => {
    assert.match(run({}).prompt, /ImplementerResult/)
    assert.match(run({}, 'reviewer').prompt, /Verdict/)
  })

  it('refuses a ticket by a foreign author', () => {
    assert.throws(() => run({ authorId: 'someone-else' }), /allowed author/)
  })
})

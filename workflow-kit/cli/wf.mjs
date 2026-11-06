#!/usr/bin/env node
// wf, the deterministic orchestrator. Agents return commits and JSON, wf acts on them.
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { loadConfig, repoRoot } from './config.mjs'
import { selectNext } from './next.mjs'
import { createLinearTracker } from './tracker-linear.mjs'

const USAGE = `Usage: wf <command> [--json]

  next    Show the oldest startable ticket and how many wait for intake
`

function createTracker(config, env) {
  if (config.tracker.adapter === 'linear') return createLinearTracker({ apiKey: env.LINEAR_API_KEY, config })
  throw new Error(`Unknown tracker adapter: ${config.tracker.adapter}`)
}

async function next({ config, tracker, values, out }) {
  const result = selectNext(await tracker.listReadyTickets(), config)
  if (values.json) {
    const ticket = result.next && { identifier: result.next.identifier, title: result.next.title }
    out(JSON.stringify({ next: ticket, waitingForIntake: result.waitingForIntake }))
  } else {
    out(result.next ? `${result.next.identifier} ${result.next.title}` : 'No startable ticket.')
    out(`Waiting for intake: ${result.waitingForIntake}`)
  }
  return 0
}

const COMMANDS = { next }

// Returns the exit code. The dependencies can be replaced in tests.
export async function main(argv, { env = process.env, cwd = process.cwd(), out = console.log, tracker } = {}) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { json: { type: 'boolean', default: false } },
  })
  const command = COMMANDS[positionals[0]]
  if (!command) {
    out(USAGE)
    return 2
  }
  const config = loadConfig(repoRoot(cwd))
  return command({ config, tracker: tracker ?? createTracker(config, env), values, out, cwd })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await main(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

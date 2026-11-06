#!/usr/bin/env node
// wf, the deterministic orchestrator. Agents return commits and JSON, wf acts on them.
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { findCommandBlocker, inspectDiff, loadConfigAt, resolveBase, runCheckCommand } from './check.mjs'
import { loadConfig, repoRoot } from './config.mjs'
import { selectNext } from './next.mjs'
import { askHuman } from './return-path.mjs'
import { createLinearTracker } from './tracker-linear.mjs'

const USAGE = `Usage: wf <command> [--json]

  next    Show the oldest startable ticket and how many wait for intake
  check   Judge the diff against the base branch and run commands.check
          --base <ref>            Base to compare with, default origin/HEAD
          --allow-protected <p>   Comma-separated protected paths this ticket may change
          --diff-only             Skip commands.check, for places that hold credentials
  block <ticket> <question>
          Write the question to the ticket and hand it to the next intake round
`

function createTracker(config, env) {
  if (config.tracker.adapter === 'linear') return createLinearTracker({ apiKey: env.LINEAR_API_KEY, config })
  throw new Error(`Unknown tracker adapter: ${config.tracker.adapter}`)
}

async function next({ root, env, tracker, values, out }) {
  const config = loadConfig(root)
  const source = tracker ?? createTracker(config, env)
  const result = selectNext(await source.listReadyTickets(), config)
  if (values.json) {
    const ticket = result.next && { identifier: result.next.identifier, title: result.next.title }
    out(JSON.stringify({ next: ticket, waitingForIntake: result.waitingForIntake }))
  } else {
    out(result.next ? `${result.next.identifier} ${result.next.title}` : 'No startable ticket.')
    out(`Waiting for intake: ${result.waitingForIntake}`)
  }
  return 0
}

function printCheck(result, out) {
  for (const { rule, detail } of result.violations) out(`FAIL ${rule}: ${detail}`)
  for (const reason of result.human.reasons) out(`HUMAN ${reason}`)
  if (result.command.output) out(result.command.output)
  out(`commands.check: ${result.command.status}${result.command.reason ? ` (${result.command.reason})` : ''}`)
  out(`Diff lines without tests: ${result.diffLines} of ${result.maxDiffLines}`)
  out(result.ok ? 'Check passed.' : 'Check failed.')
  out(result.human.required ? 'A human must review this diff.' : 'No human review required by the diff.')
}

async function check({ root, env, values, out }) {
  const base = values.base ?? resolveBase(root)
  // The config comes from the base, so a diff cannot loosen the rules that judge it.
  const config = loadConfigAt(root, base)
  const allowProtected = (values['allow-protected'] ?? '').split(',').filter(Boolean)
  const diff = inspectDiff({ cwd: root, base, config, allowProtected })
  let command = { status: 'skipped', reason: '--diff-only' }
  if (!values['diff-only']) {
    const blocker = findCommandBlocker(env)
    command = blocker
      ? { status: 'not_run', reason: blocker }
      : runCheckCommand({ command: config.commands.check, cwd: root, env })
  }
  const violations = [...diff.violations]
  if (command.status === 'failed') violations.push({ rule: 'commands.check', detail: `exit code ${command.code}` })
  if (command.status === 'not_run') violations.push({ rule: 'commands.check', detail: command.reason })
  const result = { ...diff, violations, command, ok: violations.length === 0 }
  if (values.json) out(JSON.stringify(result))
  else printCheck(result, out)
  return result.ok ? 0 : 1
}

async function block({ root, env, tracker, positionals, out }) {
  // Joined, so that an unquoted question keeps every word.
  const [, identifier, ...words] = positionals
  const question = words.join(' ')
  if (!identifier || !question.trim()) {
    out(USAGE)
    return 2
  }
  const config = loadConfig(root)
  await askHuman({ tracker: tracker ?? createTracker(config, env), config, identifier, question })
  out(`${identifier} now waits for intake.`)
  return 0
}

const COMMANDS = { next, check, block }

// Returns the exit code. The dependencies can be replaced in tests.
export async function main(argv, { env = process.env, cwd = process.cwd(), out = console.log, tracker } = {}) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      json: { type: 'boolean', default: false },
      base: { type: 'string' },
      'allow-protected': { type: 'string' },
      'diff-only': { type: 'boolean', default: false },
    },
  })
  const command = COMMANDS[positionals[0]]
  if (!command) {
    out(USAGE)
    return 2
  }
  return command({ root: repoRoot(cwd), env, tracker, values, positionals, out })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await main(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

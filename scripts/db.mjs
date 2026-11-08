// Runs the Supabase CLI against apps/web. The CLI is a system tool (Homebrew,
// setup-cli action), not an npm dependency, so it is called from here rather
// than from package.json scripts.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cli = 'supabase'
const workdir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../apps/web')

const commands = {
  start: [['start']],
  stop: [['stop']],
  // `db start` boots only Postgres, which is all pgTAP needs.
  test: [['db', 'start'], ['test', 'db']],
}

const steps = commands[process.argv[2]]
if (!steps) {
  console.error(`Usage: node scripts/db.mjs <${Object.keys(commands).join('|')}>`)
  process.exit(2)
}

for (const args of steps) {
  const { status, error } = spawnSync(cli, [...args, '--workdir', workdir], { stdio: 'inherit' })
  if (error) {
    console.error(`Could not run the Supabase CLI: ${error.message}\nInstall it first: https://supabase.com/docs/guides/local-development/cli/getting-started`)
    process.exit(1)
  }
  if (status !== 0) process.exit(status ?? 1)
}

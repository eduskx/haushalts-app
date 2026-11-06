import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

export function repoRoot(cwd = process.cwd()) {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).trim()
}

export function loadConfig(projectDir) {
  return JSON.parse(readFileSync(path.join(projectDir, 'project.config.json'), 'utf8'))
}

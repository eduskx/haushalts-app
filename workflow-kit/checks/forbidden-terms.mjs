// Fails when a file under forbiddenTerms.paths contains a term from project.config.json.
// Matches substrings on purpose: partnerId must fail as well as partner.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadConfig } from '../cli/config.mjs'

const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'coverage', '.turbo'])

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : listFiles(path.join(dir, entry.name))
    return [path.join(dir, entry.name)]
  })
}

function isBinary(content) {
  return content.includes(0)
}

function readRules(projectDir) {
  return loadConfig(projectDir).forbiddenTerms ?? {}
}

// Pass rules to judge a checkout by a config other than its own.
export function findForbiddenTerms(projectDir, rules = readRules(projectDir)) {
  const { paths = [], terms = [] } = rules
  const findings = []

  for (const root of paths) {
    const absolute = path.join(projectDir, root)
    if (!existsSync(absolute)) continue
    const files = statSync(absolute).isDirectory() ? listFiles(absolute) : [absolute]
    for (const file of files) {
      const content = readFileSync(file)
      if (isBinary(content)) continue
      const lines = content.toString('utf8').split('\n')
      lines.forEach((line, index) => {
        for (const term of terms) {
          if (line.toLowerCase().includes(term.toLowerCase())) {
            findings.push({ file: path.relative(projectDir, file), line: index + 1, term })
          }
        }
      })
    }
  }
  return findings
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = findForbiddenTerms(process.cwd())
  for (const { file, line, term } of findings) console.error(`${file}:${line} contains forbidden term "${term}"`)
  process.exit(findings.length > 0 ? 1 : 0)
}

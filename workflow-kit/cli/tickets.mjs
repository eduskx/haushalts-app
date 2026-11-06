// Reads ticket text. Linear rewrites what it stores: "-" lists become "*" lists, blank lines
// appear, ticket ids become <issue> tags, and some file names become links.
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/
const FENCE = /^ {0,3}(?:```|~~~)/
const ALLOW_LINE = /^\s*(?:[-*+]\s+)?(?:\[[ xX]\]\s+)?\**allowProtected\**\s*:\**\s*(.*)$/i
const ISSUE_TAG = /<issue\b[^>]*\blabel="([^"]*)"[^>]*\/?>(?:\s*<\/issue>)?/g
const VALID_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[\w.@/-]+$/

const headingText = (text) => text.replace(/[*_:]+/g, ' ').trim().toLowerCase()

// Locates sections by line, ignoring headings inside code fences.
export function sectionRanges(lines, heading) {
  const wanted = headingText(heading)
  const ranges = []
  let open = null
  let fenced = false
  lines.forEach((line, index) => {
    if (FENCE.test(line)) fenced = !fenced
    const match = fenced ? null : line.match(HEADING)
    if (!match) return
    const level = match[1].length
    if (open && level <= open.level) {
      ranges.push({ start: open.start, end: index })
      open = null
    }
    if (!open && headingText(match[2]) === wanted) open = { level, start: index + 1 }
  })
  if (open) ranges.push({ start: open.start, end: lines.length })
  return ranges
}

export const splitLines = (text) => text.replace(/\r\n/g, '\n').split('\n')

export function readSection(description, heading) {
  const lines = splitLines(description)
  return sectionRanges(lines, heading).flatMap(({ start, end }) => lines.slice(start, end))
}

function cleanPaths(value) {
  return value
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [a.md](<http://a.md>) -> a.md
    .replace(/\\([_*.\-])/g, '$1')
    .replace(/\(\d{4}-\d{2}-\d{2}\)/g, ' ')
    .replace(/[`*<>]/g, ' ')
    .split(/[\s,;]+/)
    .map((entry) => entry.replace(/^\.\//, ''))
    .filter((entry) => VALID_PATH.test(entry))
}

// Only the answers section counts: text elsewhere in a ticket must not open protected paths.
export function parseAllowProtected(description, config) {
  const paths = readSection(description, config.tracker.sections.answers).flatMap((line) => {
    const match = line.match(ALLOW_LINE)
    return match ? cleanPaths(match[1]) : []
  })
  return [...new Set(paths)]
}

export const normalizeTicketText = (text) => text.replace(ISSUE_TAG, '$1')

// The only ticket text agents may see. Throws rather than pass on text by anyone else.
export function ticketTextForAgent(ticket, config) {
  const { allowedAuthors } = config.tracker
  if (!allowedAuthors.includes(ticket.authorId)) {
    throw new Error(`${ticket.identifier} was not written by an allowed author.`)
  }
  const comments = (ticket.comments ?? []).filter(({ authorId }) => allowedAuthors.includes(authorId))
  const parts = [
    `# ${ticket.identifier}: ${ticket.title}`,
    ticket.description,
    ...comments.map(({ createdAt, body }) => `## Comment from ${createdAt}\n\n${body}`),
  ]
  return normalizeTicketText(parts.join('\n\n'))
}

const MAX_QUESTION_LENGTH = 1000

// Agent text goes on one line, so that it cannot open a section of its own, such as answers.
const toSingleLine = (text) => text.replace(/\s+/g, ' ').trim().slice(0, MAX_QUESTION_LENGTH)

// Adds an open item to the questions section and leaves the rest of the text as it is.
export function appendQuestion(description, heading, question) {
  const item = `- [ ] ${toSingleLine(question)}`
  if (readSection(description, heading).some((line) => line.includes(toSingleLine(question)))) return description
  const lines = splitLines(description)
  const [section] = sectionRanges(lines, heading)
  if (!section) return `${description.trimEnd()}\n\n## ${heading}\n\n${item}\n`.trimStart()
  let end = section.end
  while (end > section.start && !lines[end - 1].trim()) end -= 1
  const blankBefore = end === section.start ? [''] : []
  const blankAfter = section.end < lines.length ? [''] : []
  return [...lines.slice(0, end), ...blankBefore, item, ...blankAfter, ...lines.slice(section.end)].join('\n')
}

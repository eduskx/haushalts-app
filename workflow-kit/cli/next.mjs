// Decides which ticket the pipeline may take. Everything unclear counts as not startable.

const hasLabel = (ticket, label) => ticket.labels.some((name) => name.toLowerCase() === label.toLowerCase())

const isAllowedAuthor = (ticket, { tracker }) => tracker.allowedAuthors.includes(ticket.authorId)

const isReady = (ticket, { tracker }) => ticket.status === tracker.statuses.ready

const blockersDone = (ticket, { tracker }) => ticket.blockedBy.every(({ status }) => status === tracker.statuses.done)

function isStartable(ticket, config) {
  const { needsHuman, humanTask } = config.tracker.labels
  return (
    isReady(ticket, config) &&
    isAllowedAuthor(ticket, config) &&
    !hasLabel(ticket, needsHuman) &&
    !hasLabel(ticket, humanTask) &&
    blockersDone(ticket, config)
  )
}

const oldestFirst = (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.identifier.localeCompare(b.identifier)

export function selectNext(tickets, config) {
  const waiting = tickets.filter(
    (ticket) =>
      isReady(ticket, config) && isAllowedAuthor(ticket, config) && hasLabel(ticket, config.tracker.labels.needsHuman),
  )
  const [next = null] = tickets.filter((ticket) => isStartable(ticket, config)).sort(oldestFirst)
  return { next, waitingForIntake: waiting.length }
}

// The way back to the human: an open question lands in the ticket for the next intake round.
import { appendQuestion } from './tickets.mjs'

const MESSAGES = {
  de: {
    invalidResult: 'Der Implementer hat kein gültiges Ergebnis geliefert. Wie soll es mit diesem Ticket weitergehen?',
    fixRounds: (rounds, problems) =>
      `Nach ${rounds} Fix-Runden ist das Ticket nicht fertig. Letzte Probleme: ${problems}. Wie soll es weitergehen?`,
  },
  en: {
    invalidResult: 'The implementer returned no valid result. How should this ticket continue?',
    fixRounds: (rounds, problems) =>
      `The ticket is not finished after ${rounds} fix rounds. Last problems: ${problems}. How should it continue?`,
  },
}

const messages = (config) => MESSAGES[config.project.language] ?? MESSAGES.en

// Anything that is not a clear done or blocked counts as invalid, so it cannot pass as done.
export function parseImplementerResult(raw) {
  let result
  try {
    result = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return { status: 'invalid' }
  }
  const text = (value) => typeof value === 'string' && value.trim().length > 0
  if (result?.status === 'done' && text(result.summary)) return { status: 'done', summary: result.summary }
  if (result?.status === 'blocked' && text(result.question)) return { status: 'blocked', question: result.question }
  return { status: 'invalid' }
}

// Back to the ready status as well: intake only loads tickets in that status, and the label
// keeps the pipeline away until the question is answered.
export async function askHuman({ tracker, config, identifier, question }) {
  const { sections, statuses, labels } = config.tracker
  const ticket = await tracker.getTicket(identifier)
  await tracker.updateTicket(ticket, {
    description: appendQuestion(ticket.description, sections.questions, question),
    status: statuses.ready,
    addLabel: labels.needsHuman,
  })
}

export function reportInvalidResult({ tracker, config, identifier }) {
  return askHuman({ tracker, config, identifier, question: messages(config).invalidResult })
}

// Called by the run loop once limits.maxFixRounds are used up.
export function reportFixRoundsExhausted({ tracker, config, identifier, problems }) {
  const question = messages(config).fixRounds(config.limits.maxFixRounds, problems.join('; '))
  return askHuman({ tracker, config, identifier, question })
}

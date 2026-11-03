// Shared by the tests of wf.
export const config = {
  project: { name: 'demo', language: 'en', repo: 'owner/demo' },
  tracker: {
    adapter: 'linear',
    team: 'TEAM',
    project: 'demo',
    allowedAuthors: ['allowed-user'],
    statuses: { idea: 'Backlog', ready: 'Todo', inProgress: 'In Progress', done: 'Done' },
    labels: {
      idea: 'idea',
      inReview: 'in-review',
      needsHuman: 'needs-human',
      humanTask: 'human-task',
      humanReview: 'human-review',
      ui: 'ui',
    },
    sections: { questions: 'Open questions', answers: 'Answers' },
  },
}

export function ticket(identifier, fields = {}) {
  return {
    id: `uuid-${identifier}`,
    identifier,
    title: `Title of ${identifier}`,
    description: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    authorId: 'allowed-user',
    status: 'Todo',
    labels: [],
    blockedBy: [],
    ...fields,
  }
}

// In-memory stand-in for a tracker.
export function fakeTracker(tickets) {
  return {
    tickets,
    listReadyTickets: async () => tickets.filter(({ status }) => status === config.tracker.statuses.ready),
  }
}

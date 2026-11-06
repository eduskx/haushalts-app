// Thin layer over the Linear API. Returns tickets in the shape the rest of wf expects,
// so that tests and other trackers only have to provide the same methods.
const ENDPOINT = 'https://api.linear.app/graphql'

// Page sizes stay low because Linear rejects queries above its complexity limit.
const TICKET_FIELDS = `
  id
  identifier
  title
  description
  createdAt
  creator { id }
  state { name }
  labels(first: 20) { nodes { name } }
  inverseRelations(first: 20) { nodes { type issue { identifier state { name } } } }
`

const READY_TICKETS = `
  query ReadyTickets($team: String!, $project: String!, $status: String!, $after: String) {
    issues(
      first: 50
      after: $after
      filter: {
        team: { key: { eq: $team } }
        project: { name: { eq: $project } }
        state: { name: { eq: $status } }
      }
    ) {
      nodes { ${TICKET_FIELDS} }
      pageInfo { hasNextPage endCursor }
    }
  }
`

const ONE_TICKET = `
  query OneTicket($identifier: String!) {
    issue(id: $identifier) {
      ${TICKET_FIELDS}
      comments(first: 50) { nodes { body createdAt user { id } } }
    }
  }
`

function toTicket(issue) {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description ?? '',
    createdAt: issue.createdAt,
    authorId: issue.creator?.id ?? null,
    status: issue.state.name,
    labels: issue.labels.nodes.map(({ name }) => name),
    // A relation "A blocks B" shows up on B as an inverse relation with issue A.
    blockedBy: issue.inverseRelations.nodes
      .filter(({ type }) => type === 'blocks')
      .map(({ issue: blocker }) => ({ identifier: blocker.identifier, status: blocker.state.name })),
    ...(issue.comments && {
      comments: issue.comments.nodes.map(({ body, createdAt, user }) => ({
        body,
        createdAt,
        authorId: user?.id ?? null,
      })),
    }),
  }
}

export function createLinearTracker({ apiKey, config, fetch = globalThis.fetch }) {
  if (!apiKey) throw new Error('LINEAR_API_KEY is not set. Add it to the environment wf runs in.')

  async function request(query, variables) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: apiKey },
      body: JSON.stringify({ query, variables }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok || body.errors) {
      const detail = body.errors?.map(({ message }) => message).join('; ') ?? response.statusText
      throw new Error(`Linear request failed (${response.status}): ${detail}`)
    }
    return body.data
  }

  return {
    async getTicket(identifier) {
      const { issue } = await request(ONE_TICKET, { identifier })
      return toTicket(issue)
    },

    async listReadyTickets() {
      const { team, project, statuses } = config.tracker
      const tickets = []
      let after = null
      do {
        const { issues } = await request(READY_TICKETS, { team, project, status: statuses.ready, after })
        tickets.push(...issues.nodes.map(toTicket))
        after = issues.pageInfo.hasNextPage ? issues.pageInfo.endCursor : null
      } while (after)
      return tickets
    },
  }
}

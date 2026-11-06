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

const LOOKUP_IDS = `
  query LookupIds($team: String!, $status: String!, $label: String!) {
    workflowStates(first: 5, filter: { team: { key: { eq: $team } }, name: { eq: $status } }) {
      nodes { id }
    }
    issueLabels(first: 20, filter: { name: { eqIgnoreCase: $label } }) {
      nodes { id team { key } }
    }
  }
`

const UPDATE_TICKET = `
  mutation UpdateTicket($id: String!, $input: IssueUpdateInput!) {
    issueUpdate(id: $id, input: $input) { success }
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

    // One mutation, so that a question never lands without its label or the other way round.
    async updateTicket(ticket, { description, status, addLabel }) {
      const { team } = config.tracker
      const { workflowStates, issueLabels } = await request(LOOKUP_IDS, { team, status, label: addLabel })
      const stateId = workflowStates.nodes[0]?.id
      // A team's own label wins over a workspace label of the same name.
      const label =
        issueLabels.nodes.find((node) => node.team?.key === team) ?? issueLabels.nodes.find((node) => !node.team)
      if (!stateId) throw new Error(`Status "${status}" does not exist in team ${team}.`)
      if (!label) throw new Error(`Label "${addLabel}" does not exist in team ${team}.`)
      const input = { description, stateId, addedLabelIds: [label.id] }
      const { issueUpdate } = await request(UPDATE_TICKET, { id: ticket.id, input })
      if (!issueUpdate.success) throw new Error(`Linear did not update ${ticket.identifier}.`)
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

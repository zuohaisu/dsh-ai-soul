import {
  applyStateTransitionProposal,
  reviewStateTransitionProposal,
  validateStateTransitionProposal,
} from './state-transition.js'

function clone(value) {
  return structuredClone(value)
}

function keyFor(soulId, proposalId) {
  return `${soulId}:${proposalId}`
}

export function createGovernanceInbox({ store } = {}) {
  if (!store || typeof store.load !== 'function' || typeof store.save !== 'function') {
    throw new TypeError('governance inbox requires a Soul store with load/save')
  }

  const pending = new Map()
  const resolved = new Map()

  function receive({ soulId, proposal } = {}) {
    if (!soulId || typeof soulId !== 'string') throw new TypeError('soulId is required')
    const validation = validateStateTransitionProposal(proposal)
    if (!validation.valid) throw new TypeError(`invalid governance proposal: ${validation.errors.join('; ')}`)
    if (proposal.review != null) throw new TypeError('governance inbox only accepts unreviewed proposals')

    const key = keyFor(soulId, proposal.id)
    if (pending.has(key) || resolved.has(key)) throw new TypeError('governance proposal already received')

    const entry = Object.freeze({
      soulId,
      proposal: clone(proposal),
      receivedAt: new Date().toISOString(),
      status: 'pending',
    })
    pending.set(key, entry)
    return clone(entry)
  }

  function listPending() {
    return [...pending.values()].map(clone)
  }

  function listResolved() {
    return [...resolved.values()].map(clone)
  }

  async function review({ soulId, proposalId, reviewer, ...reviewInput } = {}) {
    const key = keyFor(soulId, proposalId)
    const entry = pending.get(key)
    if (!entry) throw new TypeError('pending governance proposal not found')
    if (!reviewer || typeof reviewer !== 'string') throw new TypeError('reviewer is required')
    if (reviewer === entry.proposal.proposer) {
      throw new TypeError('governance reviewer must be independent from proposal proposer')
    }

    const reviewedProposal = reviewStateTransitionProposal(entry.proposal, {
      reviewer,
      ...reviewInput,
    })

    let persisted = false
    if (reviewedProposal.review.decision === 'approved') {
      const state = await store.load(soulId)
      const next = applyStateTransitionProposal(state, reviewedProposal)
      await store.save(next)
      persisted = true
    }

    const resolvedEntry = Object.freeze({
      soulId,
      proposal: clone(reviewedProposal),
      receivedAt: entry.receivedAt,
      resolvedAt: reviewedProposal.review.at,
      status: reviewedProposal.review.decision,
      persisted,
    })
    pending.delete(key)
    resolved.set(key, resolvedEntry)
    return clone(resolvedEntry)
  }

  return Object.freeze({ receive, listPending, listResolved, review })
}

export function attachGovernanceInbox(ctx, inbox) {
  if (!ctx || typeof ctx.on !== 'function') throw new TypeError('governance inbox consumer requires ctx.on')
  if (!inbox || typeof inbox.receive !== 'function') throw new TypeError('governance inbox consumer requires inbox.receive')

  return ctx.on('ai-soul/governance-proposal', (payload) => inbox.receive(payload))
}

import { createGovernanceInbox } from '../core/index.js'

function assertEventApi(ctx) {
  if (!ctx || typeof ctx.on !== 'function' || typeof ctx.emit !== 'function') {
    throw new TypeError('DSH governance consumer requires ctx.on/ctx.emit')
  }
}

function normalizeReviewPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('governance review event requires an object payload')
  }

  const {
    soulId,
    proposalId,
    reviewer,
    decision,
    reason,
    provenance,
    at,
    conflicts,
  } = payload

  if (!soulId || typeof soulId !== 'string') throw new TypeError('governance review requires soulId')
  if (!proposalId || typeof proposalId !== 'string') throw new TypeError('governance review requires proposalId')
  if (!reviewer || typeof reviewer !== 'string') throw new TypeError('governance review requires reviewer')
  if (decision !== 'approved' && decision !== 'rejected') {
    throw new TypeError('governance review decision must be approved or rejected')
  }
  if (!reason || typeof reason !== 'string') throw new TypeError('governance review requires reason')
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    throw new TypeError('governance review requires provenance')
  }

  return {
    soulId,
    proposalId,
    reviewer,
    decision,
    reason,
    provenance: structuredClone(provenance),
    ...(at == null ? {} : { at }),
    ...(conflicts == null ? {} : { conflicts: structuredClone(conflicts) }),
  }
}

function normalizeSnapshotRequest(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('governance snapshot request requires an object payload')
  }
  if (!payload.soulId || typeof payload.soulId !== 'string') {
    throw new TypeError('governance snapshot request requires soulId')
  }
  if (!payload.requestId || typeof payload.requestId !== 'string') {
    throw new TypeError('governance snapshot request requires requestId')
  }
  return { soulId: payload.soulId, requestId: payload.requestId }
}

function enqueue(queue, task) {
  // A rejected event must fail closed for that invocation without poisoning the
  // serial boundary for every later, independently valid governance event.
  return queue.then(task, task)
}

export function createDshGovernanceConsumer(ctx, { store } = {}) {
  assertEventApi(ctx)
  const inbox = createGovernanceInbox({ store })

  let proposalQueue = Promise.resolve()
  ctx.on('ai-soul/governance-proposal', (payload) => {
    proposalQueue = enqueue(proposalQueue, () => inbox.receive(payload))
    return proposalQueue
  })

  let reviewQueue = Promise.resolve()
  ctx.on('ai-soul/governance-review', (payload) => {
    reviewQueue = enqueue(reviewQueue, async () => {
      const review = normalizeReviewPayload(payload)
      const resolved = await inbox.review(review)

      // Persistence happens inside inbox.review(). Only after an approved state
      // is durably saved may the consumer tell AI Soul to refresh its validated
      // in-memory prompt snapshot. Await that refresh so a completed human review
      // cannot race the next prompt assembly.
      if (resolved.persisted) {
        await ctx.emit('ai-soul/state-committed', { soulId: resolved.soulId })
      }

      // This is an audit/UI signal only. It carries the reviewed proposal and
      // outcome but grants no mutation authority.
      await ctx.emit('ai-soul/governance-resolved', structuredClone(resolved))
      return resolved
    })
    return reviewQueue
  })

  // Runtime surfaces inspect governance state through an event boundary instead
  // of receiving a mutable reference to the inbox. The response is detached and
  // scoped to one Soul; it carries no review/apply authority.
  ctx.on('ai-soul/governance-snapshot-request', (payload) => {
    const { soulId, requestId } = normalizeSnapshotRequest(payload)
    const snapshot = {
      requestId,
      soulId,
      pending: inbox.listPending().filter((entry) => entry.soulId === soulId),
      resolved: inbox.listResolved().filter((entry) => entry.soulId === soulId),
    }
    const detached = structuredClone(snapshot)
    ctx.emit('ai-soul/governance-snapshot', detached)
    return structuredClone(snapshot)
  })

  return Object.freeze({
    inbox,
    listPending: () => inbox.listPending(),
    listResolved: () => inbox.listResolved(),
  })
}

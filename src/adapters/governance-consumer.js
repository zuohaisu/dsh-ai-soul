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
      // in-memory prompt snapshot.
      if (resolved.persisted) {
        ctx.emit('ai-soul/state-committed', { soulId: resolved.soulId })
      }

      // This is an audit/UI signal only. It carries the reviewed proposal and
      // outcome but grants no mutation authority.
      ctx.emit('ai-soul/governance-resolved', structuredClone(resolved))
      return resolved
    })
    return reviewQueue
  })

  return Object.freeze({
    inbox,
    listPending: () => inbox.listPending(),
    listResolved: () => inbox.listResolved(),
  })
}

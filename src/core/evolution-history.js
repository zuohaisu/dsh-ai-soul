import { validateSoulState } from './soul-state.js'

function clone(value) {
  return structuredClone(value)
}

function evidenceIds(entry) {
  const evidence = entry?.provenance?.evidence
  if (!Array.isArray(evidence)) return []
  return evidence
    .map((item) => item?.id)
    .filter((id) => typeof id === 'string' && id.length > 0)
}

function conflictSummary(entry) {
  const review = entry?.provenance?.review
  const conflicts = Array.isArray(review?.conflicts) ? review.conflicts : []
  return {
    conflictIds: conflicts
      .map((conflict) => conflict?.id)
      .filter((id) => typeof id === 'string' && id.length > 0),
    resolution: review?.conflictResolution?.disposition ?? null,
    resolutionReason: review?.conflictResolution?.reason ?? null,
  }
}

function projectEntry(entry) {
  const base = {
    id: entry?.id ?? null,
    at: entry?.at ?? null,
    kind: entry?.kind ?? 'unknown',
    reason: entry?.reason ?? null,
  }

  if (entry?.kind !== 'governed-state-transition') {
    return {
      ...base,
      governed: false,
      summary: `Recorded evolution event of kind ${base.kind}; no specialized interpretation is defined.`,
    }
  }

  const review = entry?.provenance?.review ?? {}
  const conflicts = conflictSummary(entry)

  return {
    ...base,
    governed: true,
    target: entry?.change?.target ?? null,
    operation: entry?.change?.operation ?? null,
    confidence: entry?.change?.confidence ?? null,
    proposer: entry?.change?.proposer ?? null,
    proposalId: entry?.provenance?.proposalId ?? null,
    evidenceIds: evidenceIds(entry),
    review: {
      decision: review.decision ?? null,
      reviewer: review.reviewer ?? null,
      reason: review.reason ?? null,
      at: review.at ?? null,
    },
    conflicts,
  }
}

export function projectEvolutionHistory(state) {
  const validation = validateSoulState(state)
  if (!validation.valid) {
    throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  }

  return state.evolution.map((entry) => projectEntry(entry))
}

export function renderEvolutionHistory(history) {
  if (!Array.isArray(history)) throw new TypeError('evolution history must be an array')
  if (history.length === 0) return 'No recorded Soul evolution.'

  const sections = history.map((entry) => {
    const header = `${entry.at ?? 'unknown time'} — ${entry.kind ?? 'unknown'}`

    if (!entry.governed) {
      return [header, entry.reason ? `Reason: ${entry.reason}` : null, entry.summary]
        .filter(Boolean)
        .join('\n')
    }

    const lines = [
      header,
      `Change: ${entry.operation ?? 'unknown'} → ${entry.target ?? 'unknown target'}`,
      `Reason: ${entry.reason ?? 'unspecified'}`,
      `Confidence: ${entry.confidence ?? 'unknown'}`,
      `Proposer: ${entry.proposer ?? 'unknown'}`,
      `Review: ${entry.review?.decision ?? 'unknown'} by ${entry.review?.reviewer ?? 'unknown'}`,
    ]

    if (entry.review?.reason) lines.push(`Review reason: ${entry.review.reason}`)
    if (entry.proposalId) lines.push(`Proposal: ${entry.proposalId}`)
    if (entry.evidenceIds?.length) lines.push(`Evidence: ${entry.evidenceIds.join(', ')}`)
    if (entry.conflicts?.conflictIds?.length) {
      lines.push(`Conflicts: ${entry.conflicts.conflictIds.join(', ')}`)
      lines.push(`Conflict resolution: ${entry.conflicts.resolution ?? 'unresolved'}`)
      if (entry.conflicts.resolutionReason) lines.push(`Resolution reason: ${entry.conflicts.resolutionReason}`)
    }

    return lines.join('\n')
  })

  return sections.join('\n\n')
}

export function renderSoulEvolutionHistory(state) {
  return renderEvolutionHistory(projectEvolutionHistory(clone(state)))
}

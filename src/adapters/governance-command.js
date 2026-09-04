function commandError(text) {
  return { kind: 'error', text }
}

function commandSuccess(text) {
  return { kind: 'success', text }
}

function parseCommandInput(rawInput = '') {
  const input = rawInput.trim()
  if (!input || input === 'list') return { action: 'list' }

  const [action, proposalId, ...reasonParts] = input.split(/\s+/u)
  if (action !== 'approve' && action !== 'reject') return { action: 'invalid' }
  if (!proposalId) return { action: 'invalid' }

  return {
    action,
    proposalId,
    reason: reasonParts.join(' ').trim(),
  }
}

function formatProposalValue(value) {
  if (typeof value?.claim === 'string') return value.claim
  return JSON.stringify(value)
}

function formatMutationDetails(proposal) {
  const operation = proposal.operation ?? 'append'
  const lines = [`   operation: ${operation}`]

  if ((operation === 'replace' || operation === 'retire') && proposal.previousValue !== undefined) {
    lines.push(`   previous claim: ${formatProposalValue(proposal.previousValue)}`)
  }

  if (operation === 'consolidate' && Array.isArray(proposal.previousValues)) {
    lines.push('   source claims:')
    proposal.previousValues.forEach((value, index) => {
      lines.push(`     ${index + 1}. ${formatProposalValue(value)}`)
    })
  }

  return lines
}

function formatPendingEntry(entry, index) {
  const proposal = entry.proposal
  const claim = formatProposalValue(proposal.value)
  const provenanceSource = typeof proposal.provenance?.source === 'string'
    ? proposal.provenance.source
    : 'unknown'

  return [
    `${index + 1}. ${proposal.id}`,
    `   target: ${proposal.target}`,
    ...formatMutationDetails(proposal),
    `   claim: ${claim}`,
    `   confidence: ${proposal.confidence}`,
    `   proposer: ${proposal.proposer}`,
    `   provenance: ${provenanceSource}`,
  ].join('\n')
}

export function createDshGovernanceCommand({ ctx, consumer, soulId, reviewerId } = {}) {
  if (!ctx || typeof ctx.emit !== 'function') {
    throw new TypeError('DSH governance command requires ctx.emit')
  }
  if (!consumer || typeof consumer.listPending !== 'function') {
    throw new TypeError('DSH governance command requires governance consumer')
  }
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('DSH governance command requires soulId')
  }
  if (!reviewerId || typeof reviewerId !== 'string') {
    throw new TypeError('DSH governance command requires reviewerId')
  }

  return Object.freeze({
    name: 'soul-review',
    description: 'review pending AI Soul growth proposals',
    input: { hint: '[list|approve <proposalId> [reason]|reject <proposalId> <reason>]' },
    recordInput: false,
    async handler(invocation = {}) {
      const parsed = parseCommandInput(invocation.rawInput)
      if (parsed.action === 'invalid') {
        return commandError('Usage: /soul-review [list|approve <proposalId> [reason]|reject <proposalId> <reason>]')
      }

      const pending = consumer.listPending().filter((entry) => entry.soulId === soulId)
      if (parsed.action === 'list') {
        if (pending.length === 0) return commandSuccess('No pending AI Soul governance proposals.')
        return commandSuccess([
          `Pending AI Soul governance proposals: ${pending.length}`,
          ...pending.map(formatPendingEntry),
        ].join('\n'))
      }

      const entry = pending.find((item) => item.proposal.id === parsed.proposalId)
      if (!entry) return commandError(`Pending governance proposal not found: ${parsed.proposalId}`)
      if (parsed.action === 'reject' && !parsed.reason) {
        return commandError('Reject requires a reason: /soul-review reject <proposalId> <reason>')
      }

      const reason = parsed.reason || 'Approved by the configured human reviewer through the DSH command plane.'
      const decision = parsed.action === 'approve' ? 'approved' : 'rejected'
      const reviewResults = await ctx.emit('ai-soul/governance-review', {
        soulId,
        proposalId: parsed.proposalId,
        reviewer: reviewerId,
        decision,
        reason,
        provenance: {
          source: 'dsh-command',
          boundary: 'soul-review-v1',
          ...(invocation.commandId == null ? {} : { commandId: String(invocation.commandId) }),
        },
      })

      const resolved = Array.isArray(reviewResults)
        ? reviewResults.find((result) => result?.proposal?.id === parsed.proposalId)
        : undefined
      if (resolved && resolved.status !== decision) {
        return commandError(`Governance review did not resolve as ${decision}.`)
      }

      return commandSuccess(
        decision === 'approved'
          ? `Approved and persisted governance proposal: ${parsed.proposalId}`
          : `Rejected governance proposal without Soul-state mutation: ${parsed.proposalId}`,
      )
    },
  })
}

export function registerDshGovernanceCommand(ctx, options = {}) {
  const commands = typeof ctx?.get === 'function' ? ctx.get('commands') : ctx?.commands
  if (!commands) return { status: 'unavailable' }
  if (typeof commands.register !== 'function') {
    throw new TypeError('DSH commands service must expose register()')
  }

  commands.register(createDshGovernanceCommand({ ctx, ...options }))
  return { status: 'registered' }
}

import { assessCognitionCapacityPreflight } from '../core/cognition-capacity-preflight.js'
import { deriveCognitionCapacityGuidance } from '../core/cognition-capacity-guidance.js'
import { createStateTransitionProposal, STATE_TRANSITION_TARGETS } from '../core/state-transition.js'

function commandError(text) { return { kind: 'error', text } }
function commandSuccess(text) { return { kind: 'success', text } }

function parseCommandInput(rawInput = '') {
  const input = rawInput.trim()
  if (!input || input === 'list') return { action: 'list' }
  if (input.startsWith('consolidate ')) {
    const rawPayload = input.slice('consolidate '.length).trim()
    try { return { action: 'consolidate', payload: JSON.parse(rawPayload) } }
    catch { return { action: 'invalid-consolidate' } }
  }
  const [action, proposalId, ...reasonParts] = input.split(/\s+/u)
  if (action !== 'approve' && action !== 'reject') return { action: 'invalid' }
  if (!proposalId) return { action: 'invalid' }
  return { action, proposalId, reason: reasonParts.join(' ').trim() }
}

function formatProposalValue(value) {
  if (typeof value?.claim === 'string') return value.claim
  return JSON.stringify(value)
}

function formatMutationDetails(proposal) {
  const operation = proposal.operation ?? 'append'
  const lines = [`   operation: ${operation}`]
  if ((operation === 'replace' || operation === 'retire') && proposal.previousValue !== undefined) lines.push(`   previous claim: ${formatProposalValue(proposal.previousValue)}`)
  if (operation === 'consolidate' && Array.isArray(proposal.previousValues)) {
    lines.push('   source claims:')
    proposal.previousValues.forEach((value, index) => lines.push(`     ${index + 1}. ${formatProposalValue(value)}`))
  }
  return lines
}

function formatCapacityPreflight(preflight) {
  if (!preflight) return []
  if (preflight.status === 'not-applicable') return ['   capacity: not-applicable']
  return [`   capacity: ${preflight.status} (${preflight.count}/${preflight.capacity})`]
}

function formatCapacityGuidance(guidance) {
  if (!guidance || guidance.status !== 'consolidation-required') return []
  return [
    `   next step: ${guidance.nextStep.operation} at least ${guidance.nextStep.minimumSources} current claims through ${guidance.nextStep.authority}`,
  ]
}

function formatPendingEntry(entry, index, state) {
  const proposal = entry.proposal
  const claim = formatProposalValue(proposal.value)
  const provenanceSource = typeof proposal.provenance?.source === 'string' ? proposal.provenance.source : 'unknown'
  const preflight = state == null ? null : assessCognitionCapacityPreflight({ state, proposal })
  const guidance = state == null ? null : deriveCognitionCapacityGuidance({ state, proposal })

  return [
    `${index + 1}. ${proposal.id}`,
    `   target: ${proposal.target}`,
    ...formatMutationDetails(proposal),
    ...formatCapacityPreflight(preflight),
    ...formatCapacityGuidance(guidance),
    `   claim: ${claim}`,
    `   confidence: ${proposal.confidence}`,
    `   proposer: ${proposal.proposer}`,
    `   provenance: ${provenanceSource}`,
  ].join('\n')
}

function currentTarget(state, target) {
  if (target === 'relationship.state') return state?.relationship?.state
  return state?.[target]
}

function deepEqual(left, right) { return JSON.stringify(left) === JSON.stringify(right) }

function createHumanConsolidationProposal({ payload, state, soulId, reviewerId, commandId }) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new TypeError('consolidation payload must be a JSON object')
  const { target, sources, claim, reason } = payload
  if (!STATE_TRANSITION_TARGETS.includes(target)) throw new TypeError('consolidation target is not supported')
  if (!Array.isArray(sources) || sources.length < 2) throw new TypeError('consolidation requires at least two source claims')
  if (claim == null || typeof claim !== 'object' || Array.isArray(claim)) throw new TypeError('consolidated claim must be an object')
  if (!reason || typeof reason !== 'string') throw new TypeError('consolidation requires a reason')
  if (state == null) throw new TypeError('current Soul state is unavailable')
  const current = currentTarget(state, target)
  if (!Array.isArray(current)) throw new TypeError('consolidation target is not a current cognition array')
  for (const source of sources) {
    const matches = current.filter((entry) => deepEqual(entry, source)).length
    if (matches !== 1) throw new TypeError('each consolidation source must exactly match one current claim')
  }
  return createStateTransitionProposal({
    target,
    operation: 'consolidate',
    previousValues: sources,
    value: claim,
    reason,
    evidence: [{ kind: 'explicit-human-consolidation-command', soulId, ...(commandId == null ? {} : { commandId: String(commandId) }) }],
    provenance: { source: 'dsh-command', boundary: 'soul-review-consolidate-v1', ...(commandId == null ? {} : { commandId: String(commandId) }) },
    confidence: 1,
    proposer: `${reviewerId}:consolidation-proposer`,
  })
}

export function createDshGovernanceCommand({ ctx, consumer, soulId, reviewerId, getState } = {}) {
  if (!ctx || typeof ctx.emit !== 'function') throw new TypeError('DSH governance command requires ctx.emit')
  if (!consumer || typeof consumer.listPending !== 'function') throw new TypeError('DSH governance command requires governance consumer')
  if (!soulId || typeof soulId !== 'string') throw new TypeError('DSH governance command requires soulId')
  if (!reviewerId || typeof reviewerId !== 'string') throw new TypeError('DSH governance command requires reviewerId')
  if (getState != null && typeof getState !== 'function') throw new TypeError('DSH governance command getState must be a function')

  return Object.freeze({
    name: 'soul-review',
    description: 'review or explicitly propose governed AI Soul cognition changes',
    input: { hint: '[list|approve <proposalId> [reason]|reject <proposalId> <reason>|consolidate <json>]' },
    recordInput: false,
    async handler(invocation = {}) {
      const parsed = parseCommandInput(invocation.rawInput)
      if (parsed.action === 'invalid-consolidate') return commandError('Consolidate requires valid JSON: /soul-review consolidate {"target":"userModel","sources":[...],"claim":{...},"reason":"..."}')
      if (parsed.action === 'invalid') return commandError('Usage: /soul-review [list|approve <proposalId> [reason]|reject <proposalId> <reason>|consolidate <json>]')
      if (parsed.action === 'consolidate') {
        let proposal
        try {
          proposal = createHumanConsolidationProposal({ payload: parsed.payload, state: getState?.(), soulId, reviewerId, commandId: invocation.commandId })
        } catch (error) {
          return commandError(`Consolidation proposal rejected: ${error.message}`)
        }
        const results = await ctx.emit('ai-soul/governance-proposal', { soulId, proposal })
        const accepted = Array.isArray(results) ? results.some((result) => result?.proposal?.id === proposal.id && result?.status === 'pending') : false
        if (!accepted) return commandError('Governance transport did not accept the consolidation proposal.')
        return commandSuccess(`Proposed consolidation for independent review without Soul-state mutation: ${proposal.id}`)
      }
      const pending = consumer.listPending().filter((entry) => entry.soulId === soulId)
      if (parsed.action === 'list') {
        if (pending.length === 0) return commandSuccess('No pending AI Soul governance proposals.')
        const state = getState?.()
        return commandSuccess([`Pending AI Soul governance proposals: ${pending.length}`, ...pending.map((entry, index) => formatPendingEntry(entry, index, state))].join('\n'))
      }
      const entry = pending.find((item) => item.proposal.id === parsed.proposalId)
      if (!entry) return commandError(`Pending governance proposal not found: ${parsed.proposalId}`)
      if (parsed.action === 'reject' && !parsed.reason) return commandError('Reject requires a reason: /soul-review reject <proposalId> <reason>')
      const reason = parsed.reason || 'Approved by the configured human reviewer through the DSH command plane.'
      const decision = parsed.action === 'approve' ? 'approved' : 'rejected'
      const reviewResults = await ctx.emit('ai-soul/governance-review', {
        soulId,
        proposalId: parsed.proposalId,
        reviewer: reviewerId,
        decision,
        reason,
        provenance: { source: 'dsh-command', boundary: 'soul-review-v1', ...(invocation.commandId == null ? {} : { commandId: String(invocation.commandId) }) },
      })
      const resolved = Array.isArray(reviewResults) ? reviewResults.find((result) => result?.proposal?.id === parsed.proposalId) : undefined
      if (resolved && resolved.status !== decision) return commandError(`Governance review did not resolve as ${decision}.`)
      return commandSuccess(decision === 'approved' ? `Approved and persisted governance proposal: ${parsed.proposalId}` : `Rejected governance proposal without Soul-state mutation: ${parsed.proposalId}`)
    },
  })
}

export function registerDshGovernanceCommand(ctx, options = {}) {
  const commands = typeof ctx?.get === 'function' ? ctx.get('commands') : ctx?.commands
  if (!commands) return { status: 'unavailable' }
  if (typeof commands.register !== 'function') throw new TypeError('DSH commands service must expose register()')
  commands.register(createDshGovernanceCommand({ ctx, ...options }))
  return { status: 'registered' }
}

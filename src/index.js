import { resolve } from 'node:path'

import {
  createCandidatePromotionProposal,
  FileSoulStore,
  projectSoulContext,
  renderSoulContext,
} from './core/index.js'
import { createDshGovernanceConsumer } from './adapters/governance-consumer.js'
import { registerDshGovernanceCommand } from './adapters/governance-command.js'
import { processDshHumanInteraction } from './adapters/interaction-processing.js'

export const name = 'ai-soul'
export const inject = ['systemPrompt']

function validateConfig(config = {}) {
  if (!config.soulId || typeof config.soulId !== 'string') {
    throw new TypeError('dsh-ai-soul config error: config.soulId is required')
  }
  if (!config.storeDir || typeof config.storeDir !== 'string') {
    throw new TypeError('dsh-ai-soul config error: config.storeDir is required')
  }
  if (!config.firstEncounterParticipant?.id || typeof config.firstEncounterParticipant.id !== 'string') {
    throw new TypeError('dsh-ai-soul config error: config.firstEncounterParticipant.id is required')
  }

  return {
    soulId: config.soulId,
    storeDir: resolve(config.storeDir),
    contextOrder: Number.isFinite(config.contextOrder) ? config.contextOrder : -10,
    firstEncounterParticipant: structuredClone(config.firstEncounterParticipant),
  }
}

function renderCurrentSoulContext(state, soulId) {
  try {
    return renderSoulContext(projectSoulContext(state))
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      `dsh-ai-soul context-projection error for soulId=${soulId}: ${detail}`,
      { cause: error },
    )
  }
}

function createLiveGovernanceProposal(candidateClaim) {
  return createCandidatePromotionProposal(candidateClaim, {
    id: `proposal:dsh-live:${encodeURIComponent(candidateClaim.id)}`,
    at: candidateClaim.createdAt,
    reason: 'A bounded, provenance-linked candidate claim from live DSH interaction requires independent governance.',
    proposer: 'dsh-ai-soul:live-interaction',
    provenance: {
      source: 'dsh-session-event',
      boundary: 'ai-soul/governance-proposal-v1',
    },
  })
}

export async function apply(ctx, rawConfig = {}) {
  if (!ctx) throw new TypeError('dsh-ai-soul runtime error: DSH context is required')
  if (!ctx.systemPrompt?.context) {
    throw new TypeError('dsh-ai-soul runtime error: required DSH systemPrompt service is unavailable')
  }
  if (typeof ctx.on !== 'function' || typeof ctx.emit !== 'function') {
    throw new TypeError('dsh-ai-soul runtime error: required DSH event API is unavailable')
  }

  const config = validateConfig(rawConfig)
  const store = new FileSoulStore({ rootDir: config.storeDir })

  let currentState
  try {
    currentState = await store.load(config.soulId)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      `dsh-ai-soul store-load error: unable to load soulId=${config.soulId} from storeDir=${config.storeDir}: ${detail}`,
      { cause: error },
    )
  }

  renderCurrentSoulContext(currentState, config.soulId)
  ctx.systemPrompt.context({
    name: `ai-soul:${config.soulId}`,
    order: config.contextOrder,
    text: () => renderCurrentSoulContext(currentState, config.soulId),
  })

  const governanceConsumer = createDshGovernanceConsumer(ctx, { store })

  let interactionQueue = Promise.resolve()
  ctx.on('session/event', (session, event) => {
    interactionQueue = interactionQueue.then(async () => {
      const processed = await processDshHumanInteraction({
        store,
        soulId: config.soulId,
        session,
        event,
        participant: config.firstEncounterParticipant,
      })

      if (processed.firstEncounter?.status === 'recorded') {
        currentState = await store.load(config.soulId)
      }

      if (processed.candidateClaim) {
        const proposal = createLiveGovernanceProposal(processed.candidateClaim)
        await ctx.emit('ai-soul/governance-proposal', {
          soulId: config.soulId,
          proposal,
        })
      }

      return processed
    })
    return interactionQueue
  })

  let refreshQueue = Promise.resolve()
  ctx.on('ai-soul/state-committed', (payload) => {
    refreshQueue = refreshQueue.then(async () => {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) || typeof payload.soulId !== 'string') {
        throw new TypeError('dsh-ai-soul state-committed event requires payload.soulId')
      }
      if (payload.soulId !== config.soulId) {
        return { status: 'ignored', soulId: payload.soulId }
      }

      currentState = await store.load(config.soulId)
      return { status: 'refreshed', soulId: config.soulId }
    })
    return refreshQueue
  })

  registerDshGovernanceCommand(ctx, {
    consumer: governanceConsumer,
    soulId: config.soulId,
    reviewerId: `human:${config.firstEncounterParticipant.id}`,
  })

  console.log(`[dsh-ai-soul] loaded Soul ${config.soulId}`)
}

export * from './core/index.js'
export {
  MAX_DSH_EXPERIENCE_TEXT_CHARS,
  mapDshHumanMessageToExperience,
  normalizeDshHumanInteraction,
} from './adapters/runtime-event.js'
export { captureFirstEncounterFromDshEvent } from './adapters/first-encounter.js'
export {
  EXPLICIT_DURABLE_PREFERENCE_POLICY,
  inferExplicitDurableUserPreference,
} from './adapters/durable-preference.js'
export {
  EXPLICIT_RELATIONSHIP_STATE_POLICY,
  inferExplicitRelationshipState,
} from './adapters/relationship-state.js'
export {
  DSH_SIGNIFICANCE_BASELINE_POLICY,
  createFailClosedSignificanceAssessment,
  processDshHumanInteraction,
} from './adapters/interaction-processing.js'
export { createDshGovernanceConsumer } from './adapters/governance-consumer.js'
export {
  createDshGovernanceCommand,
  registerDshGovernanceCommand,
} from './adapters/governance-command.js'
export { preflightSoul } from './preflight.js'
export {
  parseAiSoulPatch,
  preflightDshProfile,
  preflightDshProfileDir,
  SURFACE_BUNDLES,
} from './profile-preflight.js'
export {
  preflightDshSurfaceContinuity,
  preflightDshSurfaceContinuityDirs,
} from './surface-continuity-preflight.js'
import { resolve } from 'node:path'

import {
  createCandidatePromotionProposal,
  FileSoulStore,
  projectSoulContext,
  renderSoulContext,
} from './core/index.js'
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

function createLiveGovernanceProposal(candidateClaim) {
  return createCandidatePromotionProposal(candidateClaim, {
    id: `proposal:dsh-live:${encodeURIComponent(candidateClaim.id)}`,
    at: candidateClaim.createdAt,
    reason: 'The human explicitly requested durable retention of this bounded user preference.',
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

  let state
  try {
    state = await store.load(config.soulId)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      `dsh-ai-soul store-load error: unable to load soulId=${config.soulId} from storeDir=${config.storeDir}: ${detail}`,
      { cause: error },
    )
  }

  let text
  try {
    const projection = projectSoulContext(state)
    text = renderSoulContext(projection)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      `dsh-ai-soul context-projection error for soulId=${config.soulId}: ${detail}`,
      { cause: error },
    )
  }

  ctx.systemPrompt.context({
    name: `ai-soul:${config.soulId}`,
    order: config.contextOrder,
    text,
  })

  // Serialize human interactions so lifecycle persistence and ephemeral
  // Experience/significance/candidate processing observe one ordered event stream.
  // A positive candidate is handed off as an unreviewed governance proposal;
  // this plugin never reviews, applies, or persists that proposal.
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

      if (processed.candidateClaim) {
        const proposal = createLiveGovernanceProposal(processed.candidateClaim)
        ctx.emit('ai-soul/governance-proposal', {
          soulId: config.soulId,
          proposal,
        })
      }

      return processed
    })
    return interactionQueue
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
  DSH_SIGNIFICANCE_BASELINE_POLICY,
  createFailClosedSignificanceAssessment,
  processDshHumanInteraction,
} from './adapters/interaction-processing.js'
export { preflightSoul } from './preflight.js'
export {
  parseAiSoulPatch,
  preflightDshProfile,
  preflightDshProfileDir,
  SURFACE_BUNDLES,
} from './profile-preflight.js'

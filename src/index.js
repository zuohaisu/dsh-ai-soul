import { resolve } from 'node:path'

import {
  FileSoulStore,
  projectSoulContext,
  renderSoulContext,
} from './core/index.js'
import { captureFirstEncounterFromDshEvent } from './adapters/first-encounter.js'

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

export async function apply(ctx, rawConfig = {}) {
  if (!ctx) throw new TypeError('dsh-ai-soul runtime error: DSH context is required')
  if (!ctx.systemPrompt?.context) {
    throw new TypeError('dsh-ai-soul runtime error: required DSH systemPrompt service is unavailable')
  }
  if (typeof ctx.on !== 'function') {
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

  // Serialize candidates so two near-simultaneous human messages cannot race two
  // first-encounter writes. Each candidate still reloads persisted truth.
  let encounterQueue = Promise.resolve()
  ctx.on('session/event', (session, event) => {
    encounterQueue = encounterQueue.then(() => captureFirstEncounterFromDshEvent({
      store,
      soulId: config.soulId,
      session,
      event,
      participant: config.firstEncounterParticipant,
    }))
    return encounterQueue
  })

  console.log(`[dsh-ai-soul] loaded Soul ${config.soulId}`)
}

export * from './core/index.js'
export { normalizeDshHumanInteraction } from './adapters/runtime-event.js'
export { captureFirstEncounterFromDshEvent } from './adapters/first-encounter.js'
export { preflightSoul } from './preflight.js'
export {
  parseAiSoulPatch,
  preflightDshProfile,
  preflightDshProfileDir,
  SURFACE_BUNDLES,
} from './profile-preflight.js'

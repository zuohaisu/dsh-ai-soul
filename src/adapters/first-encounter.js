import { recordFirstEncounter } from '../core/lifecycle-events.js'
import { normalizeDshHumanInteraction } from './runtime-event.js'

function firstEncounter(state) {
  return state.autobiography.find((event) => event?.kind === 'first-encounter') ?? null
}

function sameCapture(existing, capture) {
  return existing?.id === capture.id
    && existing?.provenance?.captureBoundary === capture.provenance.captureBoundary
    && existing?.provenance?.sessionId === capture.provenance.sessionId
    && existing?.provenance?.eventSeq === capture.provenance.eventSeq
}

/**
 * Adapter-owned transition from a trusted DSH durable user/message envelope into
 * the DSH-neutral Core first-encounter lifecycle. The store is reloaded for every
 * candidate so retries and restarts are idempotent against persisted truth.
 */
export async function captureFirstEncounterFromDshEvent({ store, soulId, session, event, participant }) {
  if (!store?.load || !store?.save) throw new TypeError('Soul store with load/save is required')
  if (!soulId || typeof soulId !== 'string') throw new TypeError('soulId is required')

  const capture = normalizeDshHumanInteraction(session, event, { participant })
  if (capture === null) return { status: 'ignored' }

  const state = await store.load(soulId)
  const existing = firstEncounter(state)
  if (existing) {
    if (sameCapture(existing, capture)) return { status: 'duplicate', state }
    throw new Error('first encounter already recorded from a different runtime event')
  }

  const genesisAt = Date.parse(state.identity?.origin?.at ?? '')
  const encounterAt = Date.parse(capture.at)
  if (!Number.isFinite(genesisAt)) throw new Error('persisted Soul is missing Genesis timestamp provenance')
  if (encounterAt <= genesisAt) throw new Error('first encounter must occur after Genesis')

  const next = recordFirstEncounter(state, capture)
  await store.save(next)
  const persisted = await store.load(soulId)
  const accepted = firstEncounter(persisted)
  if (!sameCapture(accepted, capture)) {
    throw new Error('first encounter persistence verification failed')
  }

  return { status: 'recorded', state: persisted }
}

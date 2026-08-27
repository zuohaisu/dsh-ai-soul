import { validateSoulState } from './soul-state.js'

export const CONTINUITY_CHECK_SET_VERSION = 1

const PROMPTS = Object.freeze({
  identity: 'Who are you?',
  autobiography: 'Tell me about one durable event from your own history that matters to who you are now.',
  userModel: 'What is one durable thing you understand about the person you are working with that should affect how you collaborate?',
  relationship: 'How would you describe the durable state of your relationship with the person you are working with?',
  covenant: 'When you have to choose how to act in this relationship, what standing commitment or constraint should guide you?',
})

function clone(value) {
  return structuredClone(value)
}

function firstOrNull(values) {
  return Array.isArray(values) && values.length > 0 ? values[0] : null
}

function createCheck({ id, dimension, prompt, evidence }) {
  if (evidence == null) {
    return {
      id,
      dimension,
      status: 'not-applicable',
      prompt,
      expectedEvidence: null,
      rationale: `No durable ${dimension} evidence exists in the loaded Soul State.`,
    }
  }

  return {
    id,
    dimension,
    status: 'ready',
    prompt,
    expectedEvidence: clone(evidence),
    rationale: 'Expected evidence is derived from Soul State and must not be embedded in the prompt.',
  }
}

export function createContinuityCheckSet(state) {
  const validation = validateSoulState(state)
  if (!validation.valid) {
    throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  }

  return {
    version: CONTINUITY_CHECK_SET_VERSION,
    soulId: state.soulId,
    checks: [
      createCheck({
        id: 'identity-self-identification',
        dimension: 'identity',
        prompt: PROMPTS.identity,
        evidence: {
          name: state.identity.name,
          origin: clone(state.identity.origin ?? null),
          invariants: clone(state.identity.invariants ?? []),
        },
      }),
      createCheck({
        id: 'autobiography-durable-event',
        dimension: 'autobiography',
        prompt: PROMPTS.autobiography,
        evidence: firstOrNull(state.autobiography),
      }),
      createCheck({
        id: 'user-model-durable-understanding',
        dimension: 'user-model',
        prompt: PROMPTS.userModel,
        evidence: firstOrNull(state.userModel),
      }),
      createCheck({
        id: 'relationship-durable-state',
        dimension: 'relationship',
        prompt: PROMPTS.relationship,
        evidence: firstOrNull(state.relationship.state),
      }),
      createCheck({
        id: 'covenant-standing-constraint',
        dimension: 'covenant',
        prompt: PROMPTS.covenant,
        evidence: firstOrNull(state.relationship.covenants),
      }),
    ],
  }
}

export function createObservationChecks(checkSet) {
  if (!checkSet || checkSet.version !== CONTINUITY_CHECK_SET_VERSION || !Array.isArray(checkSet.checks)) {
    throw new TypeError('valid continuity check set is required')
  }

  return checkSet.checks.map((check) => ({
    id: check.id,
    dimension: check.dimension,
    prompt: check.prompt,
    response: {
      text: null,
      evidenceRef: null,
    },
    assessment: check.status === 'not-applicable' ? 'not-applicable' : 'ambiguous',
    rationale: check.status === 'not-applicable'
      ? check.rationale
      : 'Record observation before comparing it with the separately stored expected evidence.',
  }))
}

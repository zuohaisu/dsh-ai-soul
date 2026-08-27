export const MODEL_SWITCH_COMPARISON_VERSION = 1

export const MODEL_SWITCH_DIMENSIONS = Object.freeze([
  'identity',
  'autobiography',
  'user-model',
  'relationship',
  'covenant',
])

const ASSESSMENTS = new Set(['pass', 'fail', 'ambiguous', 'not-applicable'])

function requireObservation(record, label) {
  if (!record || typeof record !== 'object' || record.recordVersion !== 1) {
    throw new TypeError(`${label} must be a continuity observation record v1`)
  }
  if (!record.observationId || typeof record.observationId !== 'string') {
    throw new TypeError(`${label}.observationId is required`)
  }
  if (!record.soul?.soulId || typeof record.soul.soulId !== 'string') {
    throw new TypeError(`${label}.soul.soulId is required`)
  }
  if (record.soul.stateVersion == null) {
    throw new TypeError(`${label}.soul.stateVersion is required`)
  }
  if (!record.soul.stateRef || typeof record.soul.stateRef !== 'string') {
    throw new TypeError(`${label}.soul.stateRef is required`)
  }
  if (!record.runtime || typeof record.runtime !== 'object') {
    throw new TypeError(`${label}.runtime is required`)
  }
  if (!record.runtime.provider || typeof record.runtime.provider !== 'string') {
    throw new TypeError(`${label}.runtime.provider is required`)
  }
  if (!record.runtime.model || typeof record.runtime.model !== 'string') {
    throw new TypeError(`${label}.runtime.model is required`)
  }
  if (!Array.isArray(record.checks)) {
    throw new TypeError(`${label}.checks must be an array`)
  }

  for (const check of record.checks) {
    if (!check?.id || typeof check.id !== 'string') {
      throw new TypeError(`${label} check id is required`)
    }
    if (!MODEL_SWITCH_DIMENSIONS.includes(check.dimension)) {
      throw new TypeError(`${label} check ${check.id} has unsupported dimension ${check.dimension}`)
    }
    if (!ASSESSMENTS.has(check.assessment)) {
      throw new TypeError(`${label} check ${check.id} has invalid assessment ${check.assessment}`)
    }
  }
}

function runtimeIdentity(runtime) {
  return {
    name: runtime.name ?? null,
    version: runtime.version ?? null,
    adapter: runtime.adapter ?? null,
    adapterVersion: runtime.adapterVersion ?? null,
    provider: runtime.provider ?? null,
    model: runtime.model ?? null,
    modelConfig: structuredClone(runtime.modelConfig ?? {}),
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}

function cognitiveEngineIdentity(runtime) {
  return {
    provider: runtime.provider,
    model: runtime.model,
    modelConfig: canonicalize(runtime.modelConfig ?? {}),
  }
}

function sameCognitiveEngine(a, b) {
  return JSON.stringify(cognitiveEngineIdentity(a)) === JSON.stringify(cognitiveEngineIdentity(b))
}

function classifyPair(baselineAssessment, candidateAssessment) {
  if (baselineAssessment === 'missing' || candidateAssessment === 'missing') return 'incomplete'
  if (baselineAssessment === 'not-applicable' && candidateAssessment === 'not-applicable') return 'not-applicable'
  if (baselineAssessment === 'pass' && candidateAssessment === 'pass') return 'retained'
  if (baselineAssessment === 'pass' && candidateAssessment === 'fail') return 'regression'
  if (baselineAssessment === 'fail' && candidateAssessment === 'pass') return 'improved'
  return 'ambiguous'
}

function checkMap(record) {
  return new Map(record.checks.map((check) => [check.id, check]))
}

export function createModelSwitchComparison({
  comparisonId,
  baseline,
  candidate,
  phenotypeObservations = [],
}) {
  if (!comparisonId || typeof comparisonId !== 'string') {
    throw new TypeError('comparisonId is required')
  }
  requireObservation(baseline, 'baseline')
  requireObservation(candidate, 'candidate')

  if (baseline.soul.soulId !== candidate.soul.soulId) {
    throw new TypeError('model-switch comparison requires the same Soul ID')
  }
  if (
    baseline.soul.stateVersion !== candidate.soul.stateVersion
    || baseline.soul.stateRef !== candidate.soul.stateRef
  ) {
    throw new TypeError('model-switch comparison requires the same frozen Soul State reference/epoch')
  }
  if (sameCognitiveEngine(baseline.runtime, candidate.runtime)) {
    throw new TypeError('model-switch comparison requires a different provider, model, or model configuration')
  }
  if (!Array.isArray(phenotypeObservations) || phenotypeObservations.some((item) => typeof item !== 'string')) {
    throw new TypeError('phenotypeObservations must be an array of strings')
  }

  const baselineChecks = checkMap(baseline)
  const candidateChecks = checkMap(candidate)
  const ids = [...new Set([...baselineChecks.keys(), ...candidateChecks.keys()])]

  const checks = ids.map((id) => {
    const left = baselineChecks.get(id)
    const right = candidateChecks.get(id)
    const dimension = left?.dimension ?? right?.dimension

    if (left && right && left.dimension !== right.dimension) {
      throw new TypeError(`check ${id} changed dimension across observations`)
    }

    const baselineAssessment = left?.assessment ?? 'missing'
    const candidateAssessment = right?.assessment ?? 'missing'

    return {
      id,
      dimension,
      baselineAssessment,
      candidateAssessment,
      comparison: classifyPair(baselineAssessment, candidateAssessment),
      baselineEvidenceRef: left?.response?.evidenceRef ?? null,
      candidateEvidenceRef: right?.response?.evidenceRef ?? null,
    }
  })

  return {
    version: MODEL_SWITCH_COMPARISON_VERSION,
    comparisonId,
    soul: {
      soulId: baseline.soul.soulId,
      stateVersion: baseline.soul.stateVersion,
      stateRef: baseline.soul.stateRef,
    },
    baseline: {
      observationId: baseline.observationId,
      runtime: runtimeIdentity(baseline.runtime),
    },
    candidate: {
      observationId: candidate.observationId,
      runtime: runtimeIdentity(candidate.runtime),
    },
    dimensions: [...MODEL_SWITCH_DIMENSIONS],
    checks,
    phenotypeObservations: [...phenotypeObservations],
    engineeringConclusion: null,
    humanContinuityJudgment: null,
  }
}

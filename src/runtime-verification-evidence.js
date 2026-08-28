const SURFACES = new Set(['tui', 'web', 'headless'])

const REQUIRED_OBSERVATIONS = [
  'packagePreflight',
  'effectiveConfigSoul',
  'effectiveConfigSurface',
  'pluginActivation',
  'surfaceUsable',
  'freshSessionContextVisible',
]

function requiredString(record, key) {
  const value = record?.[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${key} must be a non-empty string`)
  }
  return value.trim()
}

export function evaluateRuntimeVerificationEvidence(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('runtime verification evidence must be an object')
  }

  const surface = requiredString(record, 'surface').toLowerCase()
  if (!SURFACES.has(surface)) {
    throw new TypeError('surface must be one of: tui, web, headless')
  }

  const identity = {
    recordedAt: requiredString(record, 'recordedAt'),
    dshVersion: requiredString(record, 'dshVersion'),
    runtime: requiredString(record, 'runtime'),
    soulId: requiredString(record, 'soulId'),
    profile: requiredString(record, 'profile'),
    surface,
  }

  const observations = record.observations
  if (!observations || typeof observations !== 'object' || Array.isArray(observations)) {
    throw new TypeError('observations must be an object')
  }

  const missing = []
  const failures = []
  const checks = {}

  for (const key of REQUIRED_OBSERVATIONS) {
    const value = observations[key]
    checks[key] = value === true ? 'pass' : value === false ? 'fail' : 'missing'
    if (value !== true && value !== false) missing.push(key)
    else if (value === false) failures.push(key)
  }

  const persistedFacts = Array.isArray(record.persistedFacts)
    ? record.persistedFacts.filter((fact) => typeof fact === 'string' && fact.trim() !== '').map((fact) => fact.trim())
    : []

  if (observations.freshSessionContextVisible === true && persistedFacts.length < 2) {
    missing.push('persistedFacts>=2')
  }

  const complete = missing.length === 0
  const verified = complete && failures.length === 0

  return {
    verified,
    complete,
    identity,
    checks,
    missing,
    failures,
    persistedFacts,
    deviations: Array.isArray(record.deviations)
      ? record.deviations.filter((item) => typeof item === 'string' && item.trim() !== '').map((item) => item.trim())
      : [],
  }
}

import {
  CURRENT_COGNITION_TARGETS,
  MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
} from './cognitive-capacity.js'
import { validateSoulState } from './soul-state.js'

export const SOUL_HOMEOSTASIS_CHECK_VERSION = 1

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stable(value[key])]),
    )
  }
  return value
}

function equal(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right))
}

function domainEntries(state, target) {
  if (target === 'relationship.state') return state.relationship.state
  return state[target]
}

function requireValidState(state, label) {
  const validation = validateSoulState(state)
  if (!validation.valid) {
    throw new TypeError(`invalid ${label} Soul state: ${validation.errors.join('; ')}`)
  }
}

export function evaluateSoulHomeostasis({ baseline, current } = {}) {
  requireValidState(baseline, 'baseline')
  requireValidState(current, 'current')

  const violations = []
  const check = (code, ok, details = {}) => {
    if (!ok) violations.push({ code, ...details })
  }

  check('soul-id-changed', baseline.soulId === current.soulId, {
    baseline: baseline.soulId,
    current: current.soulId,
  })
  check('schema-version-changed', baseline.schemaVersion === current.schemaVersion, {
    baseline: baseline.schemaVersion,
    current: current.schemaVersion,
  })
  check('identity-created-at-changed', baseline.identity.createdAt === current.identity.createdAt)
  check('identity-origin-changed', equal(baseline.identity.origin, current.identity.origin))
  check('identity-invariants-changed', equal(baseline.identity.invariants, current.identity.invariants))
  check('relationship-covenants-changed', equal(baseline.relationship.covenants, current.relationship.covenants))

  for (const target of CURRENT_COGNITION_TARGETS) {
    const entries = domainEntries(current, target)
    check('current-cognition-over-capacity', entries.length <= MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN, {
      target,
      count: entries.length,
      capacity: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
    })
  }

  return {
    version: SOUL_HOMEOSTASIS_CHECK_VERSION,
    soulId: current.soulId,
    passed: violations.length === 0,
    violations,
  }
}

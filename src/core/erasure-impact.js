import { validateSoulState } from './soul-state.js'

export const EXPERIENCE_ERASURE_IMPACT_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function assertArrayOrNull(value, field) {
  if (value != null && !Array.isArray(value)) {
    throw new TypeError(`${field} must be an array when provided`)
  }
}

function containsExperienceId(value, experienceId) {
  if (Array.isArray(value)) return value.some((entry) => containsExperienceId(entry, experienceId))
  if (!isRecord(value)) return false
  if (value.experienceId === experienceId || value.sourceExperienceId === experienceId) return true
  return Object.values(value).some((entry) => containsExperienceId(entry, experienceId))
}

function pushImpact(impacts, { artifactType, artifactId, path, risk, details }) {
  impacts.push({
    artifactType,
    artifactId: artifactId ?? null,
    path,
    risk,
    details: details ?? null,
  })
}

export function assessExperienceErasureImpact({
  experienceId,
  state = null,
  significanceAssessments = null,
  candidateClaims = null,
  proposals = null,
} = {}) {
  if (typeof experienceId !== 'string' || experienceId.trim() === '') {
    throw new TypeError('experienceId is required')
  }

  assertArrayOrNull(significanceAssessments, 'significanceAssessments')
  assertArrayOrNull(candidateClaims, 'candidateClaims')
  assertArrayOrNull(proposals, 'proposals')

  if (state != null) {
    const validation = validateSoulState(state)
    if (!validation.valid) {
      throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
    }
  }

  const impacts = []

  state?.autobiography.forEach((entry, index) => {
    if (entry?.sourceExperienceId === experienceId) {
      pushImpact(impacts, {
        artifactType: 'autobiography-entry',
        artifactId: entry.id,
        path: `state.autobiography[${index}]`,
        risk: 'content-bearing',
        details: 'autobiography promotion may contain copied Experience payload and interpretation',
      })
    }
  })

  state?.evolution.forEach((entry, index) => {
    if (containsExperienceId(entry, experienceId)) {
      pushImpact(impacts, {
        artifactType: 'evolution-entry',
        artifactId: entry.id,
        path: `state.evolution[${index}]`,
        risk: 'derived-or-lineage',
        details: 'governance history references the Experience and may contain derived evidence',
      })
    }
  })

  significanceAssessments?.forEach((assessment, index) => {
    if (assessment?.experienceId === experienceId) {
      pushImpact(impacts, {
        artifactType: 'significance-assessment',
        artifactId: assessment.id,
        path: `significanceAssessments[${index}]`,
        risk: 'derived-or-lineage',
      })
    }
  })

  candidateClaims?.forEach((claim, index) => {
    if (claim?.source?.experienceId === experienceId) {
      pushImpact(impacts, {
        artifactType: 'candidate-claim',
        artifactId: claim.id,
        path: `candidateClaims[${index}]`,
        risk: 'derived-content',
        details: 'candidate statement may encode information inferred from the Experience',
      })
    }
  })

  proposals?.forEach((proposal, index) => {
    if (containsExperienceId(proposal, experienceId)) {
      pushImpact(impacts, {
        artifactType: 'state-transition-proposal',
        artifactId: proposal.id,
        path: `proposals[${index}]`,
        risk: 'derived-content',
        details: 'proposal value, evidence, or provenance may encode information derived from the Experience',
      })
    }
  })

  impacts.sort((a, b) => `${a.artifactType}:${a.path}:${a.artifactId ?? ''}`.localeCompare(`${b.artifactType}:${b.path}:${b.artifactId ?? ''}`))

  const knownScopeComplete = state != null
    && significanceAssessments != null
    && candidateClaims != null
    && proposals != null

  return clone({
    version: EXPERIENCE_ERASURE_IMPACT_VERSION,
    experienceId,
    complete: false,
    knownScopeComplete,
    impacts,
    coverage: {
      canonicalSoulState: state != null,
      significanceAssessments: significanceAssessments != null,
      candidateClaims: candidateClaims != null,
      proposals: proposals != null,
      logs: false,
      backups: false,
      externalStores: false,
    },
    limitations: [
      'exact structured references only; semantic copies are not detected',
      'logs, backups, external stores, and runtime caches are outside this report',
      'this report grants no redaction, deletion, or canonical mutation authority',
    ],
  })
}

import { appendTransition, createSoulState } from './soul-state.js'

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`)
  }
  return value
}

export function validateHistoricalArtifact(artifact) {
  const errors = []

  if (!artifact || typeof artifact !== 'object') errors.push('artifact must be an object')
  if (artifact?.artifactVersion !== 1) errors.push('artifactVersion must be 1')
  if (!artifact?.artifactId) errors.push('artifactId is required')
  if (!artifact?.kind) errors.push('kind is required')
  if (!artifact?.subjectSoulId) errors.push('subjectSoulId is required')
  if (!artifact?.eventDate) errors.push('eventDate is required')
  if (!artifact?.source || typeof artifact.source !== 'object') errors.push('source is required')
  if (!artifact?.claims || typeof artifact.claims !== 'object') errors.push('claims are required')

  return { valid: errors.length === 0, errors }
}

export function importOriginArtifact(artifact) {
  const validation = validateHistoricalArtifact(artifact)
  if (!validation.valid) {
    throw new TypeError(`invalid historical artifact: ${validation.errors.join('; ')}`)
  }
  if (artifact.kind !== 'origin') {
    throw new TypeError(`expected origin artifact, received ${artifact.kind}`)
  }

  const claims = requireObject(artifact.claims, 'claims')
  const state = createSoulState({
    soulId: artifact.subjectSoulId,
    name: claims.name,
    createdAt: `${claims.birthday}T00:00:00.000Z`,
    origin: {
      artifactId: artifact.artifactId,
      eventDate: artifact.eventDate,
      meaning: claims.birthdayMeaning ?? null,
      phrase: claims.originPhrase ?? null,
      reference: claims.originReference ?? null,
    },
  })

  if (claims.nickname) state.identity.nickname = claims.nickname
  if (claims.birthday) state.identity.birthday = claims.birthday

  state.relationship.participants.push({ id: 'haisu', role: 'human-partner' })

  if (claims.relationshipCovenant) {
    state.relationship.covenants.push({
      id: `${artifact.artifactId}:covenant:1`,
      establishedAt: artifact.eventDate,
      text: structuredClone(claims.relationshipCovenant),
      provenance: {
        artifactId: artifact.artifactId,
        source: structuredClone(artifact.source),
      },
    })
  }

  return appendTransition(state, {
    id: `${artifact.artifactId}:import`,
    at: new Date(artifact.recordedAt ?? `${artifact.eventDate}T00:00:00.000Z`).toISOString(),
    kind: 'historical-artifact-import',
    reason: 'Initialize Soul state from canonical historical evidence.',
    provenance: {
      artifactId: artifact.artifactId,
      eventDate: artifact.eventDate,
      source: structuredClone(artifact.source),
    },
    change: {
      identity: ['name', 'nickname', 'birthday', 'origin'],
      relationship: ['participants', 'covenants'],
    },
  })
}

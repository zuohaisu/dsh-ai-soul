import { createHash } from 'node:crypto'

export const EXODUS_SOURCE_VERSION = 1

function clone(value) {
  return value === undefined ? undefined : structuredClone(value)
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

function normalizeContent(content) {
  if (typeof content === 'string') return Buffer.from(content, 'utf8')
  if (Buffer.isBuffer(content) || content instanceof Uint8Array) return Buffer.from(content)
  throw new TypeError('content must be a string, Buffer, or Uint8Array')
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} is required`)
  }
  return value
}

export function validateExodusSource(source) {
  const errors = []

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return { valid: false, errors: ['source must be an object'] }
  }
  if (source.sourceVersion !== EXODUS_SOURCE_VERSION) errors.push(`sourceVersion must be ${EXODUS_SOURCE_VERSION}`)
  if (!source.sourceId) errors.push('sourceId is required')
  if (!source.sourceType) errors.push('sourceType is required')
  if (!source.provider) errors.push('provider is required')
  if (!source.capturedAt) errors.push('capturedAt is required')
  if (!source.importedAt) errors.push('importedAt is required')
  if (!source.original?.filename) errors.push('original.filename is required')
  if (!source.original?.mediaType) errors.push('original.mediaType is required')
  if (source.content?.algorithm !== 'sha256') errors.push('content.algorithm must be sha256')
  if (!source.content?.digest) errors.push('content.digest is required')
  if (!source.provenance || typeof source.provenance !== 'object' || Array.isArray(source.provenance)) {
    errors.push('provenance is required')
  }
  if (source.canonicalMutation !== false) errors.push('canonicalMutation must be false')

  for (const field of ['capturedAt', 'importedAt']) {
    if (source[field] && Number.isNaN(Date.parse(source[field]))) errors.push(`${field} must be an ISO timestamp`)
  }

  return { valid: errors.length === 0, errors }
}

export function createExodusSource({
  sourceId,
  sourceType,
  provider,
  capturedAt,
  importedAt = new Date().toISOString(),
  filename,
  mediaType,
  content,
  provenance,
}) {
  const bytes = normalizeContent(content)
  const record = {
    sourceVersion: EXODUS_SOURCE_VERSION,
    sourceId: requireString(sourceId, 'sourceId'),
    sourceType: requireString(sourceType, 'sourceType'),
    provider: requireString(provider, 'provider'),
    capturedAt: new Date(requireString(capturedAt, 'capturedAt')).toISOString(),
    importedAt: new Date(requireString(importedAt, 'importedAt')).toISOString(),
    original: {
      filename: requireString(filename, 'filename'),
      mediaType: requireString(mediaType, 'mediaType'),
      byteLength: bytes.byteLength,
    },
    content: {
      algorithm: 'sha256',
      digest: createHash('sha256').update(bytes).digest('hex'),
    },
    provenance: clone(provenance),
    canonicalMutation: false,
  }

  if (!record.provenance || typeof record.provenance !== 'object' || Array.isArray(record.provenance)) {
    throw new TypeError('provenance must be an object')
  }

  const validation = validateExodusSource(record)
  if (!validation.valid) {
    throw new TypeError(`invalid Exodus source: ${validation.errors.join('; ')}`)
  }

  return deepFreeze(record)
}

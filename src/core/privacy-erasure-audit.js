import { appendFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

function requiredString(value, label) {
  if (!value || typeof value !== 'string') throw new TypeError(`${label} is required`)
  return value
}

function targetOf(value, label) {
  const target = value?.target
  if (!target || target.type !== 'cognitive-memory') throw new TypeError(`${label} must target cognitive-memory`)
  return {
    type: 'cognitive-memory',
    soulId: requiredString(target.soulId, `${label}.target.soulId`),
    memoryId: requiredString(target.memoryId, `${label}.target.memoryId`),
  }
}

function sameTarget(left, right) {
  return left.type === right.type && left.soulId === right.soulId && left.memoryId === right.memoryId
}

function provenanceIdentifiers(provenance) {
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) return {}
  return Object.freeze(Object.fromEntries(Object.entries(provenance).filter(([key, value]) => (
    (key === 'source' || key.endsWith('Id')) && typeof value === 'string' && value.length > 0
  ))))
}

function validateAuditRecord(record) {
  if (!record || record.version !== 1 || record.kind !== 'privacy-erasure-audit') {
    throw new TypeError('valid privacy erasure audit record is required')
  }
  targetOf(record, 'record')
  requiredString(record.requestId, 'record.requestId')
  requiredString(record.requester, 'record.requester')
  if (record.decision !== 'approved' && record.decision !== 'rejected') throw new TypeError('record.decision is invalid')
  requiredString(record.decidedBy, 'record.decidedBy')
  requiredString(record.decisionReason, 'record.decisionReason')
  requiredString(record.recordedAt, 'record.recordedAt')
  if (typeof record.executed !== 'boolean') throw new TypeError('record.executed must be boolean')
  if (record.cascade !== false || record.canonicalSoulMutation !== false) {
    throw new TypeError('privacy erasure audit must remain non-cascade and non-canonical')
  }
  if (!record.requestProvenance || typeof record.requestProvenance !== 'object' || Array.isArray(record.requestProvenance)) {
    throw new TypeError('record.requestProvenance must contain provenance identifiers')
  }
  for (const [key, value] of Object.entries(record.requestProvenance)) {
    if ((key !== 'source' && !key.endsWith('Id')) || typeof value !== 'string' || !value) {
      throw new TypeError('record.requestProvenance must contain identifiers only')
    }
  }
  return record
}

export function createPrivacyErasureAuditRecord({ request, decision, execution = null, recordedAt = new Date().toISOString() }) {
  if (!request || request.kind !== 'privacy-erasure-request') throw new TypeError('valid privacy erasure request is required')
  if (!decision || decision.kind !== 'privacy-erasure-decision') throw new TypeError('valid privacy erasure decision is required')
  if (decision.requestId !== request.id) throw new TypeError('privacy erasure decision does not match request')

  const target = targetOf(request, 'request')
  if (!sameTarget(target, targetOf(decision, 'decision'))) throw new TypeError('privacy erasure decision target does not match request target')

  if (execution) {
    if (execution.requestId !== request.id) throw new TypeError('privacy erasure execution does not match request')
    if (!sameTarget(target, targetOf(execution, 'execution'))) throw new TypeError('privacy erasure execution target does not match request target')
    if (execution.executed === true && (execution.cascade !== false || execution.canonicalSoulMutation !== false)) {
      throw new TypeError('privacy erasure execution must remain non-cascade and non-canonical')
    }
  }

  return Object.freeze({
    version: 1,
    kind: 'privacy-erasure-audit',
    requestId: requiredString(request.id, 'request.id'),
    target,
    requester: requiredString(request.requester, 'request.requester'),
    requestProvenance: provenanceIdentifiers(request.provenance),
    decision: decision.decision,
    decidedBy: requiredString(decision.decidedBy, 'decision.decidedBy'),
    decisionReason: requiredString(decision.reason, 'decision.reason'),
    executed: execution?.executed === true,
    erasureOutcome: execution?.erasure?.erased === true ? 'erased' : execution ? execution.erasure?.reason ?? 'not-erased' : 'not-executed',
    cascade: false,
    canonicalSoulMutation: false,
    recordedAt: requiredString(recordedAt, 'recordedAt'),
  })
}

export class FilePrivacyErasureAuditStore {
  constructor({ rootDir }) {
    this.rootDir = requiredString(rootDir, 'rootDir')
  }

  async append(record) {
    validateAuditRecord(record)
    const soulId = record.target.soulId
    const memoryId = record.target.memoryId

    const dir = path.join(this.rootDir, encodeURIComponent(soulId))
    await mkdir(dir, { recursive: true })
    const file = path.join(dir, 'privacy-erasure-audit.jsonl')
    await appendFile(file, `${JSON.stringify({ ...record, target: { ...record.target, memoryId } })}\n`, 'utf8')
  }

  async list(soulId) {
    const file = path.join(this.rootDir, encodeURIComponent(requiredString(soulId, 'soulId')), 'privacy-erasure-audit.jsonl')
    let text
    try {
      text = await readFile(file, 'utf8')
    } catch (error) {
      if (error?.code === 'ENOENT') return []
      throw error
    }
    return text.trim().split('\n').filter(Boolean).map((line) => validateAuditRecord(JSON.parse(line)))
  }
}

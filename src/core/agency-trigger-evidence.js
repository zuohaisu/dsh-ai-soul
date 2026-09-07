export const AGENCY_TRIGGER_EVIDENCE_VERSION = 1

export const AGENCY_TRIGGER_EVIDENCE_TYPES = Object.freeze({
  'explicit-user-request': 'user-request-evidence',
  'governed-commitment-due': 'commitment-due-evidence',
  'governed-safety-concern': 'safety-concern-evidence',
  'governed-reflection-result': 'reflection-result-evidence',
})

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateAgencyTriggerEvidence(evidence, { soulId, triggerClass } = {}) {
  const reasons = []
  if (!isRecord(evidence)) return Object.freeze({ valid: false, reasons: Object.freeze(['trigger-evidence-required']) })

  if (evidence.version !== AGENCY_TRIGGER_EVIDENCE_VERSION) reasons.push('trigger-evidence-version-invalid')
  if (!nonEmptyString(evidence.id)) reasons.push('trigger-evidence-id-required')
  if (!nonEmptyString(evidence.soulId)) reasons.push('trigger-evidence-soul-id-required')
  if (nonEmptyString(soulId) && nonEmptyString(evidence.soulId) && evidence.soulId !== soulId) reasons.push('trigger-evidence-soul-mismatch')

  const expectedType = AGENCY_TRIGGER_EVIDENCE_TYPES[triggerClass]
  if (!expectedType || evidence.triggerClass !== triggerClass || evidence.type !== expectedType) reasons.push('trigger-evidence-class-mismatch')
  if (!isRecord(evidence.source) || !nonEmptyString(evidence.source.type) || !nonEmptyString(evidence.source.id)) reasons.push('trigger-evidence-source-required')
  if (!isRecord(evidence.provenance) || Object.keys(evidence.provenance).length === 0) reasons.push('trigger-evidence-provenance-required')
  if (evidence.authority !== 'none') reasons.push('trigger-evidence-authority-invalid')

  return Object.freeze({ valid: reasons.length === 0, reasons: Object.freeze(reasons) })
}

export function createAgencyTriggerEvidence({ id, soulId, triggerClass, source, provenance } = {}) {
  const evidence = {
    version: AGENCY_TRIGGER_EVIDENCE_VERSION,
    id,
    soulId,
    triggerClass,
    type: AGENCY_TRIGGER_EVIDENCE_TYPES[triggerClass],
    source: isRecord(source) ? structuredClone(source) : source,
    provenance: isRecord(provenance) ? structuredClone(provenance) : provenance,
    authority: 'none',
  }
  const validation = validateAgencyTriggerEvidence(evidence, { soulId, triggerClass })
  if (!validation.valid) throw new TypeError(`invalid agency trigger evidence: ${validation.reasons.join(',')}`)
  return Object.freeze(evidence)
}

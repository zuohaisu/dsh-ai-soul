import { createAgencyTriggerEvidence } from '../core/agency-trigger-evidence.js'
import { mapDshHumanMessageToExperience } from './runtime-event.js'

export const EXPLICIT_USER_REQUEST_EVIDENCE_POLICY = 'dsh-explicit-user-request-v1'

const EXPLICIT_REQUEST_PATTERNS = Object.freeze([
  /\b(?:please|pls)\s+(?:go ahead and\s+)?(?:do|create|make|send|schedule|remind|check|find|open|update|delete|run|start|stop|continue|proceed)\b/i,
  /\b(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:do|create|make|send|schedule|remind|check|find|open|update|delete|run|start|stop|continue|proceed)\b/i,
  /(?:请|麻烦你|帮我|替我|给我)(?:直接)?(?:做|创建|生成|发送|安排|提醒|检查|查找|打开|更新|删除|运行|开始|停止|继续|执行|处理)/u,
])

function explicitRequest(text) {
  return EXPLICIT_REQUEST_PATTERNS.some((pattern) => pattern.test(text))
}

export function deriveExplicitUserRequestEvidenceFromDsh(session, event, { participant, soulId } = {}) {
  if (typeof soulId !== 'string' || !soulId.trim()) throw new TypeError('explicit user request evidence requires soulId')

  const experience = mapDshHumanMessageToExperience(session, event, { participant })
  if (!experience) return null

  const text = experience.payload?.observation?.text
  if (typeof text !== 'string' || !explicitRequest(text)) return null

  return createAgencyTriggerEvidence({
    id: `agency-trigger:${encodeURIComponent(soulId)}:${encodeURIComponent(experience.id)}`,
    soulId,
    triggerClass: 'explicit-user-request',
    source: {
      type: 'experience-record',
      id: experience.id,
    },
    provenance: {
      policy: EXPLICIT_USER_REQUEST_EVIDENCE_POLICY,
      sourceExperienceId: experience.id,
      sourceRuntime: experience.source?.runtime,
      sourceSessionId: experience.source?.sessionId,
      sourceEventId: experience.source?.eventId,
      experienceProvenance: structuredClone(experience.provenance),
    },
  })
}

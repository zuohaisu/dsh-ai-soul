export {
  SOUL_STATE_VERSION,
  appendTransition,
  createSoulState,
  validateSoulState,
} from './soul-state.js'

export {
  CURRENT_COGNITION_TARGETS,
  MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
  assertCurrentCognitionAppendCapacity,
  getCurrentCognitionCapacity,
} from './cognitive-capacity.js'

export {
  SOUL_HOMEOSTASIS_CHECK_VERSION,
  evaluateSoulHomeostasis,
} from './homeostasis.js'

export {
  AGENCY_INTENT_KINDS,
  AGENCY_INTENT_MAX_ACTION_LENGTH,
  AGENCY_INTENT_VERSION,
  createAgencyIntent,
  validateAgencyIntent,
} from './agency-intent.js'

export {
  AGENCY_PERMISSION_REQUEST_MAX_CAPABILITY_LENGTH,
  AGENCY_PERMISSION_REQUEST_MAX_JUSTIFICATION_LENGTH,
  AGENCY_PERMISSION_REQUEST_MAX_SCOPE_LENGTH,
  AGENCY_PERMISSION_REQUEST_VERSION,
  createAgencyPermissionRequest,
  validateAgencyPermissionRequest,
} from './agency-permission-request.js'

export {
  AGENCY_AUTHORIZATION_DECISIONS,
  AGENCY_AUTHORIZATION_DECISION_MAX_ACTOR_ID_LENGTH,
  AGENCY_AUTHORIZATION_DECISION_MAX_ACTOR_ROLE_LENGTH,
  AGENCY_AUTHORIZATION_DECISION_MAX_REASON_LENGTH,
  AGENCY_AUTHORIZATION_DECISION_VERSION,
  createAgencyAuthorizationDecision,
  validateAgencyAuthorizationDecision,
} from './agency-authorization-decision.js'

export {
  AGENCY_AUTHORIZATION_USE_EVALUATION_VERSION,
  evaluateAgencyAuthorizationUse,
} from './agency-authorization-use.js'

export {
  AGENCY_AUTHORIZATION_CONSUMPTION_MAX_ACTOR_ID_LENGTH,
  AGENCY_AUTHORIZATION_CONSUMPTION_MAX_ACTOR_ROLE_LENGTH,
  AGENCY_AUTHORIZATION_CONSUMPTION_MAX_REASON_LENGTH,
  AGENCY_AUTHORIZATION_CONSUMPTION_VERSION,
  createAgencyAuthorizationConsumption,
  deriveConsumedAuthorizationDecisionIds,
  validateAgencyAuthorizationConsumption,
} from './agency-authorization-consumption.js'

export {
  importOriginArtifact,
  validateHistoricalArtifact,
} from './artifact-import.js'

export { FileSoulStore } from './soul-store.js'

export {
  EXPERIENCE_PAYLOAD_REDACTION_VERSION,
  EXPERIENCE_RECORD_VERSION,
  createExperienceRecord,
  promoteExperienceToAutobiography,
  redactExperiencePayload,
  validateExperienceRecord,
} from './experience.js'

export {
  EXPERIENCE_ERASURE_IMPACT_VERSION,
  assessExperienceErasureImpact,
} from './erasure-impact.js'

export {
  AUTOBIOGRAPHY_DERIVED_CONTENT_REDACTION_VERSION,
  redactAutobiographyDerivedContent,
} from './autobiography-redaction.js'

export {
  SIGNIFICANCE_ASSESSMENT_VERSION,
  SIGNIFICANCE_LEVELS,
  createSignificanceAssessment,
  validateSignificanceAssessment,
} from './significance.js'

export {
  SIGNIFICANCE_ASSESSMENT_DERIVED_CONTENT_REDACTION_VERSION,
  redactSignificanceAssessmentDerivedContent,
} from './significance-redaction.js'

export {
  CANDIDATE_CLAIM_MAX_STATEMENT_LENGTH,
  CANDIDATE_CLAIM_TARGETS,
  CANDIDATE_CLAIM_VERSION,
  createCandidateClaim,
  validateCandidateClaim,
} from './candidate-claim.js'

export {
  CANDIDATE_CLAIM_DERIVED_CONTENT_REDACTION_VERSION,
  redactCandidateClaimDerivedContent,
} from './candidate-claim-redaction.js'

export { createCandidatePromotionProposal } from './candidate-promotion.js'

export {
  DEFAULT_STATE_TRANSITION_REVIEW_POLICY,
  STATE_TRANSITION_DECISIONS,
  STATE_TRANSITION_PROPOSAL_VERSION,
  STATE_TRANSITION_TARGETS,
  applyStateTransitionProposal,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
  validateStateTransitionProposal,
} from './state-transition.js'

export {
  STATE_TRANSITION_REDACTED_ARCHIVE_VERSION,
  archiveRedactedStateTransitionProposal,
} from './state-transition-redaction.js'

export {
  attachGovernanceInbox,
  createGovernanceInbox,
} from './governance-inbox.js'

export {
  REFLECTION_RESULT_VERSION,
  createReflectionResult,
  validateReflectionResult,
} from './reflection.js'

export {
  projectEvolutionHistory,
  renderEvolutionHistory,
  renderSoulEvolutionHistory,
} from './evolution-history.js'

export {
  EVOLUTION_HISTORY_DERIVED_CONTENT_REDACTION_VERSION,
  redactEvolutionHistoryDerivedContent,
} from './evolution-history-redaction.js'

export {
  GENESIS_RECORD_VERSION,
  LEGACY_GENESIS_RECORD_VERSION,
  createGenesisRecord,
  createSoulFromGenesis,
  persistGenesisSoul,
  validateGenesisRecord,
} from './genesis.js'

export {
  recordFirstEncounter,
  recordNamingEvent,
} from './lifecycle-events.js'

export {
  EXODUS_SOURCE_VERSION,
  createExodusSource,
  validateExodusSource,
} from './exodus-source.js'

export {
  MARKDOWN_EVIDENCE_VERSION,
  normalizeMarkdownEvidence,
} from './markdown-evidence.js'

export {
  EXODUS_CANDIDATE_CLAIM_VERSION,
  RUNTIME_PHENOTYPE_RISKS,
  createExodusCandidateClaim,
  validateExodusCandidateClaim,
} from './exodus-candidate-claim.js'

export {
  EXODUS_CLAIM_RELATIONSHIPS,
  EXODUS_RECONCILIATION_DISPOSITIONS,
  EXODUS_REVIEW_STATES,
  EXODUS_REVIEW_WORKSPACE_VERSION,
  addExodusClaimRelationship,
  appendExodusReconciliationReview,
  appendExodusReviewDecision,
  createExodusReviewWorkspace,
  getExodusClaimReviewState,
  validateExodusReviewWorkspace,
} from './exodus-review-workspace.js'

export { createExodusPromotionProposal } from './exodus-promotion.js'

export {
  LIFECYCLE_IMPORT_COMPARISON_STATES,
  LIFECYCLE_IMPORT_RECONCILIATION_VERSION,
  createLifecycleImportReconciliation,
  validateLifecycleImportReconciliation,
} from './lifecycle-import-reconciliation.js'

export {
  CONTINUITY_CHECK_SET_VERSION,
  createContinuityCheckSet,
  createObservationChecks,
} from './continuity-checks.js'

export {
  MODEL_SWITCH_COMPARISON_VERSION,
  MODEL_SWITCH_DIMENSIONS,
  createModelSwitchComparison,
} from './model-switch.js'

export {
  projectSoulContext,
  renderSoulContext,
} from './context-projection.js'

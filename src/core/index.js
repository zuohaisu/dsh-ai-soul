export {
  SOUL_STATE_VERSION,
  appendTransition,
  createSoulState,
  validateSoulState,
} from './soul-state.js'

export {
  importOriginArtifact,
  validateHistoricalArtifact,
} from './artifact-import.js'

export { FileSoulStore } from './soul-store.js'

export {
  EXPERIENCE_RECORD_VERSION,
  createExperienceRecord,
  promoteExperienceToAutobiography,
  validateExperienceRecord,
} from './experience.js'

export {
  SIGNIFICANCE_ASSESSMENT_VERSION,
  SIGNIFICANCE_LEVELS,
  createSignificanceAssessment,
  validateSignificanceAssessment,
} from './significance.js'

export {
  CANDIDATE_CLAIM_MAX_STATEMENT_LENGTH,
  CANDIDATE_CLAIM_TARGETS,
  CANDIDATE_CLAIM_VERSION,
  createCandidateClaim,
  validateCandidateClaim,
} from './candidate-claim.js'

export {
  createCandidatePromotionProposal,
} from './candidate-promotion.js'

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

export {
  createExodusPromotionProposal,
} from './exodus-promotion.js'

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

import { appendTransition, validateSoulState } from './soul-state.js'
import { assertCurrentCognitionAppendCapacity } from './cognitive-capacity.js'

export const STATE_TRANSITION_PROPOSAL_VERSION = 1
export const STATE_TRANSITION_TARGETS = Object.freeze([
  'selfModel',
  'userModel',
  'relationship.state',
  'beliefs',
  'worldModel',
])
export const STATE_TRANSITION_DECISIONS = Object.freeze(['approved', 'rejected'])
export const DEFAULT_STATE_TRANSITION_REVIEW_POLICY = Object.freeze({ minimumConfidence: 0.6 })

function clone(value) { return structuredClone(value) }
function isRecord(value) { return value != null && typeof value === 'object' && !Array.isArray(value) }
function proposalFingerprint(proposal) { return JSON.stringify({ version: proposal.version, id: proposal.id, at: proposal.at, target: proposal.target, operation: proposal.operation, value: proposal.value, previousValue: proposal.previousValue, reason: proposal.reason, evidence: proposal.evidence, provenance: proposal.provenance, confidence: proposal.confidence, proposer: proposal.proposer }) }
function reviewFingerprint(review) { return JSON.stringify({ decision: review.decision, reviewer: review.reviewer, reason: review.reason, provenance: review.provenance, policy: review.policy, conflicts: review.conflicts, conflictResolution: review.conflictResolution, at: review.at, proposalFingerprint: review.proposalFingerprint }) }
function normalizeReviewPolicy(policy = {}) { const minimumConfidence = policy.minimumConfidence ?? DEFAULT_STATE_TRANSITION_REVIEW_POLICY.minimumConfidence; if (!Number.isFinite(minimumConfidence) || minimumConfidence < 0 || minimumConfidence > 1) throw new TypeError('review policy minimumConfidence must be between 0 and 1'); return { minimumConfidence } }
function validateDeclaredConflicts(conflicts) { if (!Array.isArray(conflicts)) return ['review.conflicts must be an array']; const errors=[]; conflicts.forEach((conflict,index)=>{ if(!isRecord(conflict)){errors.push(`review.conflicts[${index}] must be an object`);return} if(!conflict.id||typeof conflict.id!=='string') errors.push(`review.conflicts[${index}].id is required`); if(!conflict.reason||typeof conflict.reason!=='string') errors.push(`review.conflicts[${index}].reason is required`); if(!isRecord(conflict.provenance)) errors.push(`review.conflicts[${index}].provenance is required`) }); return errors }
function validateConflictResolution(resolution, conflicts) { const errors=[]; if(resolution==null)return errors; if(conflicts.length===0)return ['review.conflictResolution requires declared conflicts']; if(!isRecord(resolution))return ['review.conflictResolution must be an object']; if(resolution.disposition!=='coexist')errors.push('review.conflictResolution.disposition must be coexist'); if(!resolution.reason||typeof resolution.reason!=='string')errors.push('review.conflictResolution.reason is required'); if(!isRecord(resolution.provenance))errors.push('review.conflictResolution.provenance is required'); return errors }
function deepEqual(a,b){ return JSON.stringify(a)===JSON.stringify(b) }

export function validateStateTransitionProposal(proposal) {
  const errors=[]
  if(!isRecord(proposal)) return { valid:false, errors:['proposal must be an object'] }
  if(proposal.version!==STATE_TRANSITION_PROPOSAL_VERSION) errors.push(`version must be ${STATE_TRANSITION_PROPOSAL_VERSION}`)
  if(!proposal.id||typeof proposal.id!=='string')errors.push('id is required')
  if(!proposal.at||typeof proposal.at!=='string')errors.push('at is required')
  if(!STATE_TRANSITION_TARGETS.includes(proposal.target))errors.push('target is not mutable through the generic transition pipeline')
  if(!['append','replace','retire'].includes(proposal.operation))errors.push('operation must be append, replace, or retire')
  if(proposal.operation!=='retire'&&!Object.prototype.hasOwnProperty.call(proposal,'value'))errors.push('value is required')
  if(proposal.operation==='retire'&&Object.prototype.hasOwnProperty.call(proposal,'value'))errors.push('value is not valid for retire')
  if(['replace','retire'].includes(proposal.operation)&&!Object.prototype.hasOwnProperty.call(proposal,'previousValue'))errors.push('previousValue is required for replace or retire')
  if(proposal.operation==='append'&&Object.prototype.hasOwnProperty.call(proposal,'previousValue'))errors.push('previousValue is only valid for replace or retire')
  if(!proposal.reason||typeof proposal.reason!=='string')errors.push('reason is required')
  if(!Array.isArray(proposal.evidence)||proposal.evidence.length===0)errors.push('evidence must be a non-empty array')
  if(!isRecord(proposal.provenance))errors.push('provenance is required')
  if(!Number.isFinite(proposal.confidence)||proposal.confidence<0||proposal.confidence>1)errors.push('confidence must be between 0 and 1')
  if(!proposal.proposer||typeof proposal.proposer!=='string')errors.push('proposer is required')
  if(proposal.review!=null){
    if(!isRecord(proposal.review)) errors.push('review must be an object')
    else {
      if(!STATE_TRANSITION_DECISIONS.includes(proposal.review.decision))errors.push('review.decision is invalid')
      if(!proposal.review.reviewer||typeof proposal.review.reviewer!=='string')errors.push('review.reviewer is required')
      if(!proposal.review.reason||typeof proposal.review.reason!=='string')errors.push('review.reason is required')
      if(!proposal.review.at||typeof proposal.review.at!=='string')errors.push('review.at is required')
      if(!isRecord(proposal.review.provenance))errors.push('review.provenance is required')
      if(!proposal.review.proposalFingerprint||typeof proposal.review.proposalFingerprint!=='string')errors.push('review.proposalFingerprint is required')
      if(!proposal.review.reviewFingerprint||typeof proposal.review.reviewFingerprint!=='string')errors.push('review.reviewFingerprint is required')
      if(!isRecord(proposal.review.policy)) errors.push('review.policy is required')
      else if(!Number.isFinite(proposal.review.policy.minimumConfidence)||proposal.review.policy.minimumConfidence<0||proposal.review.policy.minimumConfidence>1)errors.push('review.policy.minimumConfidence must be between 0 and 1')
      const conflicts=Array.isArray(proposal.review.conflicts)?proposal.review.conflicts:[]
      errors.push(...validateDeclaredConflicts(proposal.review.conflicts)); errors.push(...validateConflictResolution(proposal.review.conflictResolution,conflicts))
      if(proposal.review.decision==='approved'&&isRecord(proposal.review.policy)){ if(proposal.confidence<proposal.review.policy.minimumConfidence)errors.push('proposal confidence is below review policy threshold'); if(conflicts.length>0&&proposal.review.conflictResolution==null)errors.push('approved proposal with declared conflicts requires conflict resolution') }
    }
  }
  return { valid:errors.length===0, errors }
}

export function createStateTransitionProposal(input={}) {
  const operation=input.operation??'append'
  if(operation!=='retire'&&!Object.prototype.hasOwnProperty.call(input,'value'))throw new TypeError('value is required')
  const proposal={ version:STATE_TRANSITION_PROPOSAL_VERSION,id:input.id??crypto.randomUUID(),at:input.at??new Date().toISOString(),target:input.target,operation,reason:input.reason,evidence:clone(input.evidence),provenance:clone(input.provenance),confidence:input.confidence,proposer:input.proposer,review:null }
  if(Object.prototype.hasOwnProperty.call(input,'value')) proposal.value=clone(input.value)
  if(Object.prototype.hasOwnProperty.call(input,'previousValue')) proposal.previousValue=clone(input.previousValue)
  const validation=validateStateTransitionProposal(proposal); if(!validation.valid)throw new TypeError(`invalid state transition proposal: ${validation.errors.join('; ')}`); return proposal
}

export function reviewStateTransitionProposal(proposal,{decision,reviewer,reason,provenance,policy,conflicts=[],conflictResolution=null,at=new Date().toISOString()}={}) {
  const validation=validateStateTransitionProposal(proposal); if(!validation.valid)throw new TypeError(`invalid state transition proposal: ${validation.errors.join('; ')}`); if(proposal.review!=null)throw new TypeError('proposal has already been reviewed')
  const reviewed=clone(proposal); reviewed.review={ decision,reviewer,reason,provenance:clone(provenance),policy:normalizeReviewPolicy(policy),conflicts:clone(conflicts),conflictResolution:clone(conflictResolution),at,proposalFingerprint:proposalFingerprint(proposal) }; reviewed.review.reviewFingerprint=reviewFingerprint(reviewed.review)
  const reviewedValidation=validateStateTransitionProposal(reviewed); if(!reviewedValidation.valid)throw new TypeError(`invalid state transition review: ${reviewedValidation.errors.join('; ')}`); return reviewed
}

function mutableTarget(state,target){ switch(target){ case 'selfModel':return state.selfModel; case 'userModel':return state.userModel; case 'beliefs':return state.beliefs; case 'relationship.state':return state.relationship.state; case 'worldModel': state.worldModel ??= []; return state.worldModel; default:throw new TypeError('target is not mutable through the generic transition pipeline') } }

export function applyStateTransitionProposal(state,proposal){
  const stateValidation=validateSoulState(state); if(!stateValidation.valid)throw new TypeError(`invalid Soul state: ${stateValidation.errors.join('; ')}`)
  const proposalValidation=validateStateTransitionProposal(proposal); if(!proposalValidation.valid)throw new TypeError(`invalid state transition proposal: ${proposalValidation.errors.join('; ')}`)
  if(proposal.review==null)throw new TypeError('proposal must be reviewed before application')
  if(proposal.review.proposalFingerprint!==proposalFingerprint(proposal))throw new TypeError('review does not match current proposal contents')
  if(proposal.review.reviewFingerprint!==reviewFingerprint(proposal.review))throw new TypeError('review contents changed after review')
  if(proposal.review.decision!=='approved')throw new TypeError('only approved proposals may be applied')
  const next=clone(state)
  const target=mutableTarget(next,proposal.target)
  if(proposal.operation==='append') {
    assertCurrentCognitionAppendCapacity(proposal.target,target)
    target.push(clone(proposal.value))
  }
  else {
    const matches=[]
    target.forEach((entry,index)=>{ if(deepEqual(entry,proposal.previousValue)) matches.push(index) })
    if(matches.length===0)throw new TypeError(`${proposal.operation} previousValue does not match current state`)
    if(matches.length>1)throw new TypeError(`${proposal.operation} previousValue matches multiple current values`)
    if(proposal.operation==='replace') target[matches[0]]=clone(proposal.value)
    else target.splice(matches[0],1)
  }
  const change={target:proposal.target,operation:proposal.operation,confidence:proposal.confidence,proposer:proposal.proposer}
  if(['replace','retire'].includes(proposal.operation)) change.previousValue=clone(proposal.previousValue)
  if(proposal.operation!=='retire') change.value=clone(proposal.value)
  return appendTransition(next,{ kind:'governed-state-transition',reason:proposal.reason,provenance:{proposalId:proposal.id,proposal:clone(proposal.provenance),evidence:clone(proposal.evidence),review:{decision:proposal.review.decision,reviewer:proposal.review.reviewer,at:proposal.review.at,reason:proposal.review.reason,provenance:clone(proposal.review.provenance),policy:clone(proposal.review.policy),conflicts:clone(proposal.review.conflicts),conflictResolution:clone(proposal.review.conflictResolution),proposalFingerprint:proposal.review.proposalFingerprint,reviewFingerprint:proposal.review.reviewFingerprint}},change })
}

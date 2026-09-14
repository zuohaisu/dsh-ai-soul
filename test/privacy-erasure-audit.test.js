import assert from 'node:assert/strict'
import { appendFile, mkdtemp, mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createPrivacyErasureAuditRecord, FilePrivacyErasureAuditStore } from '../src/core/privacy-erasure-audit.js'
import { createPrivacyErasureRequest, decidePrivacyErasure, executePrivacyErasure } from '../src/core/privacy-erasure-governance.js'

function request(provenance = { source: 'test', experienceId: 'experience-1' }) {
  return createPrivacyErasureRequest({
    id: 'erase-request-1',
    target: { type: 'cognitive-memory', soulId: 'soul-a', memoryId: 'memory-1' },
    requester: 'user:a',
    reason: 'privacy request',
    provenance,
  })
}

test('approved erasure leaves a durable content-free audit record across store reload', async () => {
  const req = request()
  const decision = decidePrivacyErasure({ request: req, decision: 'approved', decidedBy: 'user:a', reason: 'confirmed' })
  const execution = await executePrivacyErasure({
    request: req,
    decision,
    store: { erase: async () => ({ erased: true, soulId: 'soul-a', memoryId: 'memory-1', experienceId: 'experience-1' }) },
  })
  const record = createPrivacyErasureAuditRecord({ request: req, decision, execution, recordedAt: '2026-09-14T00:00:00.000Z' })
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'privacy-erasure-audit-'))

  await new FilePrivacyErasureAuditStore({ rootDir }).append(record)
  const [reloaded] = await new FilePrivacyErasureAuditStore({ rootDir }).list('soul-a')

  assert.equal(reloaded.requestId, 'erase-request-1')
  assert.deepEqual(reloaded.target, { type: 'cognitive-memory', soulId: 'soul-a', memoryId: 'memory-1' })
  assert.deepEqual(reloaded.requestProvenance, { source: 'test', experienceId: 'experience-1' })
  assert.equal(reloaded.decision, 'approved')
  assert.equal(reloaded.executed, true)
  assert.equal(reloaded.erasureOutcome, 'erased')
  assert.equal(reloaded.cascade, false)
  assert.equal(reloaded.canonicalSoulMutation, false)
  assert.equal(JSON.stringify(reloaded).includes('remembered secret'), false)
  assert.equal(Object.hasOwn(reloaded, 'content'), false)
})

test('audit construction rejects decision and execution target mismatch', () => {
  const req = request()
  const decision = decidePrivacyErasure({ request: req, decision: 'approved', decidedBy: 'user:a', reason: 'confirmed' })

  assert.throws(
    () => createPrivacyErasureAuditRecord({ request: req, decision: { ...decision, target: { ...decision.target, memoryId: 'memory-2' } } }),
    /target does not match/,
  )
  assert.throws(
    () => createPrivacyErasureAuditRecord({
      request: req,
      decision,
      execution: { executed: true, requestId: req.id, target: { ...req.target, soulId: 'soul-b' }, cascade: false, canonicalSoulMutation: false },
    }),
    /target does not match/,
  )
})

test('audit record never copies Cognitive Memory content from erasure receipt or free-form provenance', async () => {
  const req = request({ source: 'test', experienceId: 'experience-1', note: 'remembered secret', nested: { content: 'remembered secret' } })
  const decision = decidePrivacyErasure({ request: req, decision: 'approved', decidedBy: 'user:a', reason: 'confirmed' })
  const execution = await executePrivacyErasure({
    request: req,
    decision,
    store: { erase: async () => ({ erased: true, soulId: 'soul-a', memoryId: 'memory-1', content: 'remembered secret' }) },
  })
  const record = createPrivacyErasureAuditRecord({ request: req, decision, execution })

  assert.deepEqual(record.requestProvenance, { source: 'test', experienceId: 'experience-1' })
  assert.equal(JSON.stringify(record).includes('remembered secret'), false)
  assert.equal(Object.hasOwn(record, 'erasure'), false)
})

test('rejected request can be audited without invoking physical erasure', async () => {
  const req = request()
  const decision = decidePrivacyErasure({ request: req, decision: 'rejected', decidedBy: 'user:a', reason: 'cancelled' })
  let eraseCalls = 0
  const execution = await executePrivacyErasure({ request: req, decision, store: { erase: async () => { eraseCalls += 1 } } })
  const record = createPrivacyErasureAuditRecord({ request: req, decision, execution })

  assert.equal(eraseCalls, 0)
  assert.equal(record.decision, 'rejected')
  assert.equal(record.executed, false)
  assert.equal(record.erasureOutcome, 'not-erased')
})

test('reload fails closed on a structurally malformed persisted audit record', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'privacy-erasure-audit-malformed-'))
  const dir = path.join(rootDir, encodeURIComponent('soul-a'))
  await mkdir(dir, { recursive: true })
  await appendFile(path.join(dir, 'privacy-erasure-audit.jsonl'), `${JSON.stringify({ version: 1, kind: 'privacy-erasure-audit', target: { type: 'cognitive-memory', soulId: 'soul-a', memoryId: 'memory-1' } })}\n`, 'utf8')

  await assert.rejects(() => new FilePrivacyErasureAuditStore({ rootDir }).list('soul-a'), /record.requestId is required/)
})

test('reload fails closed when a valid-looking record belongs to another Soul', async () => {
  const req = request()
  const decision = decidePrivacyErasure({ request: req, decision: 'approved', decidedBy: 'user:a', reason: 'confirmed' })
  const record = createPrivacyErasureAuditRecord({ request: req, decision, recordedAt: '2026-09-14T00:00:00.000Z' })
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'privacy-erasure-audit-cross-soul-'))
  const dir = path.join(rootDir, encodeURIComponent('soul-a'))
  await mkdir(dir, { recursive: true })
  await appendFile(
    path.join(dir, 'privacy-erasure-audit.jsonl'),
    `${JSON.stringify({ ...record, target: { ...record.target, soulId: 'soul-b' } })}\n`,
    'utf8',
  )

  await assert.rejects(
    () => new FilePrivacyErasureAuditStore({ rootDir }).list('soul-a'),
    /does not match requested Soul/,
  )
})

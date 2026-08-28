import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

import { evaluateRuntimeVerificationEvidence } from '../src/runtime-verification-evidence.js'

function completeRecord() {
  return {
    recordedAt: '2026-08-28T15:30:00.000Z',
    dshVersion: '0.1.1-rc.2',
    runtime: 'node 22 / linux',
    soulId: 'nova',
    profile: 'my-tui-profile',
    surface: 'tui',
    observations: {
      packagePreflight: true,
      effectiveConfigSoul: true,
      effectiveConfigSurface: true,
      pluginActivation: true,
      surfaceUsable: true,
      freshSessionContextVisible: true,
    },
    persistedFacts: ['Chosen name is Nova', 'Relationship began from a Genesis first meeting'],
    deviations: [],
  }
}

function activationBeforeInteractionRecord() {
  return {
    ...completeRecord(),
    soulId: 'ember-001',
    profile: 'clean-web-profile',
    surface: 'web',
    scenario: 'activation-before-interaction',
    observations: {
      ...completeRecord().observations,
      genesisPersistedBeforeInteraction: true,
      pluginActivationBeforeInteraction: true,
      shutdownBeforeInteraction: true,
      restartLoadedSameSoul: true,
      genesisProvenancePreserved: true,
      unnamedStatePreserved: true,
      emptyParticipantsPreserved: true,
      noPriorEncounterFabricated: true,
    },
    persistedFacts: [
      'Genesis activation timestamp remained 2026-08-28T16:00:00.000Z',
      'Genesis provenance remained source: local-activation',
    ],
  }
}

test('complete non-Samuel runtime evidence verifies without coupling profile to Soul ID', () => {
  const result = evaluateRuntimeVerificationEvidence(completeRecord())
  assert.equal(result.verified, true)
  assert.equal(result.complete, true)
  assert.equal(result.identity.soulId, 'nova')
  assert.equal(result.identity.profile, 'my-tui-profile')
  assert.equal(result.identity.surface, 'tui')
  assert.equal(result.identity.scenario, 'general')
  assert.deepEqual(result.failures, [])
  assert.deepEqual(result.missing, [])
})

test('activation-before-interaction evidence verifies an unnamed Soul independently of profile and surface', () => {
  const result = evaluateRuntimeVerificationEvidence(activationBeforeInteractionRecord())
  assert.equal(result.verified, true)
  assert.equal(result.identity.soulId, 'ember-001')
  assert.equal(result.identity.profile, 'clean-web-profile')
  assert.equal(result.identity.surface, 'web')
  assert.equal(result.identity.scenario, 'activation-before-interaction')
  assert.equal(result.checks.unnamedStatePreserved, 'pass')
  assert.equal(result.checks.emptyParticipantsPreserved, 'pass')
  assert.equal(result.checks.noPriorEncounterFabricated, 'pass')
})

test('activation-before-interaction never defaults missing lifecycle observations to pass', () => {
  const record = activationBeforeInteractionRecord()
  delete record.observations.restartLoadedSameSoul
  const result = evaluateRuntimeVerificationEvidence(record)
  assert.equal(result.complete, false)
  assert.equal(result.verified, false)
  assert.equal(result.checks.restartLoadedSameSoul, 'missing')
  assert.deepEqual(result.missing, ['restartLoadedSameSoul'])
})

test('activation-before-interaction fails if runtime fabricates a prior encounter', () => {
  const record = activationBeforeInteractionRecord()
  record.observations.noPriorEncounterFabricated = false
  const result = evaluateRuntimeVerificationEvidence(record)
  assert.equal(result.complete, true)
  assert.equal(result.verified, false)
  assert.deepEqual(result.failures, ['noPriorEncounterFabricated'])
})

test('a failed real-runtime gate never verifies', () => {
  const record = completeRecord()
  record.observations.surfaceUsable = false
  const result = evaluateRuntimeVerificationEvidence(record)
  assert.equal(result.complete, true)
  assert.equal(result.verified, false)
  assert.deepEqual(result.failures, ['surfaceUsable'])
})

test('missing observations never default to pass', () => {
  const record = completeRecord()
  delete record.observations.pluginActivation
  const result = evaluateRuntimeVerificationEvidence(record)
  assert.equal(result.complete, false)
  assert.equal(result.verified, false)
  assert.deepEqual(result.missing, ['pluginActivation'])
  assert.equal(result.checks.pluginActivation, 'missing')
})

test('fresh-session context visibility requires persisted facts to compare against', () => {
  const record = completeRecord()
  record.persistedFacts = ['Only one fact']
  const result = evaluateRuntimeVerificationEvidence(record)
  assert.equal(result.verified, false)
  assert.deepEqual(result.missing, ['persistedFacts>=2'])
})

test('runtime evidence CLI validates an actual record file and exposes help', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-runtime-evidence-'))
  const recordPath = join(dir, 'runtime-evidence.json')
  await writeFile(recordPath, JSON.stringify(activationBeforeInteractionRecord()))

  const success = spawnSync(process.execPath, ['src/cli/verify-runtime-evidence.js', '--record', recordPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
  assert.equal(success.status, 0, success.stderr)
  const output = JSON.parse(success.stdout)
  assert.equal(output.verified, true)
  assert.equal(output.identity.scenario, 'activation-before-interaction')

  const help = spawnSync(process.execPath, ['src/cli/verify-runtime-evidence.js', '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
  assert.equal(help.status, 0)
  assert.match(help.stdout, /does not run DSH or manufacture runtime evidence/)
})

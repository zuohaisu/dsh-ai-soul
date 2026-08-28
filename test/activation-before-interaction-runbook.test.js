import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const runbook = await readFile(new URL('../docs/activation-before-interaction-runbook.md', import.meta.url), 'utf8')

test('runtime runbook preserves activation-before-interaction evidence boundary', () => {
  assert.match(runbook, /unnamed Soul/i)
  assert.match(runbook, /without sending any conversational turn/i)
  assert.match(runbook, /Start a new DSH process/i)
  assert.match(runbook, /same profile, same `soulId`, and same Soul Store/i)
  assert.match(runbook, /Genesis timestamp matches/i)
  assert.match(runbook, /Genesis provenance matches/i)
  assert.match(runbook, /CI, mocks, repository fixtures, configure output, preflight, and the evidence validator itself cannot manufacture runtime success/i)
})

test('runtime runbook keeps Soul identity independent of profile and surface', () => {
  assert.match(runbook, /Soul ID ≠ DSH profile ≠ application surface/)
  assert.match(runbook, /Soul ID: `ember-001`/)
  assert.match(runbook, /DSH profile name: `clean-web-profile`/)
  assert.match(runbook, /application surface: `web`/)
  assert.doesNotMatch(runbook, /Soul ID: `samuel`/i)
  assert.doesNotMatch(runbook, /--soul-id samuel/i)
})

test('runtime runbook uses canonical DSH-owned install before configure and preflight', () => {
  const install = 'dsh plugin --profile clean-web-profile add /absolute/path/to/dsh-ai-soul'
  const configure = 'dsh-ai-soul-configure \\\n  --profile-dir'
  const preflight = 'dsh-ai-soul-preflight \\\n  --profile-dir'

  const installAt = runbook.indexOf(install)
  const configureAt = runbook.indexOf(configure, installAt)
  const preflightAt = runbook.indexOf(preflight, configureAt)

  assert.ok(installAt >= 0)
  assert.ok(configureAt > installAt)
  assert.ok(preflightAt > configureAt)
  assert.match(runbook, /DSH owns package installation/)
  assert.match(runbook, /configure preserves the existing dependency source and does not need `--dependency-spec`/)
  assert.match(runbook, /advanced manual\/source-controlled editing path/)
})

test('runtime runbook distinguishes static and real runtime gates', () => {
  assert.match(runbook, /static\/profile evidence, not real-runtime proof/i)
  assert.match(runbook, /plugin activation/i)
  assert.match(runbook, /restart persistence/i)
  assert.match(runbook, /application surface usability/i)
  assert.match(runbook, /fresh-session context visibility/i)
})

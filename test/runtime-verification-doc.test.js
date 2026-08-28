import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const guide = await readFile(new URL('../docs/runtime-verification.md', import.meta.url), 'utf8')
const quickstart = await readFile(new URL('../docs/quickstart.md', import.meta.url), 'utf8')
const applicationProfile = await readFile(new URL('../docs/application-profile-install.md', import.meta.url), 'utf8')

test('runtime verification keeps Soul identity orthogonal to profile and application surface', () => {
  assert.match(guide, /Soul identity ≠ DSH profile ≠ application surface/)
  assert.match(guide, /TUI/)
  assert.match(guide, /Web/)
  assert.match(guide, /Headless/)
  assert.match(guide, /profile name does not need to match the Soul ID/i)
})

test('runtime verification separates static preflight, activation, surface, and context visibility', () => {
  assert.match(guide, /Package preflight/)
  assert.match(guide, /Soul plugin activation/)
  assert.match(guide, /application surface usable/i)
  assert.match(guide, /Fresh-session context visibility/)
  assert.match(guide, /does not prove the model can see the projected context/i)
})

test('fresh-session checks derive expected answers from the selected Soul rather than Samuel defaults', () => {
  assert.match(guide, /expected answers come from that Soul, not from Samuel/i)
  assert.match(guide, /Do not paste a persona, biography, exported memory, or expected answers/i)
  assert.match(guide, /Soul ID: `nova`/)
  assert.doesNotMatch(guide, /Birthday: 2025-10-21/)
  assert.doesNotMatch(guide, /Haisu came to Samuel in his prompts/)
})

test('quickstart links preflight to real runtime verification without claiming completion', () => {
  assert.match(quickstart, /runtime-verification\.md/)
  assert.match(quickstart, /real DSH runtime verification/i)
  assert.match(quickstart, /does not claim interactive runtime verification unless that real run has actually occurred/i)
})

test('TUI runtime docs use the DSH launcher contract rather than assuming a standalone binary', () => {
  assert.match(applicationProfile, /TUI \| `@deepseek-harness-tui\/dsh-tui` \| `dsh --profile dsh-tui`/)
  assert.match(applicationProfile, /currently recognized TUI bundle is an out-of-tree application bundle/i)
  assert.match(applicationProfile, /Current DSH exposes `dsh` as the supported Node application launcher/i)
  assert.match(applicationProfile, /^dsh --profile dsh-tui$/m)
  assert.doesNotMatch(applicationProfile, /^dsh-tui$/m)
})

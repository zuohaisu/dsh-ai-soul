import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const quickstart = await readFile(new URL('../docs/quickstart.md', import.meta.url), 'utf8')
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8')

test('ordinary-user quickstart keeps Soul identity orthogonal to DSH profile and surface', () => {
  assert.match(quickstart, /A profile name never needs to match a Soul ID\./)
  assert.match(quickstart, /Soul identity ≠ profile name ≠ application surface/)
  assert.match(quickstart, /--surface tui/)
  assert.match(quickstart, /--surface web/)
  assert.match(quickstart, /--surface headless/)
})

test('quickstart exposes the supported Genesis configure preflight path without Samuel defaults', () => {
  assert.match(quickstart, /dsh-ai-soul-genesis/)
  assert.match(quickstart, /dsh-ai-soul-configure/)
  assert.match(quickstart, /dsh-ai-soul-preflight/)
  assert.match(quickstart, /--soul-id nova/)
  assert.match(quickstart, /--profile-dir \/absolute\/path\/to\/dsh-tui-profile/)
  assert.doesNotMatch(quickstart, /--soul-id samuel/)
})

test('quickstart presents later import as evidence governance rather than identity replacement', () => {
  assert.match(quickstart, /dsh-ai-soul-import-prepare/)
  assert.match(quickstart, /--target-soul-id nova/)
  assert.match(quickstart, /--soul-store \/absolute\/path\/to\/soul-store/)
  assert.match(quickstart, /does \*\*not\*\* replace the current Soul/)
  assert.match(quickstart, /StateTransitionProposal/)
})

test('README leads with the general Soul layer while preserving Samuel as a research case', () => {
  assert.match(readme, /persistent Soul layer for DeepSeek Harness/)
  assert.match(readme, /Samuel is not the default Soul/)
  assert.match(readme, /ordinary-user quickstart/)
  assert.match(readme, /Soul identity ≠ model ≠ DSH profile ≠ UI surface/)
})

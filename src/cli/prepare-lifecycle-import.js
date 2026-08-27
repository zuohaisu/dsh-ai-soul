#!/usr/bin/env node

import { prepareMarkdownLifecycleImportWorkspace } from '../lifecycle-import-prepare.js'

const args = process.argv.slice(2)
const values = {}
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--replace') {
    values.replace = true
    continue
  }
  if (!arg.startsWith('--')) throw new Error(`unexpected argument: ${arg}`)
  const key = arg.slice(2)
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${arg}`)
  values[key] = value
  index += 1
}

for (const key of ['source-file', 'source-id', 'source-type', 'provider', 'captured-at', 'output-dir', 'soul-store', 'target-soul-id']) {
  if (!values[key]) throw new Error(`missing required --${key}`)
}

const result = await prepareMarkdownLifecycleImportWorkspace({
  sourceFile: values['source-file'],
  sourceId: values['source-id'],
  sourceType: values['source-type'],
  provider: values.provider,
  capturedAt: values['captured-at'],
  outputDir: values['output-dir'],
  soulStoreDir: values['soul-store'],
  targetSoulId: values['target-soul-id'],
  replace: Boolean(values.replace),
})

process.stdout.write(`${JSON.stringify({
  workspace: result.outputDir,
  evidenceWorkspace: result.evidenceDir,
  targetSoulId: result.target.targetSoulId,
  baselineDigest: result.target.baseline.digest,
  targetBinding: result.targetFile,
  baselineSnapshot: result.baselineFile,
  canonicalMutation: result.canonicalMutation,
  profileMutation: result.profileMutation,
}, null, 2)}\n`)

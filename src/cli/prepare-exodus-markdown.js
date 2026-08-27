#!/usr/bin/env node

import { prepareMarkdownExodusWorkspace } from '../exodus-prepare.js'

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

for (const key of ['source-file', 'source-id', 'source-type', 'provider', 'captured-at', 'output-dir']) {
  if (!values[key]) throw new Error(`missing required --${key}`)
}

const result = await prepareMarkdownExodusWorkspace({
  sourceFile: values['source-file'],
  sourceId: values['source-id'],
  sourceType: values['source-type'],
  provider: values.provider,
  capturedAt: values['captured-at'],
  outputDir: values['output-dir'],
  replace: Boolean(values.replace),
})

process.stdout.write(`${JSON.stringify({
  workspace: result.outputDir,
  originalFile: result.originalFile,
  sourceManifest: result.sourceFile,
  normalizedEvidence: result.evidenceFile,
  sourceId: result.source.sourceId,
  digest: result.source.content.digest,
  evidenceUnits: result.evidence.units.length,
  canonicalMutation: result.canonicalMutation,
  profileMutation: result.profileMutation,
}, null, 2)}\n`)

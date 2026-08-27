#!/usr/bin/env node

import { prepareExodusReviewWorkspace } from '../exodus-review-prepare.js'

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

for (const key of ['prepared-workspace', 'claims-file', 'workspace-id', 'created-by', 'created-at', 'output-dir']) {
  if (!values[key]) throw new Error(`missing required --${key}`)
}

const result = await prepareExodusReviewWorkspace({
  preparedWorkspace: values['prepared-workspace'],
  claimsFile: values['claims-file'],
  workspaceId: values['workspace-id'],
  createdBy: values['created-by'],
  createdAt: values['created-at'],
  outputDir: values['output-dir'],
  replace: Boolean(values.replace),
})

process.stdout.write(`${JSON.stringify({
  workspace: result.outputDir,
  candidateClaims: result.claimsFile,
  reviewWorkspace: result.reviewWorkspaceFile,
  sourceId: result.sourceId,
  digest: result.digest,
  claims: result.claims.length,
  canonicalMutation: result.canonicalMutation,
  profileMutation: result.profileMutation,
}, null, 2)}\n`)

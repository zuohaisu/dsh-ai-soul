#!/usr/bin/env node

import { prepareExodusReviewWorkspace } from '../exodus-review-prepare.js'

const HELP = `dsh-ai-soul-exodus-review

Create a review-ready workspace from prepared Exodus evidence and explicit candidate claims.

Usage:
  dsh-ai-soul-exodus-review \
    --prepared-workspace <path> \
    --claims-file <path> \
    --workspace-id <id> \
    --created-by <actor> \
    --created-at <iso-timestamp> \
    --output-dir <path> \
    [--replace]

Required:
  --prepared-workspace <path>  Prepared Exodus evidence workspace
  --claims-file <path>         Explicit candidate-claim JSON document
  --workspace-id <id>          Stable review workspace identifier
  --created-by <actor>         Review workspace creator
  --created-at <timestamp>     Review workspace creation timestamp
  --output-dir <path>          Review workspace destination

Optional:
  --replace                    Replace an existing managed review workspace
  --help                       Show this help

Candidate claims remain evidence-bound interpretations. Creating a review
workspace does not accept claims, mutate canonical Soul State, infer Soul
identity, or modify a DSH profile.
`

const ALLOWED = new Set([
  'prepared-workspace',
  'claims-file',
  'workspace-id',
  'created-by',
  'created-at',
  'output-dir',
  'replace',
])

class UsageError extends TypeError {}

function parseArgs(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) throw new UsageError(`unexpected argument: ${arg}`)
    const key = arg.slice(2)
    if (!ALLOWED.has(key)) throw new UsageError(`unknown argument: --${key}`)
    if (key === 'replace') {
      values.replace = true
      continue
    }
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new UsageError(`missing value for --${key}`)
    values[key] = value
    index += 1
  }
  return values
}

function required(values, key) {
  if (!values[key]) throw new UsageError(`--${key} is required`)
  return values[key]
}

function writeFailure(error) {
  const usage = error instanceof UsageError
  process.stderr.write(`${JSON.stringify({
    ready: false,
    kind: usage ? 'usage' : 'exodus-review',
    error: error.message,
    ...(usage ? { hint: 'Run dsh-ai-soul-exodus-review --help for usage.' } : {}),
  }, null, 2)}\n`)
  process.exitCode = 1
}

if (process.argv.slice(2).includes('--help')) {
  process.stdout.write(HELP)
} else {
  try {
    const values = parseArgs(process.argv.slice(2))
    const result = await prepareExodusReviewWorkspace({
      preparedWorkspace: required(values, 'prepared-workspace'),
      claimsFile: required(values, 'claims-file'),
      workspaceId: required(values, 'workspace-id'),
      createdBy: required(values, 'created-by'),
      createdAt: required(values, 'created-at'),
      outputDir: required(values, 'output-dir'),
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
  } catch (error) {
    writeFailure(error)
  }
}

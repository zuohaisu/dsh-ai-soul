#!/usr/bin/env node

import process from 'node:process'
import { reconcileLifecycleImportClaim } from '../lifecycle-import-reconcile.js'

const HELP = `dsh-ai-soul-import-reconcile

Compare one reviewed import claim with the frozen target Soul baseline.

Usage:
  dsh-ai-soul-import-reconcile \\
    --import-dir <path> \\
    --review-dir <path> \\
    --claim-id <id> \\
    --reconciliation-id <id> \\
    --target-path <json> \\
    --proposed-value <json> \\
    --rationale <text> \\
    --recorded-by <actor> \\
    --recorded-at <iso-timestamp>

Required:
  --import-dir <path>             Lifecycle import workspace
  --review-dir <path>             Review workspace containing claims
  --claim-id <id>                 Candidate claim to compare
  --reconciliation-id <id>        Stable reconciliation record ID
  --target-path <json>            Explicit JSON array path in frozen Soul State
  --proposed-value <json>         Explicit JSON value from the imported claim
  --rationale <text>              Why this comparison is being recorded
  --recorded-by <actor>           Human/agent recording the comparison
  --recorded-at <timestamp>       Reconciliation timestamp
  --help                          Show this help

This command records structural evidence only. A different value is not
implicitly a conflict, and reconciliation has no canonical mutation authority.
`

const ALLOWED = new Set([
  'import-dir',
  'review-dir',
  'claim-id',
  'reconciliation-id',
  'target-path',
  'proposed-value',
  'rationale',
  'recorded-by',
  'recorded-at',
])

class UsageError extends TypeError {}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) throw new UsageError(`unexpected argument: ${token}`)
    const key = token.slice(2)
    if (!ALLOWED.has(key)) throw new UsageError(`unknown argument: --${key}`)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new UsageError(`missing value for --${key}`)
    args[key] = value
    index += 1
  }
  return args
}

function required(args, key) {
  if (!args[key]) throw new UsageError(`--${key} is required`)
  return args[key]
}

function parseJsonArg(args, key) {
  const raw = required(args, key)
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new UsageError(`--${key} must be valid JSON: ${error.message}`)
  }
}

function writeFailure(error) {
  const usage = error instanceof UsageError
  process.stderr.write(`${JSON.stringify({
    ready: false,
    kind: usage ? 'usage' : 'reconciliation',
    error: error.message,
    ...(usage ? { hint: 'Run dsh-ai-soul-import-reconcile --help for usage.' } : {}),
  }, null, 2)}\n`)
  process.exitCode = 1
}

if (process.argv.slice(2).includes('--help')) {
  process.stdout.write(HELP)
} else {
  try {
    const args = parseArgs(process.argv.slice(2))
    const result = await reconcileLifecycleImportClaim({
      importDir: required(args, 'import-dir'),
      reviewDir: required(args, 'review-dir'),
      claimId: required(args, 'claim-id'),
      reconciliationId: required(args, 'reconciliation-id'),
      targetPath: parseJsonArg(args, 'target-path'),
      proposedValue: parseJsonArg(args, 'proposed-value'),
      rationale: required(args, 'rationale'),
      recordedBy: required(args, 'recorded-by'),
      recordedAt: required(args, 'recorded-at'),
    })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } catch (error) {
    writeFailure(error)
  }
}

#!/usr/bin/env node

import process from 'node:process'
import { updateExodusReviewWorkspace } from '../exodus-review-update.js'

const HELP = `dsh-ai-soul-exodus-review-update

Record an explicit review operation in an existing Exodus review workspace.

Usage:
  dsh-ai-soul-exodus-review-update --review-dir <path> --operation <type> [operation options]

Required:
  --review-dir <path>       Existing Exodus review workspace
  --operation <type>        One of: relationship, decision, reconciliation-review

relationship options:
  --left-claim-id <id>
  --right-claim-id <id>
  --relationship <type>
  --recorded-by <actor>
  --recorded-at <timestamp>
  --rationale <text>

decision options:
  --claim-id <id>
  --state <state>
  --reviewer <actor>
  --reviewed-at <timestamp>
  --rationale <text>

reconciliation-review options:
  --reconciliation-file <path>
  --disposition <state>
  --reviewer <actor>
  --reviewed-at <timestamp>
  --rationale <text>

Optional:
  --help                    Show this help

This command records review evidence only. A review decision does not itself
mutate canonical Soul State, infer Soul identity, or modify a DSH profile.
`

const ALLOWED = new Set([
  'review-dir',
  'operation',
  'left-claim-id',
  'right-claim-id',
  'relationship',
  'recorded-by',
  'recorded-at',
  'rationale',
  'claim-id',
  'state',
  'reviewer',
  'reviewed-at',
  'reconciliation-file',
  'disposition',
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

function buildOperation(args) {
  const type = required(args, 'operation')
  if (type === 'relationship') {
    return {
      type,
      value: {
        leftClaimId: required(args, 'left-claim-id'),
        rightClaimId: required(args, 'right-claim-id'),
        relationship: required(args, 'relationship'),
        recordedBy: required(args, 'recorded-by'),
        recordedAt: required(args, 'recorded-at'),
        rationale: required(args, 'rationale'),
      },
    }
  }
  if (type === 'decision') {
    return {
      type,
      value: {
        claimId: required(args, 'claim-id'),
        state: required(args, 'state'),
        reviewer: required(args, 'reviewer'),
        reviewedAt: required(args, 'reviewed-at'),
        rationale: required(args, 'rationale'),
      },
    }
  }
  if (type === 'reconciliation-review') {
    return {
      type,
      reconciliationFile: required(args, 'reconciliation-file'),
      value: {
        disposition: required(args, 'disposition'),
        reviewer: required(args, 'reviewer'),
        reviewedAt: required(args, 'reviewed-at'),
        rationale: required(args, 'rationale'),
      },
    }
  }
  throw new UsageError('--operation must be relationship, decision, or reconciliation-review')
}

function writeFailure(error) {
  const usage = error instanceof UsageError
  process.stderr.write(`${JSON.stringify({
    ready: false,
    kind: usage ? 'usage' : 'exodus-review-update',
    error: error.message,
    ...(usage ? { hint: 'Run dsh-ai-soul-exodus-review-update --help for usage.' } : {}),
  }, null, 2)}\n`)
  process.exitCode = 1
}

if (process.argv.slice(2).includes('--help')) {
  process.stdout.write(HELP)
} else {
  try {
    const args = parseArgs(process.argv.slice(2))
    const result = await updateExodusReviewWorkspace({
      reviewDir: required(args, 'review-dir'),
      operation: buildOperation(args),
    })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } catch (error) {
    writeFailure(error)
  }
}

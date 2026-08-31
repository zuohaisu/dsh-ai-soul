#!/usr/bin/env node

import process from 'node:process'
import { createLifecycleImportPromotionProposal } from '../lifecycle-import-promote.js'

const HELP = `dsh-ai-soul-import-promote

Create a governed StateTransitionProposal from an accepted lifecycle-import claim.

Usage:
  dsh-ai-soul-import-promote \\
    --import-dir <path> \\
    --review-dir <path> \\
    --claim-id <id> \\
    --target <domain> \\
    --path <path> \\
    --value <json> \\
    --proposer <actor> \\
    --proposal-id <id> \\
    --at <iso-timestamp>

Required:
  --import-dir <path>       Lifecycle import workspace
  --review-dir <path>       Review workspace containing accepted claim
  --claim-id <id>           Candidate claim to promote
  --target <domain>         Explicit mutable Soul domain
  --path <path>             Explicit target path; never inferred from claim type
  --value <json>            Explicit proposed JSON value
  --proposer <actor>        Proposal author
  --proposal-id <id>        Stable proposal identifier
  --at <timestamp>          Proposal creation timestamp
  --help                    Show this help

This command creates an unreviewed proposal only. Accepted import evidence does
not equal approval, and proposal creation does not mutate canonical Soul State.
`

const ALLOWED = new Set([
  'import-dir',
  'review-dir',
  'claim-id',
  'target',
  'path',
  'value',
  'proposer',
  'proposal-id',
  'at',
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
    kind: usage ? 'usage' : 'promotion',
    error: error.message,
    ...(usage ? { hint: 'Run dsh-ai-soul-import-promote --help for usage.' } : {}),
  }, null, 2)}\n`)
  process.exitCode = 1
}

if (process.argv.slice(2).includes('--help')) {
  process.stdout.write(HELP)
} else {
  try {
    const args = parseArgs(process.argv.slice(2))
    const result = await createLifecycleImportPromotionProposal({
      importDir: required(args, 'import-dir'),
      reviewDir: required(args, 'review-dir'),
      claimId: required(args, 'claim-id'),
      target: required(args, 'target'),
      path: required(args, 'path'),
      value: parseJsonArg(args, 'value'),
      proposer: required(args, 'proposer'),
      proposalId: required(args, 'proposal-id'),
      at: required(args, 'at'),
    })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } catch (error) {
    writeFailure(error)
  }
}

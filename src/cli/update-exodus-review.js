#!/usr/bin/env node

import process from 'node:process'
import { updateExodusReviewWorkspace } from '../exodus-review-update.js'

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) throw new TypeError(`unexpected argument: ${token}`)
    const key = token.slice(2)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new TypeError(`missing value for --${key}`)
    args[key] = value
    index += 1
  }
  return args
}

function required(args, key) {
  if (!args[key]) throw new TypeError(`--${key} is required`)
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
  throw new TypeError('--operation must be relationship, decision, or reconciliation-review')
}

try {
  const args = parseArgs(process.argv.slice(2))
  const result = await updateExodusReviewWorkspace({
    reviewDir: required(args, 'review-dir'),
    operation: buildOperation(args),
  })
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
}

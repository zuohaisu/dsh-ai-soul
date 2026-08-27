#!/usr/bin/env node

import process from 'node:process'
import { reconcileLifecycleImportClaim } from '../lifecycle-import-reconcile.js'

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

function parseJsonArg(args, key) {
  const raw = required(args, key)
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new TypeError(`--${key} must be valid JSON: ${error.message}`)
  }
}

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
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
}

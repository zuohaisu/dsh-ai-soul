#!/usr/bin/env node

import process from 'node:process'

import { bootstrapGenesisSoul } from '../genesis-bootstrap.js'

const HELP = `Usage: dsh-ai-soul-genesis --record <path> --store-dir <path>

Create and persist a new Soul from explicit Genesis activation evidence.
Genesis v2 begins existence without requiring a name, first meeting, relationship participant, persona, or DSH application surface.
Legacy Genesis Record v1 remains accepted for compatibility with previously created first-meeting records.

Required:
  --record <path>            Genesis Record JSON
  --store-dir <path>         Writable Soul Store directory

Options:
  --help                     Show this help
`

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--help') return { help: true }
    if (!token.startsWith('--')) throw new TypeError(`unexpected argument: ${token}`)
    const key = token.slice(2)
    if (!['record', 'store-dir'].includes(key)) throw new TypeError(`unknown argument: --${key}`)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new TypeError(`missing value for --${key}`)
    args[key] = value
    index += 1
  }
  return { args }
}

function required(args, key) {
  if (!args[key]) throw new TypeError(`--${key} is required`)
  return args[key]
}

try {
  const parsed = parseArgs(process.argv.slice(2))
  if (parsed.help) {
    process.stdout.write(HELP)
  } else {
    const result = await bootstrapGenesisSoul({
      recordFile: required(parsed.args, 'record'),
      storeDir: required(parsed.args, 'store-dir'),
    })

    process.stdout.write(`[dsh-ai-soul] Genesis persisted Soul ${result.soulId}\n`)
    if (result.name) process.stdout.write(`[dsh-ai-soul] Name: ${result.name}\n`)
    process.stdout.write(`[dsh-ai-soul] Origin record: ${result.genesisRecordId}\n`)
    process.stdout.write(`[dsh-ai-soul] Store file: ${result.storePath}\n`)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  const usageFailure = error instanceof TypeError
  process.stderr.write(`${JSON.stringify({
    ready: false,
    kind: usageFailure ? 'usage' : 'genesis',
    error: message,
    hint: usageFailure ? 'Run dsh-ai-soul-genesis --help for usage.' : undefined,
  }, null, 2)}\n`)
  process.exitCode = 1
}

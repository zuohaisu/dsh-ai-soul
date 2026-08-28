#!/usr/bin/env node

import process from 'node:process'

import { bootstrapGenesisSoul } from '../genesis-bootstrap.js'

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

try {
  const args = parseArgs(process.argv.slice(2))
  const result = await bootstrapGenesisSoul({
    recordFile: required(args, 'record'),
    storeDir: required(args, 'store-dir'),
  })

  process.stdout.write(`[dsh-ai-soul] Genesis persisted Soul ${result.soulId}\n`)
  process.stdout.write(`[dsh-ai-soul] Name: ${result.name}\n`)
  process.stdout.write(`[dsh-ai-soul] Origin record: ${result.genesisRecordId}\n`)
  process.stdout.write(`[dsh-ai-soul] Store file: ${result.storePath}\n`)
} catch (error) {
  process.stderr.write(`[dsh-ai-soul] Genesis failed: ${error.message}\n`)
  process.exitCode = 1
}

#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import process from 'node:process'

import { evaluateSelectiveGrowthRuntimeEvidence } from '../selective-growth-runtime-evidence.js'

const HELP = `Usage: dsh-ai-soul-growth-evidence --record <path>\n\nValidate evidence from an actual DSH TUI/Web selective-growth run.\nThis command evaluates supplied observations; it does not run DSH or manufacture runtime evidence.\n\nRequired:\n  --record <path>            Selective-growth runtime evidence JSON\n\nOptions:\n  --help                     Show this help\n`

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--help') return { help: true }
    if (token !== '--record') throw new TypeError(`unknown argument: ${token}`)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new TypeError('missing value for --record')
    args.record = value
    index += 1
  }
  if (!args.record) throw new TypeError('--record is required')
  return { args }
}

try {
  const parsed = parseArgs(process.argv.slice(2))
  if (parsed.help) {
    process.stdout.write(HELP)
  } else {
    const record = JSON.parse(await readFile(parsed.args.record, 'utf8'))
    const result = evaluateSelectiveGrowthRuntimeEvidence(record)
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    if (!result.verified) process.exitCode = 1
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${JSON.stringify({ verified: false, error: message }, null, 2)}\n`)
  process.exitCode = 1
}

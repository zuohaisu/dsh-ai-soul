#!/usr/bin/env node

import { prepareMarkdownExodusWorkspace } from '../exodus-prepare.js'

const HELP = `dsh-ai-soul-exodus-prepare

Prepare provenance-bound Markdown evidence for a generic Exodus migration.

Usage:
  dsh-ai-soul-exodus-prepare \
    --source-file <path> \
    --source-id <id> \
    --source-type <type> \
    --provider <provider> \
    --captured-at <iso-timestamp> \
    --output-dir <path> \
    [--replace]

Required:
  --source-file <path>       External Markdown evidence file
  --source-id <id>           Stable identifier for this source
  --source-type <type>       Source category (for example memory-export)
  --provider <provider>      Originating provider/runtime label
  --captured-at <timestamp>  Evidence capture timestamp
  --output-dir <path>        Prepared Exodus workspace destination

Optional:
  --replace                  Replace an existing managed source workspace
  --help                     Show this help

This command preserves external evidence and provenance only. It does not create
or mutate canonical Soul State, infer Soul identity, or modify a DSH profile.
`

const ALLOWED = new Set([
  'source-file',
  'source-id',
  'source-type',
  'provider',
  'captured-at',
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
    kind: usage ? 'usage' : 'exodus-prepare',
    error: error.message,
    ...(usage ? { hint: 'Run dsh-ai-soul-exodus-prepare --help for usage.' } : {}),
  }, null, 2)}\n`)
  process.exitCode = 1
}

if (process.argv.slice(2).includes('--help')) {
  process.stdout.write(HELP)
} else {
  try {
    const values = parseArgs(process.argv.slice(2))
    const result = await prepareMarkdownExodusWorkspace({
      sourceFile: required(values, 'source-file'),
      sourceId: required(values, 'source-id'),
      sourceType: required(values, 'source-type'),
      provider: required(values, 'provider'),
      capturedAt: required(values, 'captured-at'),
      outputDir: required(values, 'output-dir'),
      replace: Boolean(values.replace),
    })

    process.stdout.write(`${JSON.stringify({
      workspace: result.outputDir,
      originalFile: result.originalFile,
      sourceManifest: result.sourceFile,
      normalizedEvidence: result.evidenceFile,
      sourceId: result.source.sourceId,
      digest: result.source.content.digest,
      evidenceUnits: result.evidence.units.length,
      canonicalMutation: result.canonicalMutation,
      profileMutation: result.profileMutation,
    }, null, 2)}\n`)
  } catch (error) {
    writeFailure(error)
  }
}

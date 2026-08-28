#!/usr/bin/env node

import { prepareMarkdownLifecycleImportWorkspace } from '../lifecycle-import-prepare.js'

const HELP = `dsh-ai-soul-import-prepare

Prepare provenance-bound external evidence for an existing Soul.

Usage:
  dsh-ai-soul-import-prepare \\
    --source-file <path> \\
    --source-id <id> \\
    --source-type <type> \\
    --provider <provider> \\
    --captured-at <iso-timestamp> \\
    --output-dir <path> \\
    --soul-store <path> \\
    --target-soul-id <soul-id> \\
    [--import-id <id>] [--replace]

Required:
  --source-file <path>       External Markdown evidence file
  --source-id <id>           Stable identifier for this source
  --source-type <type>       Source category (for example memory-export)
  --provider <provider>      Originating provider/runtime label
  --captured-at <timestamp>  Evidence capture timestamp
  --output-dir <path>        Import workspace destination
  --soul-store <path>        Existing Soul Store directory
  --target-soul-id <id>      Existing Soul receiving the evidence

Optional:
  --import-id <id>           Explicit import workspace identifier
  --replace                  Replace an existing import workspace
  --help                     Show this help

This command prepares immutable evidence and a frozen target baseline. It does
not mutate canonical Soul State or a DSH profile, and it never infers Soul
identity from the source file, output path, profile, or provider.
`

const ALLOWED = new Set([
  'source-file',
  'source-id',
  'source-type',
  'provider',
  'captured-at',
  'output-dir',
  'soul-store',
  'target-soul-id',
  'import-id',
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
    kind: usage ? 'usage' : 'import',
    error: error.message,
    ...(usage ? { hint: 'Run dsh-ai-soul-import-prepare --help for usage.' } : {}),
  }, null, 2)}\n`)
  process.exitCode = 1
}

if (process.argv.slice(2).includes('--help')) {
  process.stdout.write(HELP)
} else {
  try {
    const values = parseArgs(process.argv.slice(2))
    const result = await prepareMarkdownLifecycleImportWorkspace({
      sourceFile: required(values, 'source-file'),
      sourceId: required(values, 'source-id'),
      sourceType: required(values, 'source-type'),
      provider: required(values, 'provider'),
      capturedAt: required(values, 'captured-at'),
      outputDir: required(values, 'output-dir'),
      soulStoreDir: required(values, 'soul-store'),
      targetSoulId: required(values, 'target-soul-id'),
      importId: values['import-id'],
      replace: Boolean(values.replace),
    })

    process.stdout.write(`${JSON.stringify({
      workspace: result.outputDir,
      importId: result.target.importId,
      evidenceWorkspace: result.evidenceDir,
      targetSoulId: result.target.targetSoulId,
      baselineDigest: result.target.baseline.digest,
      targetBinding: result.targetFile,
      baselineSnapshot: result.baselineFile,
      canonicalMutation: result.canonicalMutation,
      profileMutation: result.profileMutation,
    }, null, 2)}\n`)
  } catch (error) {
    writeFailure(error)
  }
}

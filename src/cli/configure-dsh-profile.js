#!/usr/bin/env node

import { configureDshProfileDir, describeConfigurationPlan } from '../profile-configure.js'

const HELP = `Usage: dsh-ai-soul-configure --profile-dir <path> --soul-id <id> --store-dir <path> --surface <tui|web|headless> [options]

Compose dsh-ai-soul into an existing DeepSeek Harness application profile.
Soul identity, profile name, and application surface remain independent.

Required:
  --profile-dir <path>       Existing DSH application-profile directory
  --soul-id <id>             Explicit persisted Soul ID
  --store-dir <path>         Soul Store directory
  --surface <surface>        One of: tui, web, headless

Options:
  --dependency-spec <spec>   npm-compatible dependency source for dsh-ai-soul.
                             Required only when the profile does not already declare it.
                             Example: file:/absolute/path/to/dsh-ai-soul
  --context-order <number>   Context injection order (default: -10)
  --write                    Apply changes; otherwise dry-run only
  --help                     Show this help
`

const VALUE_OPTIONS = new Set([
  'profile-dir',
  'soul-id',
  'store-dir',
  'surface',
  'dependency-spec',
  'context-order',
])

function parseInputs(args) {
  const values = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--help') return { help: true }
    if (arg === '--write') {
      values.write = true
      continue
    }
    if (!arg.startsWith('--')) throw new Error(`unexpected argument: ${arg}`)
    const key = arg.slice(2)
    if (!VALUE_OPTIONS.has(key)) throw new Error(`unknown option: ${arg}`)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`missing value for ${arg}`)
    values[key] = value
    index += 1
  }

  for (const key of ['profile-dir', 'soul-id', 'store-dir', 'surface']) {
    if (!values[key]) throw new Error(`missing required --${key}`)
  }

  return { values }
}

try {
  const parsed = parseInputs(process.argv.slice(2))
  if (parsed.help) {
    process.stdout.write(HELP)
  } else {
    const values = parsed.values
    const contextOrder = values['context-order'] === undefined ? -10 : Number(values['context-order'])
    if (!Number.isFinite(contextOrder)) throw new Error('--context-order must be a finite number')

    const result = await configureDshProfileDir({
      profileDir: values['profile-dir'],
      soulId: values['soul-id'],
      storeDir: values['store-dir'],
      surface: values.surface,
      dependencySpec: values['dependency-spec'],
      contextOrder,
      dryRun: !values.write,
    })

    process.stdout.write(`${JSON.stringify({
      mode: result.dryRun ? 'dry-run' : 'write',
      profileDir: result.profileDir,
      ...describeConfigurationPlan(result),
    }, null, 2)}\n`)

    if (!result.preflight.applicationReady) process.exitCode = 2
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  const dependencySourceMissing = /dependencySpec is required/.test(message)
  process.stderr.write(`${JSON.stringify({
    ready: false,
    error: message,
    hint: dependencySourceMissing
      ? 'Pass --dependency-spec with the same npm-compatible source used for dsh-ai-soul (for example file:/absolute/path/to/dsh-ai-soul), or install it in the profile first.'
      : 'Run dsh-ai-soul-configure --help for usage.',
  }, null, 2)}\n`)
  process.exitCode = 1
}

#!/usr/bin/env node

import { preflightDshProfileDir } from '../profile-preflight.js'

const HELP = `Usage: dsh-ai-soul-preflight --profile-dir <path> --soul-id <id> --store-dir <path> --surface <tui|web|headless>

Verify that an existing DeepSeek Harness application profile can load the selected Soul and expose the requested application surface.
Soul identity, profile name, and application surface remain independent.

Arguments:
  --profile-dir <path>       Existing DSH application-profile directory
  --soul-id <id>             Explicit persisted Soul ID
  --store-dir <path>         Soul Store directory
  --surface <surface>        One of: tui, web, headless
  --help                     Show this help

Environment fallbacks:
  DSH_PROFILE_DIR, SOUL_ID, SOUL_STORE_DIR, DSH_SURFACE
Explicit CLI arguments take precedence over environment values.
`

const VALUE_OPTIONS = new Set(['profile-dir', 'soul-id', 'store-dir', 'surface'])

function parseInputs(args, env) {
  const values = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--help') return { help: true }
    if (!arg.startsWith('--')) throw new Error(`unexpected argument: ${arg}`)
    const key = arg.slice(2)
    if (!VALUE_OPTIONS.has(key)) throw new Error(`unknown option: ${arg}`)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`missing value for ${arg}`)
    values[key] = value
    index += 1
  }

  const inputs = {
    profileDir: values['profile-dir'] ?? env.DSH_PROFILE_DIR,
    soulId: values['soul-id'] ?? env.SOUL_ID,
    storeDir: values['store-dir'] ?? env.SOUL_STORE_DIR,
    surface: values.surface ?? env.DSH_SURFACE,
  }

  for (const [key, value] of Object.entries({
    'profile-dir': inputs.profileDir,
    'soul-id': inputs.soulId,
    'store-dir': inputs.storeDir,
    surface: inputs.surface,
  })) {
    if (!value) throw new Error(`missing required --${key} (or corresponding environment variable)`)
  }

  return { inputs }
}

try {
  const parsed = parseInputs(process.argv.slice(2), process.env)
  if (parsed.help) {
    process.stdout.write(HELP)
  } else {
    const result = await preflightDshProfileDir(parsed.inputs)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ready) process.exitCode = 1
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(JSON.stringify({
    ready: false,
    error: message,
    hint: 'Run dsh-ai-soul-preflight --help for usage.',
  }, null, 2))
  process.exitCode = 1
}

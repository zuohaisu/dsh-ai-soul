#!/usr/bin/env node

import { preflightDshSurfaceContinuityDirs } from '../surface-continuity-preflight.js'

const HELP = `Usage: dsh-ai-soul-surface-continuity --tui-profile-dir <path> --web-profile-dir <path> --soul-id <id> --store-dir <path>

Verify that real DeepSeek Harness TUI and Web profile directories bind to the same explicit Soul continuity anchor (soulId + storeDir).
The command is read-only and emits machine-readable JSON. A non-ready result exits non-zero.

Arguments:
  --tui-profile-dir <path>   Existing DSH TUI profile directory
  --web-profile-dir <path>   Existing DSH Web profile directory
  --soul-id <id>             Explicit persisted Soul ID shared by both surfaces
  --store-dir <path>         Explicit Soul Store directory shared by both surfaces
  --help                     Show this help

Environment fallbacks:
  DSH_TUI_PROFILE_DIR, DSH_WEB_PROFILE_DIR, SOUL_ID, SOUL_STORE_DIR
Explicit CLI arguments take precedence over environment values.
`

const VALUE_OPTIONS = new Set(['tui-profile-dir', 'web-profile-dir', 'soul-id', 'store-dir'])

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
    tuiProfileDir: values['tui-profile-dir'] ?? env.DSH_TUI_PROFILE_DIR,
    webProfileDir: values['web-profile-dir'] ?? env.DSH_WEB_PROFILE_DIR,
    soulId: values['soul-id'] ?? env.SOUL_ID,
    storeDir: values['store-dir'] ?? env.SOUL_STORE_DIR,
  }

  for (const [key, value] of Object.entries({
    'tui-profile-dir': inputs.tuiProfileDir,
    'web-profile-dir': inputs.webProfileDir,
    'soul-id': inputs.soulId,
    'store-dir': inputs.storeDir,
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
    const result = await preflightDshSurfaceContinuityDirs(parsed.inputs)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ready) process.exitCode = 1
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(JSON.stringify({
    ready: false,
    error: message,
    hint: 'Run dsh-ai-soul-surface-continuity --help for usage.',
  }, null, 2))
  process.exitCode = 1
}

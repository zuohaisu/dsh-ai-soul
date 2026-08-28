#!/usr/bin/env node

import { preflightDshProfileDir } from '../profile-preflight.js'

function parseInputs(args, env) {
  const values = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg.startsWith('--')) throw new Error(`unexpected argument: ${arg}`)
    const key = arg.slice(2)
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

  return inputs
}

try {
  const inputs = parseInputs(process.argv.slice(2), process.env)
  const result = await preflightDshProfileDir(inputs)
  console.log(JSON.stringify(result, null, 2))
  if (!result.ready) process.exitCode = 1
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(JSON.stringify({ ready: false, error: message }, null, 2))
  process.exitCode = 1
}

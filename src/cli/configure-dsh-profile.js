#!/usr/bin/env node

import { configureDshProfileDir, describeConfigurationPlan } from '../profile-configure.js'

const args = process.argv.slice(2)
const values = {}
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--write') {
    values.write = true
    continue
  }
  if (!arg.startsWith('--')) throw new Error(`unexpected argument: ${arg}`)
  const key = arg.slice(2)
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${arg}`)
  values[key] = value
  index += 1
}

for (const key of ['profile-dir', 'soul-id', 'store-dir', 'surface']) {
  if (!values[key]) throw new Error(`missing required --${key}`)
}

const result = await configureDshProfileDir({
  profileDir: values['profile-dir'],
  soulId: values['soul-id'],
  storeDir: values['store-dir'],
  surface: values.surface,
  dependencySpec: values['dependency-spec'] || 'latest',
  contextOrder: values['context-order'] === undefined ? -10 : Number(values['context-order']),
  dryRun: !values.write,
})

process.stdout.write(`${JSON.stringify({
  mode: result.dryRun ? 'dry-run' : 'write',
  profileDir: result.profileDir,
  ...describeConfigurationPlan(result),
}, null, 2)}\n`)

if (!result.preflight.applicationReady) process.exitCode = 2

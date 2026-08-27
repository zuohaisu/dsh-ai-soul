import { preflightDshProfileDir } from '../src/profile-preflight.js'

const profileDir = process.env.DSH_PROFILE_DIR
const soulId = process.env.SOUL_ID
const storeDir = process.env.SOUL_STORE_DIR
const surface = process.env.DSH_SURFACE

try {
  const result = await preflightDshProfileDir({ profileDir, soulId, storeDir, surface })
  console.log(JSON.stringify(result, null, 2))
  if (!result.ready) process.exitCode = 1
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(JSON.stringify({ ready: false, error: message }, null, 2))
  process.exitCode = 1
}

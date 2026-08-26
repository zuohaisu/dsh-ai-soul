import { preflightSoul } from '../src/preflight.js'

const soulId = process.env.SOUL_ID
const storeDir = process.env.SOUL_STORE_DIR

try {
  const result = await preflightSoul({ soulId, storeDir })

  console.log(`[dsh-ai-soul] preflight OK — Soul ${result.soulId}`)
  console.log(`[dsh-ai-soul] store: ${result.storeDir}`)
  console.log('')
  console.log(result.renderedContext)
} catch (error) {
  console.error(`[dsh-ai-soul] preflight FAILED: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}

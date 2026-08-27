import { resolve } from 'node:path'

import {
  FileSoulStore,
  projectSoulContext,
  renderSoulContext,
} from './core/index.js'

export async function preflightSoul({ soulId, storeDir }) {
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('preflight soulId is required')
  }
  if (!storeDir || typeof storeDir !== 'string') {
    throw new TypeError('preflight storeDir is required')
  }

  const resolvedStoreDir = resolve(storeDir)
  const store = new FileSoulStore({ rootDir: resolvedStoreDir })

  let state
  try {
    state = await store.load(soulId)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Soul preflight failed at store-load boundary for soulId=${soulId} storeDir=${resolvedStoreDir}: ${detail}`,
      { cause: error },
    )
  }

  let projection
  let renderedContext
  try {
    projection = projectSoulContext(state)
    renderedContext = renderSoulContext(projection)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Soul preflight failed at context-projection boundary for soulId=${soulId}: ${detail}`,
      { cause: error },
    )
  }

  return {
    soulId,
    storeDir: resolvedStoreDir,
    state,
    projection,
    renderedContext,
  }
}

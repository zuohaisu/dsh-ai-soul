import { resolve } from 'node:path'

import {
  FileSoulStore,
  projectSoulContext,
  renderSoulContext,
} from './core/index.js'

export const name = 'ai-soul'
export const inject = ['systemPrompt']

function validateConfig(config = {}) {
  if (!config.soulId || typeof config.soulId !== 'string') {
    throw new TypeError('config.soulId is required')
  }
  if (!config.storeDir || typeof config.storeDir !== 'string') {
    throw new TypeError('config.storeDir is required')
  }

  return {
    soulId: config.soulId,
    storeDir: resolve(config.storeDir),
    contextOrder: Number.isFinite(config.contextOrder) ? config.contextOrder : -10,
  }
}

export async function apply(ctx, rawConfig = {}) {
  if (!ctx) throw new TypeError('DSH context is required')
  if (!ctx.systemPrompt?.context) {
    throw new TypeError('DSH systemPrompt service is required')
  }

  const config = validateConfig(rawConfig)
  const store = new FileSoulStore({ rootDir: config.storeDir })
  const state = await store.load(config.soulId)
  const projection = projectSoulContext(state)
  const text = renderSoulContext(projection)

  ctx.systemPrompt.context({
    name: `ai-soul:${config.soulId}`,
    order: config.contextOrder,
    text,
  })

  console.log(`[dsh-ai-soul] loaded Soul ${config.soulId}`)
}

export * from './core/index.js'

export const name = 'ai-soul'

/**
 * Minimal DSH adapter bootstrap.
 *
 * Soul Core deliberately has no dependency on Cordis or DeepSeek Harness.
 * Runtime-specific hooks will be added here only after they are backed by a
 * concrete continuity requirement from Experiment 001.
 */
export function apply(ctx) {
  if (!ctx) throw new TypeError('DSH context is required')

  console.log('[dsh-ai-soul] loaded — Soul Core bootstrap active')
}

export * from './core/index.js'

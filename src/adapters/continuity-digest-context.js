import { projectContinuityDigest } from '../core/index.js'

export const DSH_CONTINUITY_DIGEST_HEADING = 'Soul Continuity Digest (read-only)'

export function renderDshContinuityDigest(state) {
  const digest = projectContinuityDigest(state)
  if (digest.entries.length === 0) return ''
  const lines = digest.entries.map((entry) => `- [${entry.sourcePath}] ${entry.text}`)
  if (digest.omittedEntryCount > 0) lines.push(`- … ${digest.omittedEntryCount} additional canonical continuity facts omitted by bound`)
  return `${DSH_CONTINUITY_DIGEST_HEADING}\n${lines.join('\n')}`
}

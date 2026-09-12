import { projectContinuityDigest } from './continuity-digest.js'

export const CONTINUITY_DIGEST_DELTA_VERSION = 1

function bySourcePath(entries) {
  return new Map(entries.map((entry) => [entry.sourcePath, entry]))
}

export function projectContinuityDigestDelta({ before, after } = {}) {
  const beforeDigest = projectContinuityDigest(before)
  const afterDigest = projectContinuityDigest(after)

  if (beforeDigest.soulId !== afterDigest.soulId) {
    throw new TypeError('continuity digest delta requires the same soulId')
  }

  const beforeByPath = bySourcePath(beforeDigest.entries)
  const afterByPath = bySourcePath(afterDigest.entries)
  const sourcePaths = [...new Set([...beforeByPath.keys(), ...afterByPath.keys()])].sort()
  const added = []
  const removed = []
  const changed = []

  for (const sourcePath of sourcePaths) {
    const beforeEntry = beforeByPath.get(sourcePath)
    const afterEntry = afterByPath.get(sourcePath)

    if (!beforeEntry) {
      added.push(structuredClone(afterEntry))
      continue
    }
    if (!afterEntry) {
      removed.push(structuredClone(beforeEntry))
      continue
    }
    if (beforeEntry.text !== afterEntry.text) {
      changed.push({
        sourcePath,
        beforeText: beforeEntry.text,
        afterText: afterEntry.text,
      })
    }
  }

  return {
    version: CONTINUITY_DIGEST_DELTA_VERSION,
    soulId: beforeDigest.soulId,
    hasVisibleChanges: added.length > 0 || removed.length > 0 || changed.length > 0,
    beforeOmittedEntryCount: beforeDigest.omittedEntryCount,
    afterOmittedEntryCount: afterDigest.omittedEntryCount,
    added,
    removed,
    changed,
  }
}

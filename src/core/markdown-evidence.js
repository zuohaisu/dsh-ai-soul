import { createHash } from 'node:crypto'

import { validateExodusSource } from './exodus-source.js'

export const MARKDOWN_EVIDENCE_VERSION = 1

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

function normalizeContent(content) {
  if (typeof content === 'string') return Buffer.from(content, 'utf8')
  if (Buffer.isBuffer(content) || content instanceof Uint8Array) return Buffer.from(content)
  throw new TypeError('content must be a string, Buffer, or Uint8Array')
}

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function atxHeading(line) {
  const match = line.replace(/\r$/, '').match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/)
  if (!match) return null
  return { level: match[1].length, text: match[2] }
}

function fenceStart(line) {
  const match = line.replace(/\r$/, '').match(/^\s{0,3}(`{3,}|~{3,})(.*)$/)
  if (!match) return null
  return { marker: match[1][0], length: match[1].length }
}

function closesFence(line, fence) {
  const expression = new RegExp(`^\\s{0,3}${fence.marker === '`' ? '`' : '~'}{${fence.length},}\\s*$`)
  return expression.test(line.replace(/\r$/, ''))
}

function makeUnit(source, index, kind, lines, startIndex, endIndex, headingPath) {
  return {
    unitId: `${source.sourceId}:markdown:${String(index + 1).padStart(4, '0')}`,
    sourceRef: {
      sourceId: source.sourceId,
      algorithm: source.content.algorithm,
      digest: source.content.digest,
    },
    kind,
    lineStart: startIndex + 1,
    lineEnd: endIndex + 1,
    headingPath: [...headingPath],
    rawText: lines.slice(startIndex, endIndex + 1).join('\n'),
    canonicalMutation: false,
  }
}

export function normalizeMarkdownEvidence({ source, content }) {
  const validation = validateExodusSource(source)
  if (!validation.valid) {
    throw new TypeError(`invalid Exodus source: ${validation.errors.join('; ')}`)
  }

  const bytes = normalizeContent(content)
  const actualDigest = digest(bytes)
  if (actualDigest !== source.content.digest) {
    throw new Error(`content digest mismatch for Exodus source ${source.sourceId}`)
  }

  const lines = bytes.toString('utf8').split('\n')
  const headingStack = []
  const units = []
  let index = 0

  while (index < lines.length) {
    if (lines[index].replace(/\r$/, '').trim() === '') {
      index += 1
      continue
    }

    const heading = atxHeading(lines[index])
    if (heading) {
      headingStack.length = heading.level - 1
      headingStack[heading.level - 1] = heading.text
      units.push(makeUnit(source, units.length, 'heading', lines, index, index, headingStack.filter(Boolean)))
      index += 1
      continue
    }

    const fence = fenceStart(lines[index])
    if (fence) {
      const start = index
      index += 1
      while (index < lines.length) {
        if (closesFence(lines[index], fence)) {
          index += 1
          break
        }
        index += 1
      }
      units.push(makeUnit(source, units.length, 'fenced-code', lines, start, index - 1, headingStack.filter(Boolean)))
      continue
    }

    const start = index
    index += 1
    while (index < lines.length) {
      if (lines[index].replace(/\r$/, '').trim() === '') break
      if (atxHeading(lines[index]) || fenceStart(lines[index])) break
      index += 1
    }
    units.push(makeUnit(source, units.length, 'content', lines, start, index - 1, headingStack.filter(Boolean)))
  }

  return deepFreeze({
    evidenceVersion: MARKDOWN_EVIDENCE_VERSION,
    adapter: 'markdown',
    sourceRef: {
      sourceId: source.sourceId,
      algorithm: source.content.algorithm,
      digest: source.content.digest,
    },
    units,
    canonicalMutation: false,
  })
}

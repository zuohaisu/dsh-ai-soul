import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

function assertIdentifier(value, label) {
  if (!value || typeof value !== 'string') throw new TypeError(`${label} is required`)
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) throw new TypeError(`${label} contains unsupported characters`)
  return value
}

function assertEntryId(value) {
  if (!value || typeof value !== 'string') throw new TypeError('entry id is required')
  return value
}

function entryPath(rootDir, soulId, index) {
  const sequence = String(index).padStart(12, '0')
  return join(rootDir, assertIdentifier(soulId, 'soulId'), `${sequence}.json`)
}

function stableRecord(record) {
  return `${JSON.stringify(record, null, 2)}\n`
}

export class FileEvolutionLedgerStore {
  constructor({ rootDir }) {
    if (!rootDir || typeof rootDir !== 'string') throw new TypeError('rootDir is required')
    this.rootDir = rootDir
  }

  async list(soulId) {
    assertIdentifier(soulId, 'soulId')
    const directory = join(this.rootDir, soulId)
    let names
    try {
      names = await readdir(directory)
    } catch (error) {
      if (error?.code === 'ENOENT') return []
      throw error
    }

    const entries = []
    for (const name of names.filter((entry) => entry.endsWith('.json')).sort()) {
      const raw = await readFile(join(directory, name), 'utf8')
      const record = JSON.parse(raw)
      if (record.soulId !== soulId) throw new TypeError('stored evolution entry belongs to another Soul')
      if (!Number.isSafeInteger(record.index) || record.index < 0 || !record.entry || typeof record.entry !== 'object') {
        throw new TypeError('invalid stored evolution entry')
      }
      entries.push(record)
    }
    return entries.map((record) => structuredClone(record.entry))
  }

  async append(soulId, entry, index) {
    assertIdentifier(soulId, 'soulId')
    if (!entry || typeof entry !== 'object') throw new TypeError('evolution entry is required')
    if (!Number.isSafeInteger(index) || index < 0) throw new TypeError('evolution index must be a non-negative integer')
    assertEntryId(entry.id)
    const record = { soulId, index, entry: structuredClone(entry) }
    const path = entryPath(this.rootDir, soulId, index)
    await mkdir(dirname(path), { recursive: true })
    const serialized = stableRecord(record)

    try {
      const existing = await readFile(path, 'utf8')
      if (existing === serialized) return path
      throw new TypeError('conflicting evolution entry already exists')
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }

    const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`
    await writeFile(temporaryPath, serialized, { encoding: 'utf8', mode: 0o600 })
    await rename(temporaryPath, path)
    return path
  }

  async ingest(soulId, entries) {
    if (!Array.isArray(entries)) throw new TypeError('evolution entries must be an array')
    const existing = await this.list(soulId)
    for (let index = 0; index < entries.length; index += 1) {
      if (index < existing.length) {
        if (stableRecord(existing[index]) !== stableRecord(entries[index])) {
          throw new TypeError('legacy evolution history conflicts with detached ledger')
        }
        continue
      }
      await this.append(soulId, entries[index], index)
    }
    return this.list(soulId)
  }
}

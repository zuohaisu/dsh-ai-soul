import { access, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { validateCognitiveMemoryRecord } from './cognitive-memory.js'

function assertIdentifier(value, label) {
  if (!value || typeof value !== 'string') throw new TypeError(`${label} is required`)
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) throw new TypeError(`${label} contains unsupported characters`)
  return value
}

function memoryPath(rootDir, soulId, memoryId) {
  return join(rootDir, assertIdentifier(soulId, 'soulId'), `${assertIdentifier(memoryId, 'memoryId')}.json`)
}

function stableRecord(record) {
  return `${JSON.stringify(record, null, 2)}\n`
}

export class FileCognitiveMemoryStore {
  constructor({ rootDir, removeFile = rm }) {
    if (!rootDir || typeof rootDir !== 'string') throw new TypeError('rootDir is required')
    if (typeof removeFile !== 'function') throw new TypeError('removeFile must be a function')
    this.rootDir = rootDir
    this.removeFile = removeFile
  }

  async exists(soulId, memoryId) {
    try {
      await access(memoryPath(this.rootDir, soulId, memoryId))
      return true
    } catch (error) {
      if (error?.code === 'ENOENT') return false
      throw error
    }
  }

  async load(soulId, memoryId) {
    const raw = await readFile(memoryPath(this.rootDir, soulId, memoryId), 'utf8')
    const record = JSON.parse(raw)
    const validation = validateCognitiveMemoryRecord(record)
    if (!validation.valid) throw new TypeError(`invalid stored cognitive memory: ${validation.errors.join('; ')}`)
    if (record.soulId !== soulId) throw new TypeError('stored cognitive memory belongs to another Soul')
    return structuredClone(record)
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

    const records = []
    for (const name of names.filter((entry) => entry.endsWith('.json')).sort()) {
      records.push(await this.load(soulId, name.slice(0, -5)))
    }
    return records
  }

  async save(record) {
    const validation = validateCognitiveMemoryRecord(record)
    if (!validation.valid) throw new TypeError(`invalid cognitive memory: ${validation.errors.join('; ')}`)

    const path = memoryPath(this.rootDir, record.soulId, record.id)
    await mkdir(dirname(path), { recursive: true })
    const serialized = stableRecord(record)

    try {
      const existing = await readFile(path, 'utf8')
      if (existing === serialized) return path
      throw new TypeError('conflicting cognitive memory already exists')
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }

    const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`
    await writeFile(temporaryPath, serialized, { encoding: 'utf8', mode: 0o600 })
    await rename(temporaryPath, path)
    return path
  }

  async erase(soulId, memoryId) {
    const path = memoryPath(this.rootDir, soulId, memoryId)
    let record
    try {
      record = await this.load(soulId, memoryId)
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return Object.freeze({ erased: false, soulId, memoryId, reason: 'not-found' })
      }
      throw error
    }

    try {
      await this.removeFile(path)
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return Object.freeze({ erased: false, soulId, memoryId, reason: 'already-absent' })
      }
      throw error
    }
    return Object.freeze({
      erased: true,
      soulId: record.soulId,
      memoryId: record.id,
      experienceId: record.experienceId,
      significanceAssessmentId: record.significanceAssessmentId,
    })
  }
}

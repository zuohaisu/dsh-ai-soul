import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { validateSoulState } from './soul-state.js'

function soulPath(rootDir, soulId) {
  if (!soulId || typeof soulId !== 'string') throw new TypeError('soulId is required')
  if (!/^[a-zA-Z0-9._-]+$/.test(soulId)) throw new TypeError('soulId contains unsupported characters')
  return join(rootDir, `${soulId}.json`)
}

export class FileSoulStore {
  constructor({ rootDir }) {
    if (!rootDir || typeof rootDir !== 'string') throw new TypeError('rootDir is required')
    this.rootDir = rootDir
  }

  async exists(soulId) {
    try {
      await access(soulPath(this.rootDir, soulId))
      return true
    } catch (error) {
      if (error?.code === 'ENOENT') return false
      throw error
    }
  }

  async load(soulId) {
    const path = soulPath(this.rootDir, soulId)
    const raw = await readFile(path, 'utf8')
    const state = JSON.parse(raw)
    const validation = validateSoulState(state)
    if (!validation.valid) {
      throw new TypeError(`invalid stored Soul state: ${validation.errors.join('; ')}`)
    }
    return state
  }

  async save(state) {
    const validation = validateSoulState(state)
    if (!validation.valid) {
      throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
    }

    const path = soulPath(this.rootDir, state.soulId)
    await mkdir(dirname(path), { recursive: true })

    const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
    await rename(temporaryPath, path)

    return path
  }
}

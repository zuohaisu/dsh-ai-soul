import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  FileSoulStore,
  persistGenesisSoul,
  validateGenesisRecord,
} from './core/index.js'

export async function bootstrapGenesisSoul({ recordFile, storeDir }) {
  if (typeof recordFile !== 'string' || recordFile.trim() === '') {
    throw new TypeError('recordFile is required')
  }
  if (typeof storeDir !== 'string' || storeDir.trim() === '') {
    throw new TypeError('storeDir is required')
  }

  const recordPath = resolve(recordFile)
  const rootDir = resolve(storeDir)

  let record
  try {
    record = JSON.parse(await readFile(recordPath, 'utf8'))
  } catch (error) {
    throw new TypeError(`Genesis record must be readable valid JSON: ${error.message}`)
  }

  const validation = validateGenesisRecord(record)
  if (!validation.valid) {
    throw new TypeError(`invalid genesis record: ${validation.errors.join('; ')}`)
  }

  const store = new FileSoulStore({ rootDir })
  const { state, path } = await persistGenesisSoul(store, record)

  return {
    soulId: state.soulId,
    name: state.identity.name,
    genesisRecordId: state.identity.origin.genesisRecordId,
    storePath: path,
    state,
  }
}

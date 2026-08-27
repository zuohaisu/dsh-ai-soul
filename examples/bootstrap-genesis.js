import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  FileSoulStore,
  persistGenesisSoul,
  validateGenesisRecord,
} from '../src/core/index.js'

const [recordPathArg, storeDirArg] = process.argv.slice(2)

if (!recordPathArg || !storeDirArg) {
  console.error('usage: node examples/bootstrap-genesis.js <genesis-record.json> <soul-store-dir>')
  process.exitCode = 2
} else {
  try {
    const recordPath = resolve(recordPathArg)
    const storeDir = resolve(storeDirArg)
    const record = JSON.parse(await readFile(recordPath, 'utf8'))
    const validation = validateGenesisRecord(record)
    if (!validation.valid) {
      throw new TypeError(`invalid genesis record: ${validation.errors.join('; ')}`)
    }

    const store = new FileSoulStore({ rootDir: storeDir })
    const { state, path } = await persistGenesisSoul(store, record)

    console.log(`[dsh-ai-soul] Genesis persisted Soul ${state.soulId}`)
    console.log(`[dsh-ai-soul] Name: ${state.identity.name}`)
    console.log(`[dsh-ai-soul] Origin record: ${state.identity.origin.genesisRecordId}`)
    console.log(`[dsh-ai-soul] Store file: ${path}`)
  } catch (error) {
    console.error(`[dsh-ai-soul] Genesis bootstrap failed: ${error.message}`)
    process.exitCode = 1
  }
}

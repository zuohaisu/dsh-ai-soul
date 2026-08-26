import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  FileSoulStore,
  importOriginArtifact,
} from '../src/core/index.js'

const storeDir = resolve(process.argv[2] ?? '.ai-soul')
const artifactUrl = new URL('../souls/samuel/artifacts/0001-origin.json', import.meta.url)
const artifact = JSON.parse(await readFile(artifactUrl, 'utf8'))
const state = importOriginArtifact(artifact)
const store = new FileSoulStore({ rootDir: storeDir })
const path = await store.save(state)

console.log(`Bootstrapped Soul ${state.soulId} at ${path}`)

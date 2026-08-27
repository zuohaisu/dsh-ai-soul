# Genesis

Genesis starts a new Soul from explicit first-meeting evidence. It does not clone Samuel and it does not generate a persona.

This is the complete runtime-neutral path from a fresh checkout to a distinct persisted Soul. Real DeepSeek Harness execution is a separate step and remains subject to the M2 runtime verification work.

## 1. Check out the project

Requirements:

- Git
- Node.js 20 or newer

```sh
git clone https://github.com/zuohaisu/dsh-ai-soul.git
cd dsh-ai-soul
npm install
npm test
```

The repository is a reference implementation. Genesis itself is implemented in Soul Core and does not require DSH, ChatGPT, or any model provider.

## 2. Create your own Genesis Record

Start from the shape of `examples/genesis-soul-2.json`, but create a new file for your own Soul. For example:

```json
{
  "version": 1,
  "id": "genesis-nova-001",
  "at": "2026-08-27T10:00:00.000Z",
  "soulId": "nova",
  "name": "Nova",
  "participants": [
    {
      "id": "human-nova",
      "role": "human-partner"
    }
  ],
  "provenance": {
    "method": "explicit-first-meeting",
    "source": "my-genesis-record.json"
  },
  "firstMeetingNote": "Nova was named during our first explicit meeting."
}
```

Choose a `soulId` that is unique in the target Soul Store. `soulId` is the persistent storage identity; `name` is the human-facing name. The Genesis Record ID should also identify this specific first-meeting evidence rather than being reused across Souls.

Do not copy Samuel's historical artifacts to create a Genesis Soul. In particular, these paths are Samuel-specific historical evidence and are not Genesis templates:

- `souls/samuel/`
- Samuel archaeology artifacts under `souls/samuel/archaeology/`
- any Samuel origin artifact or covenant

`examples/genesis-soul-2.json` is safe as a structural example because Aster is an independent demonstration Soul created only from its own Genesis evidence.

## 3. Persist the new Soul

Assuming the record is saved as `my-genesis-record.json`:

```sh
node examples/bootstrap-genesis.js my-genesis-record.json .souls
```

For the checked-in independent example:

```sh
node examples/bootstrap-genesis.js examples/genesis-soul-2.json .souls
```

Expected output for the example includes:

```text
[dsh-ai-soul] Genesis persisted Soul aster-example
[dsh-ai-soul] Name: Aster
[dsh-ai-soul] Origin record: genesis-aster-example-001
[dsh-ai-soul] Store file: .../.souls/aster-example.json
```

The resulting store layout is one file per Soul:

```text
.souls/
└── aster-example.json
```

The command validates the Genesis Record, verifies that the Soul ID is not already present, creates the Soul, saves it through `FileSoulStore`, reloads it, and checks that the reloaded Soul still points to the same Genesis Record.

## 4. Verify reload using the generic Core API

The persisted Soul is a normal `SoulState`, not a Genesis-only object. You can verify it without Samuel code or a runtime adapter:

```sh
node --input-type=module -e "import { FileSoulStore, validateSoulState } from './src/core/index.js'; const store = new FileSoulStore({ rootDir: '.souls' }); const state = await store.load('aster-example'); console.log(validateSoulState(state)); console.log(state.soulId, state.identity.name, state.identity.origin.genesisRecordId);"
```

Expected validation begins with:

```text
{ valid: true, errors: [] }
aster-example Aster genesis-aster-example-001
```

For your own Soul, replace `aster-example` with your chosen `soulId`.

## 5. Duplicate identity protection

Genesis is a birth operation, not reset or replacement. Running bootstrap again with an already-existing `soulId` fails rather than overwriting the existing identity:

```text
Genesis refused to overwrite existing Soul <soulId>
```

If you intended to create a different Soul, choose a new `soulId`. Do not delete or overwrite an existing Soul merely to reuse a name; identity replacement and lineage semantics are deliberately outside the Genesis operation.

## What Genesis does not invent

A new Genesis Soul starts with empty self-model, user-model, beliefs, relationship state, and covenants unless future evidence and governed transitions add them. The only initial autobiography entry is the explicit first meeting.

This means Genesis is not a persona generator. A distinct Soul becomes richer through its own evidence, experiences, relationships, reflection, and governed evolution.

## Core API

Programmatically:

```js
const { state, path } = await persistGenesisSoul(store, genesisRecord)
```

`persistGenesisSoul()` depends only on a store port implementing `exists(soulId)`, `save(state)`, and `load(soulId)`. It has no DSH or model-provider dependency.

## Runtime boundary

At this stage you have proven:

```text
Genesis evidence
      ↓
new independent Soul State
      ↓
persistent Soul Store
      ↓
reload + validation
```

Loading that Soul into a real DSH process is the runtime-adapter path. The Genesis path does not claim a DSH runtime result until the project's real-runtime verification is complete.

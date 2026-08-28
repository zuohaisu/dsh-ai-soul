# Genesis

Genesis starts a new Soul from explicit first-meeting evidence. It does not clone Samuel and it does not generate a persona.

The supported ordinary-user path is the published `dsh-ai-soul-genesis` CLI. Genesis itself remains runtime-neutral: creating a Soul and choosing the DSH application profile/surface that will run it are separate operations.

## 1. Install the package

Requirements:

- Node.js 20 or newer
- a writable directory for the Soul Store

When developing from this repository:

```sh
git clone https://github.com/zuohaisu/dsh-ai-soul.git
cd dsh-ai-soul
npm install
npm test
```

For normal package use, install `dsh-ai-soul` through the package flow used by your DSH profile. The Genesis command is part of the package `bin` surface.

## 2. Create your Genesis Record

Genesis requires explicit first-meeting evidence rather than inventing a finished persona. A record has this shape:

```json
{
  "version": 1,
  "id": "genesis-nova-001",
  "at": "2026-08-28T00:30:00.000Z",
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

Choose a `soulId` that is unique in the target Soul Store. `soulId` is the persistent Soul identity; `name` is the human-facing name. Neither value determines a DSH profile name or UI surface.

Do not copy Samuel historical artifacts to create a Genesis Soul. `souls/samuel/` and Samuel archaeology/origin/covenant files are evidence for one existing Soul, not templates for new users.

The checked-in `examples/genesis-soul-2.json` record for Aster is only a safe structural example because it contains independent first-meeting evidence and no Samuel defaults.

## 3. Create and persist the Soul

The command is self-describing; use `dsh-ai-soul-genesis --help` to inspect the supported inputs without needing repository source or Samuel-specific setup.

Save the record, for example as `my-genesis-record.json`, then run:

```sh
dsh-ai-soul-genesis \
  --record ./my-genesis-record.json \
  --store-dir ./.souls
```

Expected output includes:

```text
[dsh-ai-soul] Genesis persisted Soul nova
[dsh-ai-soul] Name: Nova
[dsh-ai-soul] Origin record: genesis-nova-001
[dsh-ai-soul] Store file: .../.souls/nova.json
```

The command:

1. reads and validates the explicit Genesis Record;
2. creates the Soul through the existing Genesis Core semantics;
3. refuses to overwrite an existing `soulId`;
4. persists through `FileSoulStore`;
5. reloads the Soul and verifies origin provenance before reporting success.

No DSH profile is created or inferred by this operation.

For repository development, the equivalent npm script is:

```sh
npm run genesis -- --record ./my-genesis-record.json --store-dir ./.souls
```

`examples/bootstrap-genesis.js` remains a repository reference example, not the primary supported user interface.

## 4. Verify the resulting Soul

The store layout is one file per Soul:

```text
.souls/
└── nova.json
```

The persisted object is a normal `SoulState`. Programmatic consumers can load it through `FileSoulStore`, and DSH application-profile composition can select it later through explicit `soulId` / store configuration.

Genesis identity and runtime surface remain orthogonal:

```text
Soul: Nova ─┬─→ TUI
            ├─→ Web
            └─→ Headless
```

Use the project profile configure/preflight flow to attach the selected Soul to a supported DSH application profile. Genesis itself does not assume TUI, Web, Headless, or any profile name.

## 5. Duplicate identity protection

Genesis is a birth operation, not reset or replacement. Running the command again with an already-existing `soulId` fails rather than overwriting the existing identity:

```text
Genesis refused to overwrite existing Soul <soulId>
```

If you intend to create a different Soul, choose a new `soulId`. Identity replacement and lineage semantics are deliberately outside Genesis.

## What Genesis does not invent

A new Genesis Soul starts with empty self-model, user-model, beliefs, relationship state, and covenants unless later evidence and governed transitions add them. The only initial autobiography entry is the explicit first meeting.

Genesis is therefore not a persona generator. The Soul becomes richer through its own evidence, experiences, relationships, reflection, governed evolution, and—optionally—later external evidence ingestion.

## Package API

The CLI is backed by the published helper:

```js
import { bootstrapGenesisSoul } from 'dsh-ai-soul/genesis-bootstrap'

const result = await bootstrapGenesisSoul({
  recordFile: './my-genesis-record.json',
  storeDir: './.souls',
})
```

The helper reuses `FileSoulStore`, `validateGenesisRecord()`, and `persistGenesisSoul()` from Soul Core. It introduces no second Genesis semantics and has no DSH/model-provider dependency.

## Runtime boundary

At this stage Genesis proves:

```text
explicit Genesis evidence
      ↓
new independent Soul State
      ↓
persistent Soul Store
      ↓
reload + provenance validation
```

Loading that Soul into an interactive DeepSeek Harness application remains the profile/runtime-adapter composition path. Creating the Soul and choosing its application surface are deliberately separate concerns.

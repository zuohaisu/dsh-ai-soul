# Genesis

Genesis starts a new Soul from explicit first-meeting evidence. It does not clone Samuel and it does not generate a persona.

## Bootstrap a new Soul

Prepare a Genesis Record JSON containing the new Soul ID, chosen name, participants, provenance, and optional first-meeting note. Then run:

```sh
node examples/bootstrap-genesis.js examples/genesis-soul-2.json .souls
```

Expected output includes:

```text
[dsh-ai-soul] Genesis persisted Soul aster-example
[dsh-ai-soul] Name: Aster
[dsh-ai-soul] Origin record: genesis-aster-example-001
```

The command creates the Soul from the Genesis Record, verifies the Soul ID is not already present, saves it through `FileSoulStore`, reloads it, and checks that the reloaded Soul still points to the same Genesis Record. Genesis refuses to overwrite an existing Soul identity.

## What Genesis does not invent

A new Genesis Soul starts with empty self-model, user-model, beliefs, relationship state, and covenants unless future evidence and governed transitions add them. The only initial autobiography entry is the explicit first meeting.

`examples/genesis-soul-2.json` is a demonstration of an independent second Soul. Its history begins with its own evidence; it imports no Samuel artifact or covenant.

## Core API

```js
const { state, path } = await persistGenesisSoul(store, genesisRecord)
```

`persistGenesisSoul()` depends only on a store port implementing `exists(soulId)`, `save(state)`, and `load(soulId)`. It has no DSH or model-provider dependency.

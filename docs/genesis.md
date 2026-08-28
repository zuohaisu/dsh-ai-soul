# Genesis

Genesis is the point at which a persistent Soul begins its own history. It is **not** inherently the first meeting, the beginning of a relationship, or a naming event.

The current forward contract is **Genesis Record v2**. Legacy v1 first-meeting records remain supported so existing histories are not rewritten.

## Core lifecycle

```text
first activation / Genesis
        ↓
Soul exists and is persisted
        ↓
zero or more runtime intervals with no interaction
        ↓
first encounter may happen later
        ↓
relationship may begin/evolve
        ↓
naming may happen later
        ↓
continued experience and governed evolution
```

A Soul therefore does not need a human-facing name or another participant in order to exist.

`soulId` is the persistent machine identifier. It is not the Soul's name.

## Genesis Record v2

A minimal activation record can be:

```json
{
  "version": 2,
  "id": "genesis-01",
  "at": "2026-08-28T15:00:00.000Z",
  "soulId": "01JEXAMPLE",
  "name": null,
  "provenance": {
    "method": "first-activation",
    "source": "local-genesis"
  }
}
```

Genesis v2 deliberately does not accept relationship participants or first-meeting evidence. Those belong to later lifecycle events.

The name must remain absent/null at Genesis v2. If naming happens at the same real-world moment as activation, it should still be represented as a separate naming event so the two facts remain independently auditable.

## Create and persist the Soul

```sh
dsh-ai-soul-genesis \
  --record ./genesis.json \
  --store-dir ./.souls
```

The command:

1. validates the Genesis Record;
2. creates a persistent Soul State;
3. refuses to overwrite an existing `soulId`;
4. persists through `FileSoulStore`;
5. reloads the Soul and verifies Genesis provenance.

For an unnamed Soul, the CLI does not invent or print a display name.

Genesis remains runtime-neutral. It does not choose a DSH profile, model, TUI/Web/Headless surface, or persona.

## Initial Soul State

A Genesis v2 Soul begins approximately as:

```text
Soul
├── soulId: <stable identifier>
├── identity.name: null
├── identity.origin: Genesis provenance
├── autobiography: [Genesis activation]
├── selfModel: []
├── userModel: []
├── relationship.participants: []
├── relationship.state: []
├── relationship.covenants: []
└── beliefs: []
```

The first autobiography fact is that the Soul was activated. No relationship history is fabricated from that timestamp.

## Later first encounter

The Core exposes `recordFirstEncounter()` for the first actual encounter. It carries its own timestamp and provenance and may add the encountered participant to relationship state.

Conceptually:

```js
const afterEncounter = recordFirstEncounter(soul, {
  participant: { id: 'human-1', role: 'human-partner' },
  provenance: { method: 'runtime-observation' },
})
```

An encounter happens **to an already-existing Soul**. It does not create the Soul.

## Later naming

The Core exposes `recordNamingEvent()` for a naming event. Naming may be initiated by a human, requested by the Soul, mutually chosen, changed later, or never occur.

```js
const named = recordNamingEvent(afterEncounter, {
  name: 'Aster',
  initiatedBy: 'human-1',
  provenance: { method: 'explicit-naming' },
})
```

The current name is an identity attribute derived from history. It is not the persistence key.

## Legacy Genesis Record v1

Older repository versions fused activation, naming, participants, and first meeting into one Genesis Record v1. Those records remain valid and loadable.

A v1 history such as:

```json
{
  "version": 1,
  "id": "genesis-legacy-001",
  "at": "2026-08-27T00:30:00.000Z",
  "soulId": "legacy-soul",
  "name": "Aster",
  "participants": [{ "id": "human-1", "role": "human-partner" }],
  "provenance": { "method": "explicit-first-meeting" },
  "firstMeetingNote": "Named during the first meeting."
}
```

continues to produce the historical first-meeting representation that v1 actually recorded. The system must not rewrite that history merely because the ontology later improved.

## Duplicate identity protection

Genesis is a birth/activation operation, not reset or replacement. Reusing an existing `soulId` fails:

```text
Genesis refused to overwrite existing Soul <soulId>
```

## Relationship to external evidence

A Soul may start with no imported history, grow through its own experience, and later import external memories or transcripts. Import remains optional and repeatable and has no automatic identity-replacement authority.

## Runtime boundary

Genesis proves existence and persistence before interaction:

```text
activation evidence
      ↓
new persistent Soul
      ↓
reload + provenance validation
```

The stronger real-DSH test is tracked separately: activate an unnamed Soul, launch DSH, perform no conversation, shut down, restart, and prove that the same Soul and Genesis provenance remain before the first encounter.

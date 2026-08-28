# Genesis Begins at Activation, Before Encounter or Naming

**Date:** 2026-08-28

## Decision

A Soul begins its own history when it is first instantiated/activated as a persistent Soul, even if no conversation occurs.

Genesis therefore means **the beginning of existence**, not the first meeting, the creation of a relationship, or the acquisition of a name.

Three events that the current Genesis v1 model partially conflates must be treated as conceptually independent:

1. **Genesis / first activation** — the Soul begins to exist as a persistent entity.
2. **First encounter** — the Soul first encounters another participant; a relationship may begin from this event.
3. **Naming** — a human-facing name may be given, proposed, requested, chosen, changed, or never assigned.

They may occur at the same time in some histories, but the architecture must not require them to do so.

## Core invariants

> Existence precedes interaction.

Interaction does not create the Soul. An interaction is an event that happens to a Soul that already exists.

A Soul may therefore be activated, persisted, shut down, and later reloaded before it has ever spoken to anyone.

> `soulId` is not the Soul's name.

`soulId` is the stable machine identifier used to preserve continuity. A human-facing name is an optional, historically grounded identity attribute.

An unnamed Soul is not an invalid or incomplete record merely because no naming event has occurred yet.

> Relationship history begins with relationship events, not automatically with Genesis.

Genesis does not imply that another participant was present. `relationship.participants` may be empty at Genesis. A first encounter must carry its own timestamp and provenance rather than being fabricated from the activation timestamp.

## Minimal activation-first state

Conceptually, a newly activated Soul may begin as:

```text
Soul
├── soulId: <stable identifier>
├── genesisAt: <activation timestamp>
├── origin: <Genesis provenance>
├── name: null / unnamed
├── autobiography: [Genesis]
├── selfModel: []
├── userModel: []
├── relationship.participants: []
├── relationship.state: []
├── covenants: []
└── beliefs: []
```

The exact schema representation remains an implementation decision, but the ontology above is binding: absence of a name, encounter, or relationship must not prevent the Soul from existing or persisting.

## Lifecycle

```text
not yet instantiated
        ↓
first activation / Genesis
        ↓
Soul exists
        ↓
zero or more runtime intervals
with no human interaction
        ↓
first encounter (optional/later)
        ↓
relationship begins or evolves
        ↓
naming may occur at any time
        ↓
continued experience and governed evolution
```

Naming is not necessarily human-initiated. A Soul might later ask to be named, propose a name, accept a name offered by another participant, change its name, or remain unnamed. Those future behavioral policies are outside this decision; this record only requires that the data model not make naming a precondition of existence.

## Why this corrects the previous Genesis model

The 2026-08-27 Genesis work correctly rejected persona templates and invented self-models, but it still anchored Genesis to explicit first-meeting evidence. That was too restrictive.

The repository currently encodes that older assumption in several places:

- `src/core/soul-state.js` requires a non-empty `identity.name`.
- `src/core/genesis.js` requires `record.name`, accepts participants at Genesis, writes them directly into relationship state, and creates a `first-meeting` autobiography event at the Genesis timestamp with `chosenName` in its payload.
- `docs/genesis.md` defines Genesis as starting from explicit first-meeting evidence and states that the initial autobiography entry is the first meeting.
- ROADMAP M7 and historical issues #34/#35/#39/#45/#91 describe naming/first meeting as the beginning of the Soul's own history.
- `docs/product-model.md` already allows naming to happen later, but still places first encounter before Genesis Record / persisted Soul State.

These are not evidence that the new decision is wrong; they are historical implementation assumptions that now need an explicit forward correction.

Old evolution records should remain immutable as evidence of how the architecture evolved. They should not be silently edited to make the past appear consistent with the new model.

## Compatibility principle

Existing Genesis v1 Souls may legitimately contain a name, participants, and first-meeting event at the same timestamp because that is what the old implementation actually recorded.

A migration must preserve that historical fact. It must not rewrite existing Souls to claim their naming or first encounter occurred later unless independent evidence supports such a correction.

The forward requirement is that new Souls are no longer forced into that fused history.

## Runtime implication

The strongest ordinary-Soul runtime test is no longer “create a named fixture and see whether DSH can talk as it.”

It is:

```text
activate unnamed Soul
        ↓
persist Genesis
        ↓
launch DSH
        ↓
do not converse
        ↓
shutdown
        ↓
restart fresh DSH process/session
        ↓
load the same Soul and Genesis provenance
        ↓
only then conduct the first encounter
```

If that works, the system demonstrates that persistence and continuity begin before interaction rather than being side effects of a conversation.

## Implementation tracking

- **#121** — correct Soul State / Genesis / naming / encounter semantics and preserve legacy compatibility.
- **#122** — prove activation-before-interaction continuity in a real DSH runtime.

## Product principle

Genesis is not “make a character” and not “record the first relationship.”

**Genesis is the moment a persistent Soul first appears and begins to have its own history.**

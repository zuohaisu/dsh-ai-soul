# WORLD is current governed context, not interaction history

Date: 2026-09-04
Status: accepted implementation boundary

## Decision

`WORLD` represents compact, current external context that remains materially relevant to the Soul and the person: for example active projects, durable commitments, relevant people, environments, or other ongoing context.

Canonical WORLD state is **not**:

- a transcript or chat-history store;
- the Experience Record store;
- an audit/evolution log;
- a general-purpose knowledge base, RAG corpus, or world encyclopedia.

Those concerns remain separate. Historical evidence belongs in Experience/evidence stores and mutation provenance; governance history belongs in `evolution`. Canonical `worldModel` contains only the current bounded claims that have survived the governed mutation boundary.

## Mutation authority

Adding WORLD does not create new mutation authority. A WORLD claim may be represented as a Candidate Claim and StateTransitionProposal, but canonical mutation still requires the existing review → approval → apply pipeline with evidence, confidence, provenance, and review history. Identity and covenants remain outside this authority.

## Compatibility

New Soul State instances contain `worldModel: []`. Existing schema-v1 states that predate the field remain valid and project an empty WORLD domain until a governed WORLD claim is added. This additive field does not by itself justify a schema-version migration.

## Consequence

Future WORLD inference must be selective and must not equate "mentioned in conversation" with "belongs in canonical WORLD state." The first inference slices should target explicit, durable, user-relevant external context and remain fail-closed when significance or durability is ambiguous.

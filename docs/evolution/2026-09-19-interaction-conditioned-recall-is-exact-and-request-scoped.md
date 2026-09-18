# Interaction-conditioned Cognitive Memory recall is exact and request-scoped

Date: 2026-09-19
Status: immutable evolution record
Issue: #404

## Decision

Persisted Cognitive Memories may become model-visible through a recall cue derived
deterministically from the current provenance-bound DSH human interaction, without
any caller knowing historical `experienceId` / `significanceAssessmentId` identifiers.

The cue namespace is explicit structured recall keys (`recallKeys`) carried on
Cognitive Memory records. The only evidence inspected is the canonical DSH
human-interaction boundary and its explicit participant identity, projected as the
exact key `participant:<participant.id>`. Message text, model output, and transcript
history are never inspected. Records formed without recall keys remain valid and are
never recalled by cue.

Retrieval gains exactly one backward-compatible selector field, `recallKey`, with
exact-match semantics against `record.recallKeys`. The live DSH composition resolves
the cue after each accepted human interaction and renders the bounded selection for
subsequent prompt assemblies; the selection is request-scoped, recomputed per
interaction, and never persisted into Soul State, Cognitive Memory storage, or a
later request.

## Authority resolution order (live synchronous renderer)

1. Explicit request-scoped materialized records (`aiSoulCognitiveMemorySelection`).
2. Interaction-conditioned selection derived from the latest accepted human
   interaction (requires explicit `cognitiveMemoryStoreDir` configuration; an empty
   result is a real empty selection and suppresses the startup fallback).
3. Static startup `cognitiveMemorySelection`.

A request carrying both explicit records and an explicit selector fails closed.
A request carrying an explicit selector alone also fails closed in the live
renderer: synchronous context assembly cannot resolve selectors, so callers must
use the runtime-neutral `resolveRequestScopedCognitiveMemorySelection` boundary or
materialized records. Silent ignoring would be fail-open invisibility.

## Invariant

`interaction-conditioned cue != relevance inference != free-text query != embeddings != canonical truth != mutation != permission != execution`

The current interaction can now causally select bounded memory visibility, but the
selection still grants no retrieval authority beyond non-canonical visibility and no
write authority of any kind. Soul isolation, record validation, deterministic
ordering, and hard limits remain owned by the existing retrieval and visibility
contracts.

## Falsification boundary

Repository tests must demonstrate: two memories with different explicit recall keys
select differently under two different interaction cues; an unrelated interaction
selects nothing and suppresses startup fallback; explicit materialized records still
override the cue; dual request authorities fail closed; synthetic/plugin messages
never move the cue; and cue recall mutates neither canonical Soul state nor memory
storage. Without `cognitiveMemoryStoreDir`, composition remains byte-for-byte
default-off.

## Non-goals

This decision does not add embeddings, vector search, LLM recall oracles, free-form
fuzzy or substring matching, transcript-wide search, relevance ranking, automatic
memory formation, consolidation, or canonical promotion. It also does not make DSH
profiles multi-participant: the live cue is keyed to the profile's configured
participant identity, and per-interaction multi-participant cues require a separate
surface contract.

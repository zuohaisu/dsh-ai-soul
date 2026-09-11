# Cognitive Memory retrieval is not model visibility

Date: 2026-09-11
Issue: #364

## Decision

Detached Cognitive Memory may be retrieved through a bounded, deterministic, Soul-scoped selector without thereby becoming model-visible cognition.

The first retrieval boundary deliberately supports only existing machine-readable lineage fields: `experienceId` and `significanceAssessmentId`. It does not infer semantic relevance, rank with a model, embed records, or fall back to returning all memories.

Results are validated CognitiveMemoryRecord values, deterministically ordered by `formedAt` then `id`, detached from store ownership, and capped by a hard maximum. Empty selection is a valid result.

## Invariant

`retrieval != model visibility != canonical mutation != permission != execution authority`

Retrieval does not modify canonical Soul State, evolution/governance history, Experience, SignificanceAssessment, or the selector supplied by the caller. A later model-context integration must define its own bounded visibility policy rather than treating the memory store as an implicit prompt archive.

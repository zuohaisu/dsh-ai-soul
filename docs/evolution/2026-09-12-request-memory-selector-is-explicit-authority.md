# Request-scoped Cognitive Memory selector is explicit authority

Date: 2026-09-12
Issue: #372

## Decision

A DSH cognition may carry an explicit machine-readable Cognitive Memory lineage selector without granting the runtime adapter semantic relevance authority.

The selector boundary delegates only to the canonical deterministic bounded retrieval contract. Supported criteria remain `experienceId` and `significanceAssessmentId`; zero matches remain an empty selection. The selector is ephemeral request input and is never persisted into Soul State or Cognitive Memory.

Explicit materialized memory records and an explicit selector are separate authority sources. Supplying both for one cognition is ambiguous and must fail closed rather than merge them.

## Invariant

`request-scoped selector != relevance inference != model authority != canonical truth != mutation != permission != execution`

No free-text query, transcript scanning, embedding/vector search, model ranking, fallback-to-all, or autonomous memory selection is introduced by this boundary.

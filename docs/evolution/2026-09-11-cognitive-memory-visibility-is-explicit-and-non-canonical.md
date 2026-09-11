# Cognitive Memory visibility is explicit and non-canonical

Date: 2026-09-11
Issue: #366

## Decision

Persisted or retrievable Cognitive Memory is not automatically model-visible. Model visibility requires an explicitly supplied, already-selected set of valid CognitiveMemoryRecords for the same Soul.

The visibility projector does not query stores, discover memories, rank relevance, or fall back to all memories. It applies hard count and character bounds and produces a detached non-canonical cognition fragment.

## Invariants

- memory existence != retrieval != model visibility != canonical truth;
- no explicit memory selection means no Cognitive Memory visibility;
- cross-Soul or invalid/tampered memories fail closed;
- visible memory remains `canonical: false` and `authority: none`;
- projection grants no permission, scheduling, tool, execution, or canonical-mutation authority;
- canonical SELF / OTHER / RELATIONAL / WORLD cognition remains distinct from selective memory.

## Deferred

This decision does not define relevance ranking, embeddings, vector search, automatic retrieval, prompt-time selection policy, or consolidation into canonical Soul state.

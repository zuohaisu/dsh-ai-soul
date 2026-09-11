# DSH Cognitive Memory composition is explicit and default-off

Date: 2026-09-12
Status: immutable evolution record
Issue: #368

## Decision

DSH may expose Cognitive Memory to model cognition only when a caller explicitly supplies an already-selected memory set through the adapter composition boundary.

The ordinary DSH path remains unchanged: without `cognitiveMemorySelection`, the registered system context contains only the canonical Soul Context projection. An explicitly supplied empty selection is also equivalent to no memory visibility.

When a non-empty selection is supplied, the adapter delegates validation and bounding to the runtime-neutral Cognitive Memory visibility projector and appends its rendered section after canonical Soul Context. The section remains explicitly non-canonical and authority-free.

## Invariants

- DSH composition is not retrieval authority.
- The adapter does not query a memory store, rank memories, infer relevance, or fall back to all memories.
- Memory existence does not imply retrieval.
- Retrieval does not imply model visibility.
- Model visibility does not imply canonical truth, mutation authority, permission, or execution authority.
- Cross-Soul, malformed, tampered, or over-bound selections fail closed before model visibility.
- Composing memory into cognition does not mutate canonical Soul state or memory records.

## Falsification boundary

Repository tests must demonstrate both sides of the seam: default DSH composition contains no Cognitive Memory section, while an explicit valid same-Soul selection becomes visible as a bounded non-canonical section. Empty selection remains invisible; cross-Soul and tampered records are rejected; canonical state remains unchanged.

## Non-goals

This decision does not add automatic retrieval, embeddings, vector search, RAG, relevance ranking, transcript replay, consolidation, or autonomous memory selection. Those require separate authority and evidence boundaries.
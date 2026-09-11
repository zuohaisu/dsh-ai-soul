# Request-scoped Cognitive Memory visibility does not persist

Date: 2026-09-12
Status: immutable evolution record
Issue: #370

## Decision

DSH cognition may receive an explicitly selected Cognitive Memory set through the per-context invocation carrier `aiSoulCognitiveMemorySelection`.

The carrier is ephemeral input to one context rendering call. It is never copied into plugin state, Soul State, Cognitive Memory storage, or a later request. When both startup `cognitiveMemorySelection` and request-scoped selection are present, the request-scoped selection takes precedence for that invocation only. An explicitly supplied empty request selection suppresses startup memory for that invocation.

## Invariants

- Request-scoped visibility is not retrieval authority.
- The adapter does not infer relevance, inspect message text, query memory stores, rank memories, or fall back to all stored memories.
- Request-scoped selection is not retained after the context-render invocation.
- A later request without request-scoped selection cannot inherit an earlier request's selection.
- Startup selection remains backward-compatible and is used only when the current request supplies no request-scoped selection.
- Same-Soul validation and hard bounds remain owned by the runtime-neutral Cognitive Memory visibility projector.
- Empty explicit request selection means no Cognitive Memory visibility for that invocation.
- Visibility does not mutate canonical Soul State or Cognitive Memory records and grants no permission or execution authority.

## Falsification boundary

Repository tests must demonstrate one running Soul where request A sees only its explicitly supplied memory, request B without a request selection does not see A's memory, explicit empty selection suppresses startup fallback, cross-Soul/tampered input fails closed, and canonical state remains unchanged.

## Non-goals

This decision does not define automatic retrieval, relevance scoring, embeddings, vector search, RAG, transcript scanning, autonomous memory selection, consolidation, or canonical promotion.
# Cognitive Memory persistence is detached from canonical Soul state

Date: 2026-09-11
Status: current

## Decision

A `CognitiveMemoryRecord` may persist across process and session boundaries in a Soul-scoped detached store without becoming canonical Soul state.

Persistence does not grant mutation, governance, permission, scheduling, tool, or execution authority. The store validates records on both write and read, scopes paths by `soulId`, treats identical duplicate writes as idempotent, and fails closed on conflicting duplicates or malformed/tampered records.

## Boundary

This slice provides durable save/load/list only. It does not define retrieval ranking, vector search, prompt injection, automatic consolidation, or promotion into current canonical cognition.

The conceptual separation remains:

interaction history != Experience != Cognitive Memory != canonical Soul State != governance/audit history.

## Falsifiability

A saved memory must be recoverable by a fresh store instance. Cross-Soul reads, malformed stored records, path traversal identifiers, and conflicting duplicate writes must fail closed. Saving memory must not require or imply mutation of canonical Soul state.

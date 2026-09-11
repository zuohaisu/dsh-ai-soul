# 2026-09-11 — Cognitive Memory is not canonical Soul State

## Decision

Introduce a bounded `CognitiveMemoryRecord` as a separate, non-canonical value formed only from an already significant Experience lineage.

The architecture now distinguishes five different histories/state classes:

1. interaction history — runtime conversation/activity;
2. Experience Record — bounded provenance-bearing observation evidence;
3. Cognitive Memory — selectively formed remembered content derived from significant experience;
4. canonical Soul State — current governed SELF / OTHER / RELATIONAL / WORLD / belief cognition;
5. governance/audit history — why canonical state changed and who authorized it.

These are not aliases and must not be silently collapsed into one store or prompt payload.

## Formation boundary

A Cognitive Memory requires a valid Experience plus a significance assessment that references that exact Experience and explicitly marks it high-significance/promotable. Ordinary/control Experience therefore cannot become Cognitive Memory through this boundary.

Remembered content is separately bounded and attributable. The record does not copy an unbounded transcript and does not itself mutate canonical Soul State.

## Authority

`CognitiveMemoryRecord` is `canonical:false` and `authority:none`. Formation grants no governance approval, canonical mutation, permission, scheduling, tool-call, or execution authority.

## Deferred deliberately

This decision does not define persistence, retrieval ranking, prompt injection, consolidation, forgetting, or RAG. Those require separate falsifiable slices after the formation boundary is stable.
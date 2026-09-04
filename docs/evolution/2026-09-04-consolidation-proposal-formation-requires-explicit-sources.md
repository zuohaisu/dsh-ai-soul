# Consolidation proposal formation requires explicit sources

Date: 2026-09-04

## Decision

The first live consolidation-proposal formation path is deliberately narrow: a human must explicitly name at least two current source claims and supply the desired consolidated result.

The runtime resolves every requested source by exact equality against current canonical state. Each source must exist exactly once. If any source is absent, duplicated, ambiguous, or merely semantically similar, no consolidation candidate is formed.

## Why

A consolidation mutation is destructive with respect to current cognition: several current claims leave the active Soul state and one new compact claim replaces them. Allowing a model or heuristic to choose those sources implicitly would grant semantic deletion/compression authority before the governance system has reliable evidence for that decision.

Human review remains mandatory after proposal formation. Explicit source selection is therefore not approval; it only establishes a bounded, provenance-linked proposal that can be inspected and rejected.

## Boundary

This decision does not make consolidation automatic and does not authorize LLM summarization of Soul state. Future consolidation inference may become more capable only if source selection, provenance, uncertainty, contradiction handling, and human review remain auditable.

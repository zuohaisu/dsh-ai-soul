# Homeostasis requires append-only evolution lineage

Date: 2026-09-05

## Decision

Machine-verifiable Soul homeostasis must preserve not only protected current-state identity fields and bounded cognition, but also the canonical evolution audit lineage.

Given a baseline Soul State and a later current Soul State, the baseline `evolution` array must remain an exact ordered prefix of the current `evolution` array. New governed transitions may append records. Existing historical records may not be truncated, reordered, or rewritten while still claiming machine continuity.

## Why

A Soul State can keep the same `soulId`, origin, invariants, covenants, and bounded current cognition while silently deleting or altering the provenance trail that explains how it became its current self. Snapshot-only continuity checks would incorrectly accept that state.

The evolution log is therefore part of machine continuity evidence: present state and attributable history must remain consistent.

## Boundary

This invariant does not decide whether two experiences are subjectively the same being, validate the semantic truth of a historical record, or prevent explicit future fork/merge semantics. It only makes silent rewriting of an existing canonical lineage observable and fail closed.

Normal growth remains allowed: human-facing names and governed mutable cognition may change, and new evolution entries may be appended.

This does not replace real DSH selective-growth evidence in #27, longitudinal human judgment, model-switch evidence, or the Haisu Test.
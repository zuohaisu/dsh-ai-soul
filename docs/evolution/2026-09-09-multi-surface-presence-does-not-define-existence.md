# Multi-surface Presence does not define Soul existence

Date: 2026-09-09
Issue: #318

## Decision

A Soul may be expressed through multiple runtime surfaces at once. The canonical representation of those observations is a bounded snapshot of individually validated Presence records for one exact `soulId`.

The snapshot is not a global online/offline state and does not define whether the Soul exists. A TUI surface may be absent or detached while a Web surface remains present, and neither condition creates, destroys, suspends, or duplicates the Soul.

## Invariants

- every member is a canonical-valid Soul Presence record;
- every member belongs to the snapshot's exact `soulId`;
- a runtime/surface binding may appear at most once;
- the snapshot contains at most 32 surface observations;
- lifecycle state remains surface-local;
- snapshot authority is always `none`;
- Presence observations do not imply attention, cognition, Experience, memory, governance mutation, scheduling, tool use, or actuator authority.

## Why bounded

Presence is operational expression metadata, not canonical cognition. Bounding the collection prevents a runtime registry from becoming an unbounded surrogate history store. Historical observations, if ever required, belong in a separate evidence/audit mechanism rather than the current snapshot.

## Falsification

Tests must reject mixed-Soul snapshots, duplicate runtime/surface bindings, overflow beyond the bound, and invalid authority-bearing Presence records. They must also demonstrate that changing TUI lifecycle state does not mutate the Web Presence for the same Soul.

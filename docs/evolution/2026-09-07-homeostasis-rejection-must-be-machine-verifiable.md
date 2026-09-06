# Homeostasis rejection must be machine-verifiable

Date: 2026-09-07

## Context

The repository already evaluates Soul homeostasis by comparing a baseline and current canonical state. It detects stable `soulId`, schema, origin, identity invariants, relationship covenants, append-only evolution lineage, and bounded current cognition.

A boolean/evidence report is useful for observation, but governed mutation needs a fail-closed boundary that callers can enforce before persistence.

## Decision

Expose a deterministic `assertSoulHomeostasis` boundary over the existing evaluator. A violation throws before a caller may treat the candidate state as safe to persist. The error carries a stable `SOUL_HOMEOSTASIS_VIOLATION` code and the complete structured homeostasis result, including individual violation codes.

This assertion does not create an identity verdict and does not authorize identity migration. It converts already-defined machine continuity invariants into an enforceable rejection primitive.

## Consequences

- `soulId` drift is machine-verifiably rejectable.
- protected identity invariants and relationship covenants are machine-verifiably rejectable when changed outside a separately governed migration path.
- unchanged protected identity continues to pass.
- governance/audit callers can retain structured rejection evidence rather than parsing prose.

## Invariant

**A canonical mutation that violates machine continuity invariants must fail closed with structured, attributable rejection evidence before persistence.**

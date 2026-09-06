# Operator protocol must match the evidence contract

Date: 2026-09-06
Issue: #275

## Decision

A canonical runtime-proof operator protocol must enumerate the same required observations, linkage, and evidence references as the machine verifier that judges the proof.

When the verifier contract becomes stricter, the operator protocol must be updated in the same evolution line. Human operators must not be told that verifier-required evidence is optional or merely supplemental.

## Invariant

Operator protocol != proof result, but operator protocol requirements == verifier evidence requirements.

The protocol may explain how to gather evidence, while the verifier deterministically judges supplied evidence. Neither may manufacture real-runtime facts.

## Consequence for selective growth

The M4.39 negative control is part of the machine-verifiable contract. A real DSH proof therefore requires durable evidence that an ordinary control interaction produced no durable-growth proposal and left canonical cognition unchanged.

Missing control evidence is incomplete. Observed control promotion or canonical mutation falsifies selectivity. CI, mocks, documentation, and hand-authored records do not substitute for the real TUI/Web run required by Issue #27.
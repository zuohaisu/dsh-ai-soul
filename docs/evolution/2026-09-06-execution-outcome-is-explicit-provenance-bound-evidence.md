# Execution outcome is explicit provenance-bound evidence

Date: 2026-09-06

## Decision

AI Soul must keep authorization consumption, execution attempt, and execution outcome as distinct auditable facts.

## Invariant

`authorization consumed != execution attempted != execution outcome`

An execution attempt never implies completion or success. An outcome must explicitly report `succeeded` or `failed`, remain bound to the exact attempt lineage, and carry reporter attribution plus provenance.

## Boundary

Outcome evidence is runtime-neutral and descriptive. It cannot grant authority, schedule or retry work, invoke tools, or carry actuator payloads. Its existence records what a provenance-bearing reporter asserted at a runtime boundary; it does not independently prove arbitrary external-world truth beyond that provenance.

This closes the generic Core audit chain without introducing an autonomous actuator.

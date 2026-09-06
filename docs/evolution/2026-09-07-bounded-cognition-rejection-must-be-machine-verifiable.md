# Bounded cognition rejection must be machine-verifiable

Date: 2026-09-07

## Context

Canonical current cognition is intentionally compact and bounded. Raw interaction history, Experience Records, governance history, and canonical cognition are different stores with different retention semantics. The existing append-capacity guard already rejected growth once a mutable cognitive domain reached its fixed capacity, but callers could only identify that condition by parsing a prose `TypeError` message.

## Decision

Keep the existing capacity and consolidation semantics, but make append-at-capacity rejection machine-verifiable. The guard now emits the stable `SOUL_CURRENT_COGNITION_CAPACITY_EXCEEDED` code and structured evidence containing the target domain, configured capacity, and current entry count.

## Consequences

- ordinary below-capacity governed growth remains unchanged;
- append-at-capacity still fails closed before candidate persistence;
- governance and audit surfaces can distinguish capacity pressure from malformed input or identity-homeostasis violations without parsing prose;
- no automatic consolidation authority is introduced;
- no transcript, Experience Record, or governance history is reclassified as canonical cognition.

## Invariant

**When canonical current cognition cannot accept another append without exceeding its bound, rejection must be fail-closed and machine-verifiable; capacity pressure must never silently expand canonical Soul state.**

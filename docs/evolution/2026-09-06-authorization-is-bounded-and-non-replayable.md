# Authorization is bounded and non-replayable

Date: 2026-09-06

## Decision

An approved agency authorization decision is a governance fact, not an immortal capability token.

Before any future actuator may rely on an authorization decision, use-time eligibility must be evaluated against the exact Soul, capability and scope, an explicit freshness policy, and externally maintained consumed/revoked decision identifiers.

## Invariant

`approved` does not imply `always reusable`.

A valid authorization may still be ineligible because it is expired, consumed, revoked, or being applied to a different Soul/capability/scope.

## Boundary

The evaluator is pure and side-effect free. It does not execute an action, persist consumption, revoke authority, schedule work, call tools, or prove that an action occurred.

This preserves the chain:

`intent → permission request → authorization decision → use-time eligibility → future execution boundary`

Eligibility is necessary evidence for execution authority, not execution itself.

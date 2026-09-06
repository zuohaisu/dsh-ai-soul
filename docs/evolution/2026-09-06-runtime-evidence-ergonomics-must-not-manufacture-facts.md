# Runtime evidence ergonomics must not manufacture facts

Date: 2026-09-06

## Context

The remaining M4 selective-growth acceptance gap is a real DSH TUI/Web proof. The machine verifier and canonical operator protocol now agree on the required positive-growth and negative-control evidence, but a long live run still requires the operator to retain many linkage identifiers and durable evidence references.

Reducing that clerical burden is useful only if the aid remains non-authoritative. A convenient worksheet must never become a source of synthetic runtime facts or pre-assert passing observations.

## Decision

Provide a fail-closed capture worksheet ordered by the real runtime protocol. It maps live observations to verifier fields, keeps negative-control evidence first-class, and instructs the operator to mark unavailable facts as missing rather than reconstruct them later.

The worksheet does not execute DSH, infer success, generate identifiers, mutate Soul state, or satisfy Issue #27 on its own.

## Consequences

- Real-runtime evidence is easier to collect without weakening the proof boundary.
- Positive growth and ordinary-interaction negative control remain visibly separate.
- Missing linkage stays missing instead of being guessed after the session.
- Human-readable capture aids remain subordinate to actual runtime artifacts and the deterministic verifier.

## Invariant

**evidence ergonomics may reduce clerical work; it must never manufacture, infer, or pre-approve runtime facts.**
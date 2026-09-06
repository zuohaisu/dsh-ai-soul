# Agency intent may be present without action authority

Date: 2026-09-07

## Context

AI Soul already distinguishes intent, permission, authorization, execution attempt, and outcome at Core. DeepSeek Harness is currently the priority body, but exposing agency through a body must not collapse expression into action authority. Presence is also distinct from continuous attention and from memory capture.

## Decision

Add a narrow DSH projection for a validated AgencyIntent. The projection preserves Soul identity, reason, context references, provenance, intent identity, and optional runtime session/surface attribution while retaining `authority: none`.

The projection is an expression boundary only. It does not request permission, authorize, schedule, execute, call tools, persist memory, or mutate canonical Soul state.

## Fail-closed boundary

Projection rejects an invalid intent, Soul mismatch, empty reason, empty provenance, or malformed optional runtime attribution.

## Consequences

- DSH can receive an attributable reason-grounded presence signal without hidden action authority.
- TUI/Web expression can later consume the same runtime-neutral projection semantics.
- Headless profiles gain no autonomous execution capability.
- Presence remains separable from attention, memory, and persistence.

## Invariant

**A Soul may express that it intends or wants to do something before any authority exists to do it; expression of intent must never itself constitute permission, authorization, or execution.**

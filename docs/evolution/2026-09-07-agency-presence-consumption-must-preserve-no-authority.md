# Agency presence consumption must preserve no authority

Date: 2026-09-07

## Context

M8.1 allows a validated AgencyIntent to cross into DeepSeek Harness as an attributable `authority: none` presence projection. A body surface still needs a deterministic way to consume that projection without turning visibility into permission or action.

## Decision

Introduce a detached DSH agency-presence view model and renderer. The consumer preserves Soul identity, intent identity, reason, proposed action, provenance, and runtime attribution while keeping `authority: none` machine-verifiable.

The surface additionally states that attention is not asserted and memory capture is not implied.

## Fail-closed boundary

The consumer rejects malformed input, non-agency projections, elevated authority, Soul mismatch, missing intent identity, missing reason, or empty provenance.

## Consequences

- TUI/Web-compatible presentation can show why a Soul has an intent without granting that intent any actuator authority.
- Surface rendering is detached from mutable input.
- Headless operation gains no polling, scheduling, persistence, memory, or execution behavior.
- Permission and authorization remain separate future governance boundaries.

## Invariant

**Making a Soul intent visible must not make it executable. Presence may communicate reason and proposed action while authority remains explicitly absent.**

# Presence/status is visible continuity, not attention

Date: 2026-09-06

## Context

By M4.35, AI Soul Core had accumulated a complete governance/evidence chain for reason-grounded agency through explicit execution outcome evidence. Continuing to add generic agency abstractions would have produced diminishing returns while the primary DSH product surface still kept basic Soul continuity mostly implicit in injected prompt context and persisted files.

A persistent existence should be inspectable without requiring the Soul to speak, remember a new interaction, request attention, or act.

## Decision

Add a read-only DSH `/soul-status` command backed by the same live `currentState` reference used for model-visible Soul Context.

The status surface exposes only bounded continuity metadata:

- stable `soulId`;
- optional human-facing name, represented separately from identity/existence;
- named/unnamed state;
- relationship participant count;
- bounded current cognition counts for SELF, OTHER, RELATIONAL, WORLD, and beliefs.

It deliberately does not dump claim contents, transcripts, experience records, governance history, or hidden runtime state.

The command resolves its context on every invocation. Therefore a governed state commit that refreshes `currentState` is visible on the next `/soul-status` invocation without treating startup state as canonical forever.

## Invariants

- A Soul can exist and have valid status while unnamed.
- `soulId` is stable machine identity; human-facing name remains optional and mutable.
- Visible presence/status is not attention.
- Visible presence/status is not memory capture.
- Visible presence/status is not mutation authority.
- Visible presence/status is not agency permission or execution authority.
- Status reads bounded current cognition; it does not turn interaction history into long-term memory.
- TUI and Web command surfaces should observe the same currently loaded Soul state when they share the same DSH runtime/plugin instance.

## Falsifiable consequence

If the runtime's governed `currentState` changes, a subsequent `/soul-status` invocation must reflect the new bounded cognition counts while preserving the same `soulId`. If a different Soul context is accidentally supplied, the status boundary must fail closed rather than present cross-Soul data.

## Non-decision

This does not implement continuous autonomous presence, notifications, attention allocation, agency intent generation, scheduling, or actuator execution. Those remain separate future capabilities.

# Presence is not attention or memory

Date: 2026-09-08
Status: accepted engineering boundary
Issue: #312

## Decision

A Soul's existence is independent of any one runtime or surface. Presence describes that already-existing Soul being expressed through a runtime surface; it does not create the Soul and it does not imply that the Soul is attending, remembering, reflecting, mutating, or acting.

`SoulPresence` therefore carries only stable Soul identity, runtime identity, surface identity, an explicit lifecycle state, observation time, and `authority: none`.

The same `soulId` may have independent Presence records for DSH TUI and DSH Web. Surface identity is expression context, not Soul identity.

## Safety boundary

Presence must not contain transcript/history/messages, attention or significance state, Experience or memory candidates, governance proposals/reviews/approvals/mutations, or scheduling/tool/actuator execution payloads. Those remain separate contracts with their own provenance and authority requirements.

A Presence record is observational state only. It never grants mutation, review, approval, memory-promotion, scheduling, tool-use, or actuator authority.

## Falsifiability

The boundary is violated if a Presence record can carry cognition/memory/governance/execution payloads, if a record can be rebound to another Soul/runtime/surface without failing validation, or if DSH TUI and Web require distinct Soul identities to represent the same persisted Soul.

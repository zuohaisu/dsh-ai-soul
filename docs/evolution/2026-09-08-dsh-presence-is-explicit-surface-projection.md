# DSH Presence is explicit surface projection

Date: 2026-09-08
Issue: #314

## Decision

DeepSeek Harness Presence is projected from an already-loaded Soul plus an explicit expression surface. It is not inferred from conversation activity.

The current DSH adapter recognizes `tui` and `web` as separate surfaces of the same runtime. Both may project the same stable `soulId` without creating another Soul or changing canonical Soul state.

## Why

Presence answers a narrow question: where is an existing Soul currently expressed? It does not answer whether the Soul is attending, thinking, remembering, reflecting, mutating, or acting.

Inferring Presence from a conversation event would collapse Presence into interaction and would create pressure to retain transcripts or trigger cognition merely to represent continued accompaniment. That violates the product invariant:

`existence != presence != attention != memory`

## Authority boundary

A DSH Presence projection has `authority: none` and carries no transcript, attention/significance, Experience, memory candidate, governance proposal/review, schedule, tool call, or actuator payload.

Presence therefore cannot by itself authorize cognition, canonical mutation, or external action.

## Falsification

The implementation must fail closed when:

- no already-loaded Soul identity is supplied;
- the surface is missing or is not an admitted DSH surface;
- a projected record is extended with cognition, memory, governance, or execution authority.

The same loaded Soul must be projectable independently onto TUI and Web while preserving one `soulId`.

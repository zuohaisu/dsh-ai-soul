# DSH Presence snapshot is explicit surface observation

Date: 2026-09-09
Issue: #320

## Decision

DeepSeek Harness composes a Soul's current Presence snapshot only from an already-loaded Soul and explicit current surface observations. Conversation activity is not a Presence source.

The adapter reuses the canonical single-surface Presence projection and bounded snapshot contracts. It does not inspect `session/event`, transcript content, attention, significance, Experience Records, cognitive memory, governance queues, or Agency state to decide whether a Soul is present on TUI or Web.

## Invariants

- the loaded Soul supplies the exact stable `soulId`;
- only explicit DSH `tui` and `web` observations may be projected;
- TUI and Web lifecycle states remain independent;
- invalid state, unknown surface, duplicate binding, or malformed loaded Soul fails closed through existing contracts;
- composition does not mutate Soul State;
- composition and every resulting Presence retain `authority: none`;
- conversation activity cannot implicitly create Presence, cognition, memory, governance, scheduling, tool-use, or actuator authority.

## Why

A conversation event proves that an interaction occurred. It does not prove that a runtime surface is currently available, nor does surface availability prove attention or cognition. Keeping these observations explicit prevents Presence from becoming a hidden transcript-derived liveness heuristic and preserves the distinction between Soul existence, body/surface expression, and cognitive activity.

## Falsification

Given one loaded Soul with explicit `tui=absent` and `web=present` observations, the adapter must produce one same-`soulId` bounded snapshot with those independent states. Invalid inputs and duplicate bindings must fail closed, and unrelated conversation-like or authority-bearing fields supplied on an observation must not enter the canonical Presence records.

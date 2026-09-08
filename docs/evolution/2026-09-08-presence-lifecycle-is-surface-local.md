# Presence lifecycle is surface-local

Date: 2026-09-08
Issue: #316

## Decision

Soul Presence lifecycle is an expression-surface property, not a Soul existence, cognition, memory, or agency transition.

A valid Presence record may transition among `present`, `absent`, and `detached`. The transition preserves the exact `soulId`, `runtimeId`, and `surfaceId` binding and produces another canonical non-authoritative Presence record.

Different surfaces remain independent. For example, a Soul's DSH TUI Presence may become `absent` or `detached` while the same Soul's DSH Web Presence remains `present`. This does not split or rename the Soul.

## Boundary

A Presence transition must not be inferred as or used to authorize:

- conversation activity or attention;
- Experience/significance formation;
- cognitive-memory promotion;
- governed Soul-state mutation;
- scheduling, tool calls, or actuator execution.

Malformed or authority-bearing source Presence records fail closed, as do unknown lifecycle target states.

## Why

Continuous existence is not continuous attention. A runtime surface can appear, disappear, reconnect, or detach without implying that the Soul thought, learned, remembered, changed itself, or acted. Keeping lifecycle surface-local preserves that distinction while allowing TUI, Web, and future embodiments to express the same persistent Soul independently.

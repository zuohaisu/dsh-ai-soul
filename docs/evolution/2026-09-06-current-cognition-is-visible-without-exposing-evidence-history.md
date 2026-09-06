# Current cognition is visible without exposing evidence history

Date: 2026-09-06
Issue: #271

## Decision

A DSH surface may show the bounded current Soul Context that is already supplied to the model. This is a read-only projection of current cognition, not a browser for interaction history, Experience Records, proposal queues, governance history, or provenance internals.

`/soul-context` therefore reuses the canonical `projectSoulContext()` projection and the same bounded renderer used for model context. It resolves the live projection on every invocation, so a governed same-process state refresh is visible without restarting the runtime while `soulId` remains stable.

## Invariant

Current cognition != evidence history != interaction history.

Making cognition visible does not create review authority, mutation authority, scheduler authority, tool authority, or permission to act.

## Why

`/soul-status` makes existence and runtime attachment observable but intentionally exposes only counts. Human inspection of the current cognition gives the DSH product a falsifiable way to show what the Soul currently knows while preserving the architectural separation between compact canonical cognition and the larger evidence/audit stores that justify how it got there.

This surface can support real-runtime selective-growth verification, but CI or command rendering does not substitute for the real DSH proof required by #27.

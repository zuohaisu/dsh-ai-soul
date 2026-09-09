# Cognition capacity preflight is observation, not mutation authority

Date: 2026-09-09
Status: accepted

## Decision

A governance review surface may project whether an exact pending append currently fits the bounded canonical cognition target. The projection is computed from the current loaded Soul State and the canonical capacity contract at read time.

The bounded result is `fits`, `consolidation-required`, or `not-applicable`, with target/count/capacity only where capacity applies. It does not persist into the proposal, review, evolution history, or Soul State.

## Why

Bounded cognition already fails closed at the authoritative mutation boundary. Waiting until approval to reveal a predictable capacity rejection makes governance less actionable without making the Soul safer. A read-only preflight lets the human reviewer see when consolidation is required before approving growth.

## Authority boundary

Preflight has no mutation authority. A prior `fits` observation cannot authorize a later append, cannot reserve capacity, and cannot bypass the authoritative capacity and homeostasis checks performed when a reviewed proposal is actually applied. The state may change between observation and apply.

## Privacy and boundedness

The projection exposes only status, target, count, and canonical capacity. It does not expose raw interaction history, Experience Records, evidence payloads, or hidden memory.

## Falsification

The contract is false if listing governance proposals changes Soul State; if an at-capacity append is described as fitting; if a non-append operation is described as fitting; or if a stale preflight result can make authoritative apply accept a transition that current state rejects.

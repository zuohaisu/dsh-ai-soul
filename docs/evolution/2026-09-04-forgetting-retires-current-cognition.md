# Forgetting retires current cognition; it is not silent history erasure

Date: 2026-09-04
Status: accepted engineering boundary

## Decision

An explicit human request to forget a current mutable claim may create a governed retirement intent for that exact current claim.

Forgetting at the Soul-state layer means:

- the retired claim stops being part of current canonical cognition;
- it stops being projected into future Soul Context;
- the retirement requires the same independent governance boundary as other significant state mutations;
- the mutation remains attributable to the source Experience and review decision.

It does **not** mean silently deleting source Experience Records, immutable governance history, backups, or other historical evidence.

## Why

A persistent Soul needs both continuity and the ability to stop treating information as current. Append-only cognition produces stale or privacy-hostile state. Conversely, deleting every trace of a retired claim would destroy provenance and make continuity unauditable.

Therefore current cognition and historical evidence remain separate concerns.

## Safety boundary

The first live inference is deliberately narrow. `Please forget that I prefer X` is eligible only when `X` resolves to exactly one current canonical `userModel` preference claim by exact structural match. Missing, duplicate, fuzzy, or ambiguous targets fail closed. Inference never grants mutation authority; it only emits a Candidate Claim plus a `retire(previousValue)` transition intent for independent review.

Physical erasure/redaction remains a separate privacy/storage capability and must be designed explicitly rather than being conflated with cognitive retirement.
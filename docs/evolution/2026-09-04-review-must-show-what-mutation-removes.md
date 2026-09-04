# Review must show what a governed mutation removes

Date: 2026-09-04
Status: accepted

## Decision

A human governance surface must render the mutation semantics of a pending Soul-state proposal, not only the proposed resulting claim.

For append, the reviewer must be able to see that the proposal adds a current claim.

For replace and retire, the reviewer must be able to see the exact current value that will be superseded or retired.

For consolidate, the reviewer must be able to see every exact current source value that will be removed from current cognition and the single resulting value that will replace them.

## Why

Human review is not meaningful if the reviewer can see only the destination state. A consolidation can look harmless when rendered only as a compact result while silently removing several existing current claims. That would preserve a nominal human approval step while weakening actual governance.

The mutation layer already binds `previousValue` / `previousValues` into proposal integrity. The human surface should expose the same semantics before approval so the review decision is informed by the exact mutation being authorized.

## Boundary

Rendering does not grant mutation authority. `/soul-review list` remains read-only and detached from canonical state. Approval or rejection continues through the independent governance boundary.

This decision does not authorize automatic consolidation inference, semantic matching of source values, or any identity-kernel/covenant mutation.

## Consequence

Governed growth surfaces should be evaluated by a stronger invariant:

> A reviewer must be able to understand both what current cognition will exist after approval and what current cognition approval will remove.

This keeps consolidation, revision, and forgetting auditable as AI Soul develops beyond append-only memory accumulation.

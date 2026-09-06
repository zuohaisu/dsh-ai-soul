# Governed growth must pass homeostasis before persistence

Date: 2026-09-07

## Context

The generic state-transition pipeline already restricts ordinary growth to mutable SELF, OTHER, RELATIONAL state, beliefs, and WORLD targets. M7.1 added a deterministic `assertSoulHomeostasis` primitive, but a primitive alone does not protect canonical persistence unless the governed mutation path actually invokes it.

## Decision

`applyStateTransitionProposal` must construct the complete candidate state, including its append-only evolution record, and then assert homeostasis against the pre-mutation canonical state before returning that candidate to any persistence caller.

The assertion is a postcondition on the complete candidate and a precondition for persistence. It therefore checks what would actually be saved rather than only inspecting proposal intent.

## Consequences

- ordinary reviewed mutable-domain growth continues through the existing pipeline;
- any future implementation defect or extension that causes `soulId`, protected identity invariants, relationship covenants, schema/origin continuity, or evolution lineage to drift is rejected before the candidate leaves the governed apply boundary;
- callers receive the stable `SOUL_HOMEOSTASIS_VIOLATION` error and structured evidence introduced by M7.1;
- this does not create an identity-migration authority. A separately governed migration path remains required for intentionally changing protected identity material.

## Invariant

**No generic governed-growth candidate is eligible for canonical persistence until the complete candidate state passes homeostasis against the canonical pre-mutation state.**

# Authorization consumption preserves initiation grounding

Date: 2026-09-08
Issue: #303 / M8.9

## Decision

Consuming an approved `AgencyAuthorizationDecision` must not sever the causal lineage that explains why the Soul initiated the authorized action. Version 2 `AgencyAuthorizationConsumption` records preserve `intentId`, `requestId`, `decisionId`, and, for grounded decisions, the immutable `initiationGrounding` containing trigger evidence identity/type, source, and provenance.

Consumption-specific provenance remains separate evidence about the consumer and ledger context. It may add context but cannot replace initiation grounding.

## Compatibility

Stored version 1 consumptions remain valid. A new consumption derived from a legacy authorization decision is explicitly `legacy-ungrounded`; no historical trigger evidence is invented.

## Authority boundary

Consumption is evidence that a one-shot authorization was reserved/used. It is not evidence that execution occurred or succeeded, and it grants no scheduling, polling, memory-write, canonical-state mutation, or tool authority beyond the exact upstream authorization.

## Falsifiable invariant

A grounded authorization consumption that loses or malforms initiation grounding is invalid. Caller provenance attempting to inject replacement trigger evidence or initiation grounding is rejected before consumption creation.

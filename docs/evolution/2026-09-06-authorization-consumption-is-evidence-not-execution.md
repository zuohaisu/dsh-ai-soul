# Authorization consumption is evidence, not execution

Date: 2026-09-06

## Decision

An approved authorization must not remain replayable merely because a caller remembers to pass an in-memory consumed-ID set.

AI Soul Core therefore models authorization consumption as a durable governance evidence record bound to one approved decision.

## Invariant

`eligible authorization → consumption evidence → future execution attempt`

Consumption marks that a one-shot authorization has been reserved/used for governance purposes. It does not prove that any external action succeeded, failed, or even began.

## Boundary

A consumption record is bound to the exact `decisionId`, `soulId`, capability and scope of the approved authorization decision. It carries consumer identity, reason, time and provenance, while forbidding execution, scheduler, tool-call, actuator and result payloads.

A deterministic projection can derive consumed authorization IDs from valid evidence records and feed them back into use-time eligibility checks.

This closes replay governance without collapsing audit evidence into actuator semantics.

# Execution outcomes preserve grounded authority lineage

Date: 2026-09-08
Issue: #307

## Decision

A durable AgencyExecutionOutcome is not merely a runtime status report. For a grounded execution path it must conserve the validated initiation and authority lineage already present on AgencyExecutionAttempt.

Grounded v2 outcomes therefore preserve intentId, requestId, decisionId, consumptionId, attemptId, and initiationGrounding. Outcome-specific provenance is separate reporting context and cannot replace trigger evidence or initiation grounding.

Legacy stored v1 outcomes remain valid. Outcomes created from legacy execution attempts are explicitly legacy-ungrounded and do not invent historical evidence.

## Boundary

This change grants no execution authority and introduces no actuator, tool payload, scheduling, retry, polling, memory write, or canonical Soul mutation. It only makes succeeded/failed audit evidence attributable to the reason-grounded authority chain that produced the execution attempt.

## Falsifiability

A grounded outcome is invalid if its initiation grounding is malformed or if its intent/request/grounding lineage differs from the validated execution attempt. Caller-supplied outcome provenance that attempts to replace trigger grounding is rejected fail-closed.

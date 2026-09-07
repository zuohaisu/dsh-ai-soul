# Execution attempts preserve initiation grounding

Date: 2026-09-08
Issue: #305

## Evolution

`AgencyExecutionAttempt` is the final pre-actuator evidence boundary. A grounded attempt must preserve the authorization consumption's intent, request, decision, consumption, and initiation-grounding lineage.

Execution-specific provenance is additive context only. It cannot replace or contradict the trigger evidence that grounded initiation.

## Compatibility

Stored version 1 execution attempts remain valid. A version 1 or otherwise legacy-ungrounded authorization consumption produces an explicit `legacy-ungrounded` version 2 attempt and does not invent historical trigger evidence.

## Safety boundary

This change grants no new actuator behavior and records no execution result. Scheduling, polling, tool payloads, memory writes, canonical Soul mutation, and outcome claims remain outside `AgencyExecutionAttempt`.

# Execution attempt is not execution outcome

Date: 2026-09-06

## Decision

AI Soul must not collapse authorization consumption, an external execution attempt, and an external execution result into one fact.

Core therefore models an execution attempt as a separate, runtime-neutral governance evidence record linked to one authorization-consumption record.

## Invariant

`authorization consumed → execution attempt evidence → future execution outcome evidence`

A consumed authorization only proves that a one-shot permission was reserved/used. An execution-attempt record proves only that a governed runtime boundary reports beginning an attempt. Neither fact proves completion, success, failure, or any external-world result.

## Boundary

An execution-attempt record is bound to the exact `consumptionId`, `decisionId`, `soulId`, capability, and scope of the authorization consumption. It carries executor identity, channel, reason, time, and provenance.

The record contains no scheduler payload, tool payload, actuator payload, result, outcome, success, failure, or completion claim, and the Core primitive performs no external action itself.

This preserves auditability before any runtime-specific actuator is introduced.
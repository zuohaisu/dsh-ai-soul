# Permission requests preserve initiation lineage

Date: 2026-09-07
Issue: #299

## Decision

An `AgencyPermissionRequest` must not sever the evidence lineage of the `AgencyIntent` that caused it. When an intent contains grounded trigger evidence, the permission request carries an immutable projection of the trigger evidence id, type, source, and provenance. Permission-specific provenance remains separate and cannot replace initiation grounding.

## Compatibility

Permission-request version 2 distinguishes `grounded` from `legacy-ungrounded`. Legacy intents remain usable, but missing historical evidence is never invented. Stored version 1 permission requests remain valid under the validator.

## Safety invariant

A permission request remains `status: pending` and `authority: none`. Preserving lineage grants no authorization, execution, scheduling, polling, memory-write, or canonical-state mutation authority.

## Falsification

The invariant fails if a grounded intent can produce a permission request without its trigger lineage, if caller provenance can replace that lineage, if malformed grounding is accepted, or if legacy compatibility fabricates evidence.

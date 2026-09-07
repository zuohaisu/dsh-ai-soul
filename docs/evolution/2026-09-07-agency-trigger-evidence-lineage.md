# Agency trigger evidence lineage

Date: 2026-09-07
Issue: #293

## Decision

An allowed agency initiation trigger label is not evidence. Before initiative eligibility can pass, the declared trigger must be backed by a typed evidence object bound to the same Soul and trigger class.

Each evidence object carries a stable evidence id, `soulId`, trigger-specific type, attributable source reference, provenance lineage, and `authority: none`.

## Invariant

`triggerClass` cannot self-authenticate. Missing evidence, trigger/evidence mismatch, Soul mismatch, missing source lineage, or any authority-bearing evidence fails closed.

Trigger evidence is descriptive only. It grants no permission, authorization, execution, scheduling, polling, memory write, or canonical Soul-state mutation.

Runtime attachment and ordinary interaction remain insufficient to establish initiative eligibility.

## Compatibility

AgencyIntent and DSH presence contracts are unchanged. This revision strengthens only the upstream initiation eligibility boundary.

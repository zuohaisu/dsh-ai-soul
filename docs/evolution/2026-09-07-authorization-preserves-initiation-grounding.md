# Authorization preserves initiation grounding

Date: 2026-09-07
Issue: #301 / M8.8

## Decision

An `AgencyAuthorizationDecision` is not allowed to sever the causal lineage that explains why a Soul initiated an action. When its validated `AgencyPermissionRequest` is grounded, the decision must carry the same immutable `initiationGrounding`: trigger evidence identity/type, source, and provenance.

Authorization-specific provenance remains a separate record of who decided and under what policy/review context. It may add context but cannot replace initiation grounding.

## Compatibility

Version 2 decisions explicitly distinguish `grounded` from `legacy-ungrounded`. Stored version 1 decisions remain valid. Legacy requests do not acquire invented historical evidence.

## Authority boundary

Approval may yield `authority: authorized` only for the permission request's exact capability and scope. This change introduces no execution, scheduling, polling, memory write, or canonical Soul mutation.

## Falsifiable invariant

A grounded authorization decision that loses or malforms its initiation grounding is invalid. Caller provenance that attempts to supply replacement trigger evidence or initiation grounding is rejected before decision creation.

# Agency permission request is not authorization

Date: 2026-09-06

## Decision

AI Soul distinguishes three concepts that must not collapse into one another:

1. **AgencyIntent** — the Soul has a reason-grounded proposal about something it may want to do.
2. **AgencyPermissionRequest** — that proposal is explicitly handed to governance as a request for permission.
3. **Authorization / execution** — a separate future decision and actuator boundary, not represented by either of the above.

An `AgencyPermissionRequest` is therefore always `status: pending` and `authority: none`.

## Why

A persistent Soul may eventually develop initiative, but initiative alone must never be interpreted as consent, authorization, scheduling, tool execution, or user interruption. The system needs a machine-checkable boundary where agency can become reviewable without becoming actionable.

This keeps AGENCY and GOVERNANCE composable: the Soul may formulate a reason and ask, while authority remains external to the intent/request objects.

## Invariants

- A permission request references a previously valid `AgencyIntent` and inherits its stable `soulId` and `intentId` linkage.
- Requested capability, scope, and justification are explicit and bounded.
- Permission requests contain provenance.
- Permission requests cannot carry approval, authorization, execution, scheduling, tool-call, or actuator payloads.
- Creating a request has no runtime side effect.

## Non-claim

This record does not define who may authorize an action, what consent UX should look like, or whether autonomous action should ever be allowed. It only establishes that asking for permission is structurally distinct from having permission.

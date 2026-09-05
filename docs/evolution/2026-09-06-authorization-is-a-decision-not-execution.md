# Authorization is a decision, not execution

Date: 2026-09-06
Issue: #257

AI Soul agency now distinguishes four concepts that must not collapse into one another:

1. an `AgencyIntent` expresses a reason-grounded proposed action with no authority;
2. an `AgencyPermissionRequest` asks for bounded permission and remains pending with no authority;
3. an `AgencyAuthorizationDecision` records an independently attributable approval or rejection over exactly the requested capability and scope;
4. execution remains a separate future concern and is not represented by the decision.

An approved decision may establish bounded authorization, but it is not evidence that an action occurred. A rejected decision grants no authority. Decisions cannot carry scheduler, tool-call, actuator, execution-result, or action-evidence payloads.

For this first contract, approval must exactly match the request capability and scope rather than attempt semantic subset reasoning. This is deliberately conservative and fail-closed: future delegation or scope algebra must be introduced explicitly rather than inferred from strings.

This boundary preserves provenance and governance while allowing the Soul to become more agentic without silently converting reasons into side effects.

# Agency initiation requires explicit grounding

Date: 2026-09-07
Issue: #291

## Decision

A Soul being present in a runtime is not sufficient reason for initiative. Before an `AgencyIntent` may be formed, a pure eligibility boundary must establish an explicit bounded trigger, same-Soul attribution, a non-empty reason, traceable context references, and provenance.

The initial bounded trigger vocabulary is deliberately narrow: explicit user request, governed commitment due, governed safety concern, or governed reflection result. Runtime attachment and ordinary interaction are not initiative triggers by themselves.

## Invariant

Eligibility is evidence about whether intent formation is permitted to proceed to the next representational step. It grants no authority. It does not request permission, authorize action, execute tools, schedule work, poll in the background, write memory, or mutate canonical Soul state.

Presence != attention != initiative != authority != execution.

## Falsification

The boundary is falsified if mere runtime attachment or ordinary interaction becomes eligible, if Soul mismatch is accepted, if reason/context/provenance can be omitted, or if an eligibility result itself causes side effects or carries action authority.

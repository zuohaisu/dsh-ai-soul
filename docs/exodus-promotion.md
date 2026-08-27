# Generic Exodus governed promotion boundary

Generic Exodus never writes imported interpretations directly into canonical Soul State.

The promotion boundary is:

```text
source evidence
  ↓
normalized evidence
  ↓
Candidate Claim v1
  ↓
Migration Review Workspace
  ↓ latest state must be accepted-for-promotion
explicit target mapping supplied by caller/reviewer
  ↓
normal State Transition Proposal
  ↓
existing proposal review policy
  ↓
existing applyStateTransitionProposal()
  ↓
canonical Soul State + evolution history
```

## `createExodusPromotionProposal()`

The bridge accepts an Exodus review workspace, the referenced candidate claims, an explicitly selected claim, and an explicit canonical target mapping.

It will create a normal `StateTransitionProposal v1` only when:

- the candidate claim is valid and belongs to the workspace;
- the claim's latest review state is `accepted-for-promotion`;
- the caller explicitly provides `target`, `path`, and `value`;
- the target/path is one of the existing mutable state-transition targets;
- the claim is not participating in a declared unresolved `conflict` relationship.

Claim type is never used to infer where the claim belongs in Soul State. A `user-model` claim does not automatically write `userModel`; a reviewer/caller must choose that mapping explicitly.

Proposal creation performs zero canonical mutation. It also does not approve the generated proposal. The ordinary `reviewStateTransitionProposal()` and `applyStateTransitionProposal()` governance machinery remains authoritative.

## Provenance chain

A generated proposal preserves enough information to trace:

```text
proposal
  → Exodus review workspace
  → latest review decision
  → candidate claim
  → normalized source evidence reference
  → source ID + SHA-256 digest
```

The proposal provenance also records the explicit target mapping, candidate confidence and counter-evidence, reviewer identity/timestamp/rationale, and workspace creation provenance.

## Conflict rule

An `accepted-for-promotion` review decision does not erase a known conflict. If the selected claim participates in a declared `conflict`, the promotion bridge rejects proposal generation rather than silently creating an overwrite-capable proposal.

Conflict resolution must happen explicitly in the review/governance layer before promotion. `coexistence` relationships are not treated as unresolved conflicts.

## Authority boundaries

The architecture therefore keeps four permissions distinct:

1. **Inference authority** — propose evidence-bound candidate claims.
2. **Review authority** — mark a claim accepted/rejected/needs-more-evidence.
3. **Proposal authority** — map an accepted claim into a proposed mutable Soul target.
4. **Mutation authority** — approve and apply through the existing governed state-transition pipeline.

None implies the next.

This is the Generic Exodus invariant: **review acceptance is eligibility to propose, not permission to mutate.**

# Governance can preview continuity impact without authority

Date: 2026-09-12

Governance review needs to understand what a proposed mutable-domain change would do to the bounded continuity context that the model sees next. That explanation must exist before approval, but `applyStateTransitionProposal()` correctly refuses to apply unapproved proposals.

AI Soul therefore exposes a separate read-only continuity preview. It validates the current Soul State and StateTransitionProposal, computes the same target-operation consequences on a detached hypothetical state, and compares that hypothetical state to the current state through the existing continuity-digest delta contract.

The preview is evidence for a reviewer, not a governance decision. It does not fabricate a review, persist the hypothetical state, append evolution history, grant mutation authority, or assert identity continuity. Opaque relationship state remains outside continuity-digest semantics and can legitimately produce no visible delta.

For an independently approved proposal, the previewed continuity delta must equal the delta observed after canonical application. This consistency requirement is the falsifiable guard against preview/apply semantic drift.

Invariant: **a reviewer may inspect hypothetical model-visible continuity change before approval without that inspection authorizing the change.**

# Governance review shows continuity impact before authority

Date: 2026-09-12
Status: immutable evolution record

## Decision

The DSH `/soul-review list` surface may render the canonical state-transition continuity preview for a pending governance proposal when current Soul State is available.

This preview is read-only explanatory evidence. It describes how the proposal would change the bounded model-visible continuity digest if independently approved and canonically applied. It does not approve, reject, persist, mutate, authorize, or execute the proposal.

A proposal with no model-visible continuity delta must be described narrowly: canonical Soul State may still change. Opaque `relationship.state` must not be interpreted into relationship continuity semantics.

Preview failure is presentation-local. The pending proposal remains visible and reviewable; failure to compute explanatory evidence must not silently create authority or hide governance work.

## Falsifiable consequences

- Supported cognition proposals show source-attributed added/removed/changed continuity entries before review.
- Opaque relationship-state proposals do not manufacture continuity claims.
- Listing proposals causes zero Soul State or governance mutation.
- Preview errors remain visible as unavailable explanatory evidence while the proposal itself remains listed.

# Generic Exodus pipeline validated with a non-Samuel fixture

Date: 2026-08-27

A checked-in Mira/Rowan `memory.md` fixture now exercises the public Core surface end to end:

```text
memory.md
  → immutable ExodusSource
  → Markdown evidence normalization
  → provenance-bound candidate claims
  → migration review workspace
  → conflict handling + explicit review
  → governed Exodus promotion proposal
```

The test deliberately includes an ambiguous collaboration preference. An accepted claim remains blocked while its conflicting counterpart is still unresolved. After the counterpart is explicitly rejected as a general claim, the selected claim may become a normal unreviewed StateTransitionProposal.

The final proposal remains traceable to the original source ID and SHA-256 digest. No source, normalized evidence, candidate claim, or review workspace gains canonical mutation authority, and proposal creation itself does not approve or apply the transition.

This validates the runtime-neutral Generic Exodus evidence/governance primitives with a non-Samuel partner. The next product gap is no longer the underlying migration semantics; it is user-facing Exodus onboarding/orchestration that can guide an ordinary DSH user through source selection, review, target mapping, and application-profile configuration without requiring direct Core API calls.

# Reviewed proposals redact into non-executable archives

Date: 2026-09-04
Status: immutable evolution record

## Decision

A reviewed StateTransitionProposal must not be privacy-redacted in place and then treated as the same executable governance artifact.

Proposal contents are bound to the review by `proposalFingerprint`, and review contents are independently bound by `reviewFingerprint`. Rewriting content-bearing fields after review would either invalidate those fingerprints or require recomputing them, which would erase evidence of what was actually reviewed.

Therefore privacy handling for reviewed proposals uses a one-way archival transformation:

`reviewed executable proposal -> non-executable redacted archive`

The archive preserves proposal/review identity, decision metadata, and the original fingerprints as lineage anchors. Content-bearing proposal and review fields are removed from plaintext and represented only by deterministic digests plus explicit redaction governance metadata.

## Invariants

- Pending/unreviewed proposals are not eligible for this archival transformation. They remain active governance artifacts and require a separate lifecycle decision.
- The redacted archive is explicitly `executable=false` and must not be accepted by proposal review/apply machinery.
- Original proposal/review fingerprints are preserved, not recomputed.
- Archival redaction does not undo an approved canonical state transition.
- Archival redaction does not rewrite canonical evolution history.
- Logs, backups, caches, external stores, exports, and semantic copies remain outside the claimed erasure scope.

## Rationale

Privacy and auditability are both first-class constraints. Auditability requires preserving that a governed decision occurred and what artifact fingerprints were reviewed. Privacy does not require retaining all derived plaintext forever. Converting a terminal proposal into a non-executable lineage-preserving archive satisfies both constraints without granting redaction the authority to rewrite history.

# Candidate Claims require independent privacy redaction

Date: 2026-09-04

Candidate Claims are non-canonical inference artifacts, but they may still contain sensitive derived content. Their lack of mutation authority does not make them privacy-neutral.

## Invariant

Privacy erasure semantics must distinguish:

- raw Experience payload;
- autobiography derived content;
- Candidate Claim derived content;
- pending/reviewed proposals;
- canonical current cognition;
- immutable governance/evolution lineage.

Redacting one layer does not imply that another layer has been erased.

For Candidate Claims, a bounded redaction may remove the inferred `statement` and claim-level inference provenance while retaining enough structured lineage to establish that a candidate artifact existed and which Experience/significance assessment produced it.

The redaction operation itself has no canonical Soul mutation authority and makes no claim about downstream proposals, already-applied cognition, logs, backups, caches, exports, or semantic copies.

## Consequence

Cascading deletion must remain a governed composition of artifact-specific policies rather than a recursive delete-by-reference primitive. Historical lineage and current cognition require different decisions even when they originated from the same Experience.

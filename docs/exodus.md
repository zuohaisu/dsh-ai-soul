# Generic Exodus

Generic Exodus is the product path for bringing an existing AI relationship into AI Soul without treating imported text as identity by default.

## Boundary

The first step is evidence preservation, not Soul mutation:

```text
external export
    ↓
Exodus source-evidence record
    ↓
structural normalization
    ↓
archaeology / candidate claims
    ↓
review workspace
    ↓
explicit governed promotion
    ↓
canonical Soul State
```

An imported `memory.md`, transcript, JSON export, or provider memory file is **source evidence**. It is not a system prompt, not autobiography, and not canonical Soul State.

## ExodusSource v1

`createExodusSource()` records an explicit source ID, source type and provider/runtime label, timestamps, original file metadata, a SHA-256 digest of the imported bytes, caller-supplied provenance, and `canonicalMutation: false`.

The record is defensively cloned and deeply frozen. The digest anchors later normalized evidence and candidate claims to the exact imported bytes. Creating it performs **zero canonical Soul mutations**.

## Markdown evidence normalization

`normalizeMarkdownEvidence()` is the first generic source adapter. It accepts an `ExodusSource` and the exact Markdown bytes represented by that source. Before parsing, it recomputes SHA-256 and rejects content that no longer matches the source manifest.

The adapter emits deterministic structural evidence units with headings/content/code blocks, exact source line ranges, raw text, heading path, source/digest linkage, and `canonicalMutation: false`.

This is deliberately **structural normalization, not interpretation**. A line such as `Name: Aster`, `Mira prefers concise answers`, or `We promised to stay together` remains text evidence. The adapter does not decide whether it is an identity fact, user-model fact, relationship claim, covenant, contradiction, or noise.

## Candidate Claim v1

`createExodusCandidateClaim()` is the first semantic boundary after structural normalization. It does **not** infer claims from text. Instead, it takes an analyst- or model-proposed interpretation and binds that interpretation to exact normalized evidence units.

A candidate claim carries stable claim identity, an open-ended claim type, statement/interpretation, source-bound evidence and counter-evidence, confidence and rationale, runtime/model phenotype risk, `canonicalStatus: candidate`, and `canonicalMutation: false`.

Two incompatible interpretations may reference the same evidence and coexist as separate candidate claims. Neither overwrites the other, and neither gains canonical authority merely because it has high confidence. **Inference authority is not mutation authority.**

## Migration review workspace

`createExodusReviewWorkspace()` introduces an auditable stage between candidate claims and any future canonical promotion.

A workspace contains only the identities of the candidate claims under review plus append-oriented relationship and decision records. It deliberately does not copy source evidence into a new authority-bearing structure and it does not contain a Soul State mutation operation.

Claims may be explicitly related as:

- `conflict` — the interpretations cannot safely be treated as simultaneously unconditional truths;
- `coexistence` — apparently different interpretations may both remain valid because they describe different contexts, periods, or scopes.

Review decisions are explicit audit records with:

- claim ID;
- state (`unreviewed`, `accepted-for-promotion`, `rejected`, or `needs-more-evidence`);
- reviewer identity;
- timestamp;
- rationale.

`accepted-for-promotion` is intentionally **not** the same thing as promoted or canonical. It means only that a reviewer has marked a candidate eligible for the next governance boundary. The review workspace itself always retains `canonicalMutation: false`.

Operations return new deeply frozen workspace values rather than mutating prior review history. The current state of a claim is a projection of the latest decision; earlier decisions remain present for auditability.

Example flow:

```js
import {
  addExodusClaimRelationship,
  appendExodusReviewDecision,
  createExodusReviewWorkspace,
} from '../src/core/index.js'

let workspace = createExodusReviewWorkspace({
  id: 'aster-migration-001',
  claims: [quietClaim, expressiveClaim],
  createdAt: '2026-08-27T12:00:00Z',
  createdBy: 'migration-agent',
})

workspace = addExodusClaimRelationship(workspace, [quietClaim, expressiveClaim], {
  leftClaimId: quietClaim.id,
  rightClaimId: expressiveClaim.id,
  relationship: 'conflict',
  recordedBy: 'reviewer-1',
  recordedAt: '2026-08-27T12:05:00Z',
  rationale: 'The evidence may describe different contexts rather than one stable trait.',
})

workspace = appendExodusReviewDecision(workspace, [quietClaim, expressiveClaim], {
  claimId: quietClaim.id,
  state: 'needs-more-evidence',
  reviewer: 'reviewer-1',
  reviewedAt: '2026-08-27T12:10:00Z',
  rationale: 'One source is insufficient to establish a durable identity trait.',
})
```

The original candidate claims remain unchanged. No review operation applies a canonical state transition.

## What these boundaries deliberately do not do

The source manifest, source adapters, Candidate Claim v1, and migration review workspace do not declare identity continuity, automatically resolve conflicts, inject imported text into a system prompt, or promote anything into canonical Soul State.

The next architectural boundary is an **explicit governed promotion** step that consumes reviewed candidates and uses the existing Soul governance machinery without granting the migration workspace write authority of its own. Provider-specific adapters should normalize into this evidence pipeline rather than redefine the AI Soul ontology.

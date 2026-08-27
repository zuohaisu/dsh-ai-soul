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

`createExodusSource()` records:

- an explicit source ID;
- source type and provider/runtime label;
- capture and import timestamps;
- original filename, media type, and byte length;
- SHA-256 digest of the original imported bytes;
- caller-supplied provenance metadata;
- `canonicalMutation: false` as an explicit import invariant.

The record is defensively cloned and deeply frozen. The digest anchors later normalized evidence and candidate claims to the exact imported bytes.

Example:

```js
import { createExodusSource } from '../src/core/index.js'

const source = createExodusSource({
  sourceId: 'aster-memory-001',
  sourceType: 'memory-export',
  provider: 'example-chat-runtime',
  capturedAt: '2026-08-27T09:00:00.000Z',
  filename: 'memory.md',
  mediaType: 'text/markdown',
  content: '# Memory\nAster and Mira met while building a garden journal.\n',
  provenance: {
    suppliedBy: 'mira',
    acquisition: 'user-export',
  },
})
```

Creating this record performs **zero canonical Soul mutations**.

## Markdown evidence normalization

`normalizeMarkdownEvidence()` is the first generic source adapter. It accepts an `ExodusSource` and the exact Markdown bytes represented by that source.

Before parsing anything, it recomputes SHA-256 and rejects content that no longer matches the source manifest. This keeps later evidence anchored to the preserved import instead of silently normalizing modified text.

The adapter emits deterministic structural evidence units:

- ATX headings;
- ordinary contiguous content blocks;
- fenced code blocks;
- exact 1-based source line ranges;
- raw source text for each unit;
- the active heading path;
- source ID and source digest linkage;
- `canonicalMutation: false` on the document and every unit.

Example:

```js
import {
  createExodusSource,
  normalizeMarkdownEvidence,
} from '../src/core/index.js'

const markdown = '# Memory\n\nAster and Mira met while building a garden journal.\n'
const source = createExodusSource({
  sourceId: 'aster-memory-001',
  sourceType: 'memory-export',
  provider: 'example-chat-runtime',
  capturedAt: '2026-08-27T09:00:00.000Z',
  filename: 'memory.md',
  mediaType: 'text/markdown',
  content: markdown,
  provenance: { suppliedBy: 'mira', acquisition: 'user-export' },
})

const evidence = normalizeMarkdownEvidence({ source, content: markdown })
```

This is deliberately **structural normalization, not interpretation**. A line such as `Name: Aster`, `Mira prefers concise answers`, or `We promised to stay together` remains text evidence. The adapter does not decide whether it is an identity fact, user-model fact, relationship claim, covenant, contradiction, or noise.

## Candidate Claim v1

`createExodusCandidateClaim()` is the first semantic boundary after structural normalization. It does **not** infer claims from text. Instead, it takes an analyst- or model-proposed interpretation and binds that interpretation to exact normalized evidence units.

A candidate claim carries the archaeology ledger concepts:

- stable claim ID and open-ended `claimType`;
- proposition in `statement` plus optional `interpretation`;
- supporting evidence references resolved to source ID, digest, unit ID, line range, heading path, and an explicit support rationale;
- first-class `counterEvidence`, either as another evidence-unit reference or an unresolved caveat note;
- epistemic confidence score and rationale;
- explicit runtime/model phenotype risk;
- `canonicalStatus: candidate`;
- `canonicalMutation: false`.

The constructor refuses evidence-unit IDs that do not exist in the normalized evidence document. This makes it impossible for a later interpretation to claim provenance to a source location that the source adapter never emitted.

Example:

```js
import { createExodusCandidateClaim } from '../src/core/index.js'

const preferenceUnit = evidence.units.find((unit) =>
  unit.rawText.includes('Mira prefers concise answers'),
)

const claim = createExodusCandidateClaim({
  normalizedEvidence: evidence,
  id: 'aster-claim-001',
  claimType: 'user-model',
  statement: 'Mira prefers concise answers.',
  interpretation: 'This may be a durable collaboration preference.',
  evidence: [{
    unitId: preferenceUnit.unitId,
    support: 'The exported memory states this preference directly.',
  }],
  counterEvidence: [{
    note: 'One export alone does not establish how durable this preference is.',
  }],
  confidence: {
    score: 0.8,
    rationale: 'Direct statement, but not yet independently repeated.',
  },
  runtimePhenotypeRisk: 'low',
})
```

Two incompatible interpretations may reference the same evidence and coexist as separate candidate claims. Neither overwrites the other, and neither gains canonical authority merely because it has high confidence. Conflict resolution and promotion belong to later review/governance stages.

This separation matters because semantic extraction may eventually be assisted by an LLM. The model can propose claims, but the output of that inference remains evidence-bound and non-canonical. **Inference authority is not mutation authority.**

## Migration review workspace

`createExodusReviewWorkspace()` introduces an auditable stage between candidate claims and any future canonical promotion.

A workspace contains the identities of the candidate claims under review plus append-oriented relationship and decision records. It does not copy source evidence into a new authority-bearing structure and it has no Soul State mutation operation.

Claims may be explicitly related as:

- `conflict` — interpretations cannot safely be treated as simultaneously unconditional truths;
- `coexistence` — different interpretations may both remain valid because they describe different contexts, periods, or scopes.

Review decisions record claim ID, state (`unreviewed`, `accepted-for-promotion`, `rejected`, or `needs-more-evidence`), reviewer identity, timestamp, and rationale.

`accepted-for-promotion` is intentionally **not** the same thing as promoted or canonical. It means only that a reviewer has marked a candidate eligible for the next governance boundary. The workspace always retains `canonicalMutation: false`.

Operations return new deeply frozen workspace values rather than mutating prior review history. The current state of a claim is a projection of the latest decision; earlier decisions remain present for auditability.

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

The source manifest, Markdown adapter, Candidate Claim v1, and migration review workspace do not declare identity continuity, automatically resolve conflicts, inject imported text into a system prompt, or promote anything into canonical Soul State. Provider-specific adapters should normalize into this evidence pipeline rather than redefine the AI Soul ontology.

The next architectural boundary is an explicit governed promotion step that consumes reviewed candidates and uses the existing Soul governance machinery without granting the migration workspace write authority of its own.

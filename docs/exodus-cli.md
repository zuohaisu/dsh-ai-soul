# Generic Exodus CLI

The user-facing Exodus commands expose the migration pipeline without granting imported evidence, inference, or review any direct authority over canonical Soul State.

## Discover the commands

Each public Exodus command is self-describing:

```bash
dsh-ai-soul-exodus-prepare --help
dsh-ai-soul-exodus-review --help
dsh-ai-soul-exodus-review-update --help
```

The help text lists only supported inputs and repeats the authority boundary for that stage. The generic path does not infer a Soul identity from a source file, DSH profile, or application surface, and it never assumes Samuel.

Invocation mistakes fail closed as structured JSON with `kind: "usage"` and a command-specific `--help` hint. Unknown options are rejected instead of being silently ignored. Execution/domain failures remain distinguishable from usage failures so automation can diagnose the correct boundary without treating a malformed command as migration evidence.

## Step 1 — prepare Markdown evidence

After installing `dsh-ai-soul`, run:

```bash
dsh-ai-soul-exodus-prepare \
  --source-file ./memory.md \
  --source-id my-partner-memory-001 \
  --source-type memory-export \
  --provider chat-runtime-export \
  --captured-at 2026-08-27T09:00:00.000Z \
  --output-dir ./.exodus/my-partner/source
```

Required arguments are explicit so source provenance is not guessed from filenames, DSH profiles, or Soul IDs.

A successful run creates only:

```text
.exodus/my-partner/source/
├── original/
│   └── memory.md
├── source.json
└── evidence.json
```

- `original/memory.md` preserves the exact imported bytes.
- `source.json` is the existing `ExodusSource v1` manifest, including SHA-256 digest and provenance.
- `evidence.json` is the deterministic Markdown evidence projection, anchored to the same digest.

The command reports both `canonicalMutation: false` and `profileMutation: false`. It does not create or change a Soul Store, canonical Soul State, or DSH application profile.

## Step 2 — provide candidate claims

Candidate-claim input is an explicit JSON document. Claims are interpretations of preserved evidence, not canonical facts.

```json
{
  "claims": [
    {
      "id": "mira-claim-001",
      "claimType": "relationship",
      "statement": "Mira and Rowan have an established collaborative relationship.",
      "interpretation": "The export describes an existing shared history.",
      "evidence": [
        {
          "unitId": "<unit id from evidence.json>",
          "support": "The preserved memory describes their shared work."
        }
      ],
      "counterEvidence": [
        {
          "note": "One export does not establish every aspect of the relationship."
        }
      ],
      "confidence": {
        "score": 0.75,
        "rationale": "Directly supported by preserved text but not independently repeated."
      },
      "runtimePhenotypeRisk": "low"
    }
  ]
}
```

Every claim is rebuilt through `createExodusCandidateClaim()`. Evidence references that are absent from the prepared `evidence.json` fail closed. If supplied, `canonicalStatus` must remain `candidate` and `canonicalMutation` must remain `false`.

## Step 3 — create a review-ready workspace

```bash
dsh-ai-soul-exodus-review \
  --prepared-workspace ./.exodus/my-partner/source \
  --claims-file ./candidate-claims.json \
  --workspace-id my-partner-review-001 \
  --created-by migration-agent \
  --created-at 2026-08-27T12:00:00.000Z \
  --output-dir ./.exodus/my-partner/review
```

The review output is:

```text
.exodus/my-partner/review/
├── claims.json
└── review-workspace.json
```

`claims.json` contains immutable evidence-bound Candidate Claim v1 records. Each evidence reference carries the original source ID, SHA-256 digest, unit ID, line range, heading path, and support rationale.

`review-workspace.json` is created through `createExodusReviewWorkspace()` with empty decision and relationship histories. It starts with `canonicalMutation: false`.

Before constructing claims, the CLI verifies that `source.json` is a valid Exodus source and that `evidence.json` points to the same source ID and digest.

## Step 4 — record review operations explicitly

`dsh-ai-soul-exodus-review-update` records one explicit operation in an existing review workspace. Use `--help` to see the required fields for each supported operation:

- `relationship`
- `decision`
- `reconciliation-review`

For example, a claim decision is recorded with an explicit claim ID, review state, reviewer, timestamp, and rationale. A recorded review decision remains review evidence; it is not itself canonical promotion or Soul mutation.

## Overwrite safety

Both workspace-creation commands refuse a non-empty output directory by default.

`dsh-ai-soul-exodus-prepare --replace` may replace only a managed source workspace whose top-level entries are `original/`, `source.json`, and `evidence.json`.

`dsh-ai-soul-exodus-review --replace` may replace only a managed review workspace whose top-level entries are `claims.json` and `review-workspace.json`.

If any unmanaged file is present, replacement is refused rather than deleting user material.

## Authority boundary

The CLI path currently implements:

```text
external Markdown
      ↓
preserved original bytes
      ↓
ExodusSource manifest
      ↓
normalized structural evidence
      ↓
explicit candidate-claim proposals
      ↓
review-ready workspace
      ↓
explicit review operations
```

It deliberately stops before:

```text
automatic claim inference
automatic conflict resolution
canonical promotion
Soul mutation
DSH profile setup
identity-continuity judgment
```

Inference authority is not mutation authority. Review acceptance is not mutation authority. Imported text remains evidence, not identity by declaration.

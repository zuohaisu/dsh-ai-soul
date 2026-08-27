# Lifecycle import into an existing Soul

External evidence ingestion is a repeatable Soul lifecycle operation. A Soul may begin through Genesis, accumulate its own history, and later receive external memories or transcripts without restarting onboarding or replacing its identity.

The first lifecycle-import boundary binds one import workspace to an explicit existing Soul and freezes the target Soul state that existed when the import began.

```text
existing Soul
    +
external Markdown
    ↓
dsh-ai-soul-import-prepare
    ↓
import workspace
├── evidence/
│   ├── original/
│   ├── source.json
│   └── evidence.json
├── target.json
└── target-baseline.json
```

Example:

```bash
dsh-ai-soul-import-prepare \
  --source-file ./memory.md \
  --source-id aster-external-001 \
  --source-type memory-export \
  --provider chat-runtime-export \
  --captured-at 2026-08-20T00:00:00.000Z \
  --soul-store ./.dsh-ai-soul/souls \
  --target-soul-id aster \
  --output-dir ./.imports/aster-001
```

The command requires `--target-soul-id`; identity is never inferred from the source filename, DSH profile, or output directory. The target Soul must already exist and pass normal Soul State validation before any import workspace is installed.

`target-baseline.json` is a frozen snapshot of the target Soul at import preparation time. `target.json` records the explicit Soul binding and a SHA-256 digest of that snapshot. If the live Soul continues evolving afterward, the import baseline does not move with it. Later reconciliation can therefore distinguish:

- what the Soul canonically contained when import started;
- what the external source claimed;
- what the Soul learned or changed after import preparation.

This preparation step has no mutation authority:

```text
canonicalMutation: false
profileMutation: false
```

The existing Generic Exodus source/evidence normalization path is reused under `evidence/`; lifecycle import does not create a competing import ontology.

## Reconciliation against the frozen baseline

A later import stage may compare one validated candidate claim with one explicit target path in the frozen baseline using `createLifecycleImportReconciliation()`.

The caller must choose the target path and proposed value explicitly. Claim type does not determine Soul ontology automatically.

The reconciliation record verifies the exact `target-baseline.json` SHA-256 from `target.json` before reading it, then reports only a structural comparison state:

```text
absent     target path did not exist in the frozen baseline
equal      baseline value and proposed value are structurally equal
different  both exist but are structurally different
```

`different` is deliberately **not** equivalent to `conflict`. A difference may represent a genuine contradiction, a compatible later fact, predecessor history, another identity, or unresolved uncertainty. Those semantic judgments belong in the existing review/governance layer.

The reconciliation record remains evidence for review only:

```text
canonicalMutation: false
```

It does not alter the candidate claim, baseline, live Soul, or DSH profile, and it does not create or apply a state-transition proposal.

## Semantic review of reconciliation

A validated reconciliation can be attached to the existing Exodus review workspace with `appendExodusReconciliationReview()`.

The reviewer chooses an explicit semantic disposition:

```text
conflict        imported claim contradicts the reviewed baseline context
coexistence     both representations may validly coexist
uncertain       evidence is insufficient to decide
not-applicable  the comparison should not affect this target Soul/path
```

No disposition is inferred from the structural comparison. In particular:

```text
different ≠ conflict
```

The review record preserves the reconciliation ID, claim ID, target Soul ID, frozen baseline digest, target path, structural comparison, reviewer, timestamp, and rationale. Reconciliation reviews are append-only alongside existing claim relationships and claim review decisions.

One review workspace cannot silently mix reconciliation records from different target Souls or different frozen baseline digests. That boundary prevents evidence from separate lifecycle-import contexts from becoming indistinguishable during review.

This stage still has no canonical mutation authority:

```text
reconciliation → structural evidence
review          → semantic interpretation
proposal/apply  → governed mutation boundary
```

A reviewer deciding `conflict`, `coexistence`, `uncertain`, or `not-applicable` does not itself modify Soul State and does not automatically create a state-transition proposal.

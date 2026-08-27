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

After candidate claims have been prepared in a normal review workspace, a user can create a reconciliation record without writing JavaScript:

```bash
dsh-ai-soul-import-reconcile \
  --import-dir ./.imports/aster-001 \
  --review-dir ./.imports/aster-001/review \
  --claim-id claim-001 \
  --reconciliation-id reconcile-001 \
  --target-path '["identity","name"]' \
  --proposed-value '"Nova"' \
  --rationale 'Compare imported name evidence with the frozen baseline.' \
  --recorded-by rowan \
  --recorded-at 2026-08-28T01:00:00.000Z
```

`--target-path` and `--proposed-value` are explicit JSON values. Claim type never selects the Soul path automatically.

The command reads `target.json`, verifies the exact SHA-256 of `target-baseline.json`, loads the selected validated claim from `review/claims.json`, and writes an immutable reconciliation record under:

```text
reconciliations/<reconciliation-id>.json
```

It reports only one structural comparison state:

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

A validated reconciliation can then be attached to the existing review workspace through the published review-update CLI:

```bash
dsh-ai-soul-exodus-review-update \
  --review-dir ./.imports/aster-001/review \
  --operation reconciliation-review \
  --reconciliation-file ./.imports/aster-001/reconciliations/reconcile-001.json \
  --disposition uncertain \
  --reviewer rowan \
  --reviewed-at 2026-08-28T01:10:00.000Z \
  --rationale 'A different imported name does not establish identity replacement.'
```

The reviewer chooses one explicit semantic disposition:

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

## Create a governed promotion proposal

Once the selected candidate claim's latest review state is explicitly `accepted-for-promotion`, the user can create a normal StateTransitionProposal without writing JavaScript:

```bash
dsh-ai-soul-import-promote \
  --import-dir ./.imports/aster-001 \
  --review-dir ./.imports/aster-001/review \
  --claim-id claim-001 \
  --target userModel \
  --path userModel \
  --value '{"preference":"concise collaboration updates","source":"external-import"}' \
  --proposer rowan \
  --proposal-id proposal-aster-001 \
  --at 2026-08-28T01:20:00.000Z
```

`--target`, `--path`, and `--value` are explicit. The CLI does not infer a mutable Soul domain from claim type, source schema, Soul ID, DSH profile, or reconciliation result. The existing Generic Exodus promotion boundary remains authoritative, so unreviewed, rejected, `needs-more-evidence`, and unresolved-conflict claims fail closed.

The proposal is persisted under:

```text
proposals/<proposal-id>.json
```

Its provenance remains traceable through the normal chain:

```text
StateTransitionProposal
  ↓
review decision
  ↓
candidate claim
  ↓
normalized source evidence
```

For lifecycle import, proposal provenance additionally retains the explicit target Soul ID and the frozen baseline digest/capture metadata from `target.json`. This keeps the proposal tied to the import context that produced it even if the live Soul later changes.

Creating the proposal still performs no canonical mutation and no profile mutation:

```text
accepted-for-promotion ≠ approved
proposal creation       ≠ apply
canonicalMutation: false
profileMutation: false
```

The resulting file must still pass the normal `reviewStateTransitionProposal()` and `applyStateTransitionProposal()` governance path before canonical Soul State can change. Lifecycle import does not create a second mutation authority.

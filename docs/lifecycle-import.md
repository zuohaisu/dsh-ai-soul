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

This slice does **not** decide whether imported history belongs to the current Soul, detect semantic conflicts automatically, generate canonical mutations, or configure a DSH application profile. Those remain later governed stages.

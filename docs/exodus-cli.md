# Generic Exodus CLI — Prepare Markdown Evidence

The first user-facing Exodus command prepares an inspectable local evidence workspace from a Markdown or `memory.md` export. It deliberately stops before semantic claim extraction, review, promotion, Soul creation, or DSH profile configuration.

## Command

After installing `dsh-ai-soul`, run:

```bash
dsh-ai-soul-exodus-prepare \
  --source-file ./memory.md \
  --source-id my-partner-memory-001 \
  --source-type memory-export \
  --provider chat-runtime-export \
  --captured-at 2026-08-27T09:00:00.000Z \
  --output-dir ./.exodus/my-partner
```

Required arguments are explicit so source provenance is not guessed from filenames, DSH profiles, or Soul IDs.

## Workspace layout

A successful run creates only:

```text
.exodus/my-partner/
├── original/
│   └── memory.md
├── source.json
└── evidence.json
```

- `original/memory.md` preserves the exact imported bytes.
- `source.json` is the existing `ExodusSource v1` manifest, including SHA-256 digest and provenance.
- `evidence.json` is the existing deterministic Markdown evidence projection, anchored to the same digest.

The command reports both `canonicalMutation: false` and `profileMutation: false`. It does not create or change a Soul Store, canonical Soul State, or DSH application profile.

## Overwrite safety

The command refuses a non-empty output directory by default.

To deliberately regenerate a workspace created by this command:

```bash
dsh-ai-soul-exodus-prepare \
  --source-file ./memory.md \
  --source-id my-partner-memory-001 \
  --source-type memory-export \
  --provider chat-runtime-export \
  --captured-at 2026-08-27T09:00:00.000Z \
  --output-dir ./.exodus/my-partner \
  --replace
```

`--replace` is intentionally narrow: it only replaces a directory whose top-level entries are managed Exodus preparation outputs (`original/`, `source.json`, and `evidence.json`). If any unmanaged file is present, replacement is refused rather than deleting user material.

## Boundary

This command implements only:

```text
external Markdown
      ↓
preserved original bytes
      ↓
ExodusSource manifest
      ↓
normalized structural evidence
```

It does **not** implement:

```text
claim inference
review decisions
canonical promotion
Soul mutation
DSH profile setup
identity-continuity judgment
```

Those remain separate governed steps. Imported text is evidence, not identity by declaration.

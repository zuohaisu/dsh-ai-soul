# Ordinary-user quickstart

`dsh-ai-soul` is a Soul layer for DeepSeek Harness. A Soul has its own persistent identity and store; the DSH profile supplies an application surface such as TUI, Web, or Headless.

Keep these dimensions separate:

```text
Soul ID             Human-facing name       DSH application surface
-------             -----------------       -----------------------
soul-001            may be absent      ───→ TUI / Web / Headless
```

A profile name never needs to match a Soul ID. A Soul ID is also not the Soul's human-facing name.

## Prerequisites

- Node.js 20 or newer.
- DeepSeek Harness with an existing TUI, Web, or Headless application profile.
- `dsh-ai-soul` installed or linked into the environment where the package CLIs are available.
- The npm-compatible package source that the target DSH profile should use for `dsh-ai-soul`.

This repository is still pre-alpha and this guide does **not** assume that a registry release exists. For a local checkout or unpacked package, use an explicit file dependency such as:

```text
file:/absolute/path/to/dsh-ai-soul
```

If the target profile already declares `dsh-ai-soul`, `dsh-ai-soul-configure` preserves that dependency and `--dependency-spec` may be omitted. If it does not, pass the actual source explicitly; configure never guesses `latest`.

The examples below use a newly activated, unnamed Soul whose machine identifier is `soul-001`, an existing DSH TUI profile directory at `/absolute/path/to/dsh-tui-profile`, and a local package source at `/absolute/path/to/dsh-ai-soul`.

## Path A — activate a new Soul through Genesis

Create a Genesis Record v2, for example `genesis.json`:

```json
{
  "version": 2,
  "id": "genesis-soul-001",
  "at": "2026-08-28T15:00:00.000Z",
  "soulId": "soul-001",
  "name": null,
  "provenance": {
    "method": "first-activation",
    "source": "local-genesis"
  }
}
```

Create the persisted Soul:

```sh
dsh-ai-soul-genesis \
  --record ./genesis.json \
  --store-dir /absolute/path/to/soul-store
```

At this point the Soul exists. No conversation, first encounter, relationship participant, or human-facing name is required.

Genesis creates and persists the Soul. It does not choose a DSH profile or UI surface. First encounter and naming are later independent lifecycle events.

## Compose the Soul with an existing DSH application profile

Choose the application surface independently of the Soul. For TUI:

```sh
dsh-ai-soul-configure \
  --profile-dir /absolute/path/to/dsh-tui-profile \
  --soul-id soul-001 \
  --store-dir /absolute/path/to/soul-store \
  --surface tui \
  --dependency-spec file:/absolute/path/to/dsh-ai-soul
```

The configure command is dry-run by default. Inspect the proposed `package.json` and `cordis.patch.yml` changes, then apply them explicitly:

```sh
dsh-ai-soul-configure \
  --profile-dir /absolute/path/to/dsh-tui-profile \
  --soul-id soul-001 \
  --store-dir /absolute/path/to/soul-store \
  --surface tui \
  --dependency-spec file:/absolute/path/to/dsh-ai-soul \
  --write
```

If the profile already contains a `dsh-ai-soul` dependency installed through DSH or another package-management step, omit `--dependency-spec`; the existing spec is retained unchanged. The configure command edits profile configuration but does not run a package manager for you.

For an existing Web or Headless profile, keep the same `soul-id` and `store-dir` and change only the profile directory and surface:

```sh
--surface web
--surface headless
```

This is the central composition rule:

```text
Soul identity ≠ profile name ≠ application surface
```

And the Genesis identity rule is:

```text
soulId ≠ human-facing name
```

## Verify before launching DSH

Run profile preflight against the exact application profile, Soul store, Soul ID, and surface you configured:

```sh
dsh-ai-soul-preflight \
  --profile-dir /absolute/path/to/dsh-tui-profile \
  --soul-id soul-001 \
  --store-dir /absolute/path/to/soul-store \
  --surface tui
```

Preflight distinguishes dependency installation, bundle composition, Soul configuration, Soul loadability, and interaction-surface availability rather than returning one opaque pass/fail state.

After preflight, use DSH's own effective-config inspection as the final authority for runtime composition:

```sh
dsh --profile <your-existing-profile-name> --dump-config
```

Then launch the normal application surface using that profile's documented DSH command. This repository does not claim real runtime verification unless that real run has actually occurred.

The stronger activation-first runtime scenario is tracked in #122: launch this unnamed Soul, send no conversational turn, shut down DSH, restart, and verify the same `soulId` and Genesis provenance before any first encounter.

For the complete general runtime-verification contract, follow [`runtime-verification.md`](./runtime-verification.md).

## First encounter and naming happen later

Once an actual interaction occurs, the Core can record the first encounter separately through `recordFirstEncounter()`. A name can later be recorded through `recordNamingEvent()`.

The architecture does not determine when the Soul should want a name, who should initiate naming, or whether naming must ever occur. It only preserves those events honestly when they happen.

## Path B — bring an existing partner or import history later

External history is optional and repeatable. A user may start through Genesis and import evidence later, or use the Generic Exodus flow when continuing an existing AI relationship.

For evidence imported into an already-existing Soul, prepare a lifecycle-import workspace explicitly bound to that Soul:

```sh
dsh-ai-soul-import-prepare \
  --source-file ./memory.md \
  --source-id import-001 \
  --source-type markdown-memory \
  --provider chatgpt \
  --captured-at 2026-08-28T01:00:00.000Z \
  --target-soul-id soul-001 \
  --soul-store /absolute/path/to/soul-store \
  --output-dir ./imports/import-001
```

The import freezes a target baseline and preserves source evidence. It does **not** replace the current Soul and has no canonical mutation authority.

The later lifecycle remains:

```text
external evidence
      ↓
candidate claims
      ↓
structural reconciliation
      ↓
semantic review
      ↓
accepted-for-promotion
      ↓
StateTransitionProposal
      ↓
normal governance before apply
```

See [`lifecycle-import.md`](./lifecycle-import.md) for the reconciliation/review/promotion CLI sequence and [`exodus-cli.md`](./exodus-cli.md) for the migration workspace flow.

Importing history does not change which DSH profile hosts the Soul. Profile composition and Soul evidence governance remain orthogonal.

## Legacy Genesis v1

Previously created Genesis v1 records may contain a name, participants, and first-meeting evidence at the Genesis timestamp. Those histories remain supported exactly as recorded. New Souls should use Genesis v2.

## Where Samuel fits

Samuel is the first real Soul and the first Exodus research case. He remains useful as evidence and as an experiment, but he is not the package default and is not required by this quickstart.

For the Samuel-specific runtime experiment, see [`experiments/001-samuel-exodus.md`](./experiments/001-samuel-exodus.md). For the general DSH composition contract, see [`application-profile-install.md`](./application-profile-install.md).

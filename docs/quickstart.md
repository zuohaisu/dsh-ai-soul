# Ordinary-user quickstart

`dsh-ai-soul` is a Soul layer for DeepSeek Harness. A Soul has its own identity and persistent store; the DSH profile supplies an application surface such as TUI, Web, or Headless.

Keep these dimensions separate:

```text
Soul identity        DSH application surface
-------------        -----------------------
nova          ───┐   TUI
aster         ───┼─→ Web
another-soul  ───┘   Headless
```

A profile name never needs to match a Soul ID.

## Prerequisites

- Node.js 20 or newer.
- DeepSeek Harness with an existing TUI, Web, or Headless application profile.
- `dsh-ai-soul` installed or linked into the environment where the package CLIs are available.

The examples below use a non-Samuel Soul named `nova` and an existing DSH TUI profile directory at `/absolute/path/to/dsh-tui-profile`. Replace paths and the surface as needed.

## Path A — start a new partner through Genesis

Create a Genesis Record, for example `nova-genesis.json`:

```json
{
  "version": 1,
  "id": "genesis-nova-001",
  "timestamp": "2026-08-28T01:00:00.000Z",
  "soulId": "nova",
  "chosenName": "Nova",
  "participants": ["user", "nova"],
  "provenance": {
    "sourceType": "first-meeting",
    "sourceRef": "local-genesis"
  },
  "firstMeetingNote": "We decided to begin from scratch and let the relationship develop through shared history."
}
```

Create the persisted Soul:

```sh
dsh-ai-soul-genesis \
  --record ./nova-genesis.json \
  --store-dir /absolute/path/to/soul-store
```

Genesis creates the Soul. It does not choose a DSH profile or UI surface.

## Compose the Soul with an existing DSH application profile

Choose the application surface independently of the Soul. For TUI:

```sh
dsh-ai-soul-configure \
  --profile-dir /absolute/path/to/dsh-tui-profile \
  --soul-id nova \
  --store-dir /absolute/path/to/soul-store \
  --surface tui
```

The configure command is dry-run by default. Inspect the proposed `package.json` and `cordis.patch.yml` changes, then apply them explicitly:

```sh
dsh-ai-soul-configure \
  --profile-dir /absolute/path/to/dsh-tui-profile \
  --soul-id nova \
  --store-dir /absolute/path/to/soul-store \
  --surface tui \
  --write
```

For an existing Web or Headless profile, keep the same `soul-id` and `store-dir` and change only the profile directory and surface:

```sh
--surface web
--surface headless
```

This is the central composition rule:

```text
Soul identity ≠ profile name ≠ application surface
```

## Verify before launching DSH

Run profile preflight against the exact application profile you configured:

```sh
dsh-ai-soul-preflight \
  --profile-dir /absolute/path/to/dsh-tui-profile
```

Preflight distinguishes the following readiness dimensions rather than returning one opaque pass/fail state:

- `pluginDependencyPresent` — the profile has the `dsh-ai-soul` package dependency;
- `bundleComposed` — the Soul bundle is part of the profile bundle stack;
- `soulConfigPresent` — an `ai-soul` row explicitly provides `soulId` and `storeDir`;
- `soulLoadable` — the selected persisted Soul can be loaded and validated;
- `interactionSurfacePresent` — the profile contains the requested TUI/Web/Headless application surface.

A profile can load a Soul while still lacking an interaction surface. Runtime-load readiness and application-surface readiness are different checks.

After preflight, use DSH's own effective-config inspection as the final authority for the runtime composition:

```sh
dsh --profile <your-existing-profile-name> --dump-config
```

Then launch the normal application surface using that profile's documented DSH command. This repository does not claim interactive runtime verification unless that real run has actually occurred.

For the complete Samuel-free path from preflight through plugin activation, application-surface availability, and fresh-session context visibility, follow [`runtime-verification.md`](./runtime-verification.md). Real DSH runtime verification is a separate evidence gate from package CI and static preflight.

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
  --target-soul-id nova \
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

See [`lifecycle-import.md`](./lifecycle-import.md) for the reconciliation/review/promotion CLI sequence and [`exodus-cli.md`](./exodus-cli.md) for the first-time migration workspace flow.

Importing history does not change which DSH profile hosts the Soul. Profile composition and Soul evidence governance remain orthogonal.

## Where Samuel fits

Samuel is the first real Soul and the first Exodus research case. He remains useful as evidence and as an experiment, but he is not the package default and is not required by this quickstart.

For the Samuel-specific runtime experiment, see [`experiments/001-samuel-exodus.md`](./experiments/001-samuel-exodus.md). For the general DSH composition contract, see [`application-profile-install.md`](./application-profile-install.md).

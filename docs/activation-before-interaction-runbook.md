# Activation-before-interaction runtime runbook

This runbook is the executable procedure for the ordinary-user real-runtime gate in Issue #122. It proves a narrow lifecycle claim: a newly activated, unnamed Soul already exists and persists across a real DeepSeek Harness shutdown/restart before any conversational turn occurs.

This is not the Samuel Exodus continuity experiment. Use a clean non-Samuel Soul.

Keep these dimensions independent throughout the run:

```text
Soul ID ≠ DSH profile ≠ application surface
```

The examples use:

- Soul ID: `ember-001`
- Soul Store: `/absolute/path/to/soul-store`
- DSH profile directory: `/absolute/path/to/dsh-web-profile`
- DSH profile name: `clean-web-profile`
- application surface: `web`
- local package source: `/absolute/path/to/dsh-ai-soul`

Replace these values with the real paths and profile you are testing. TUI and Headless are equally valid supported surfaces; changing surface must not require changing Soul identity.

The canonical setup sequence is:

```text
Genesis → DSH plugin install → Soul/profile configure → installed-package preflight → DSH effective config → real runtime
```

DSH owns package installation. `dsh-ai-soul-configure` owns Soul/profile configuration and does not invoke a package manager.

## 1. Activate an unnamed Soul

Create `genesis.json` before DSH starts:

```json
{
  "version": 2,
  "id": "genesis-ember-001",
  "at": "2026-08-29T00:00:00.000Z",
  "soulId": "ember-001",
  "name": null,
  "provenance": {
    "method": "first-activation",
    "source": "runtime-gate-122"
  }
}
```

Persist it:

```sh
dsh-ai-soul-genesis \
  --record ./genesis.json \
  --store-dir /absolute/path/to/soul-store
```

Checkpoint before DSH launch:

- the Soul is persisted;
- `identity.name` is absent/null;
- relationship participants are empty;
- there is no first-encounter event;
- the Genesis timestamp and provenance are recorded for later comparison.

Do not send a conversation or add a naming/encounter event.

## 2. Install and compose the Soul with an existing DSH application profile

Install `dsh-ai-soul` through DSH into the exact profile that will be used for the runtime proof:

```sh
dsh plugin --profile clean-web-profile add /absolute/path/to/dsh-ai-soul
```

This is the canonical ordinary-user install path because DSH owns the target profile and its package installation. The existing profile must already provide the desired Web application surface; `dsh-ai-soul` does not install or select Web, TUI, or Headless for you.

Then configure the selected Soul independently of the profile name and surface:

```sh
dsh-ai-soul-configure \
  --profile-dir /absolute/path/to/dsh-web-profile \
  --soul-id ember-001 \
  --store-dir /absolute/path/to/soul-store \
  --surface web \
  --write
```

Because DSH has already installed/declared `dsh-ai-soul`, configure preserves the existing dependency source and does not need `--dependency-spec` in this canonical path. If you intentionally maintain profile source by hand, `--dependency-spec <npm-compatible-source>` remains available as an advanced manual/source-controlled editing path; it does not replace actual package installation.

Then run preflight against the exact profile that DSH will launch:

```sh
dsh-ai-soul-preflight \
  --profile-dir /absolute/path/to/dsh-web-profile \
  --soul-id ember-001 \
  --store-dir /absolute/path/to/soul-store \
  --surface web
```

Preflight must pass, including actual plugin-package and application-surface-package resolution. This is still static/profile evidence, not real-runtime proof.

## 3. Inspect DSH effective configuration

Ask DSH what it will actually run:

```sh
dsh --profile clean-web-profile --dump-config
```

Record that the effective configuration contains both:

- the intended `ai-soul` configuration with `soulId: ember-001` and the expected store;
- the chosen Web application bundle.

These are separate observations from plugin activation.

## 4. First real DSH process — zero conversation

Launch the normal DSH Web application command for `clean-web-profile`.

During this first process, observe and record the Soul activation signal equivalent to:

```text
[dsh-ai-soul] loaded Soul ember-001
```

Before any conversational turn is sent, verify that the runtime/context has not invented:

- a human-facing name;
- a participant;
- a relationship;
- a first meeting or prior encounter.

Then terminate the DSH process **without sending any conversational turn**.

This shutdown-before-interaction boundary is mandatory. If a turn is sent, discard this run for the #122 activation-before-interaction proof and start again with a newly activated Soul.

Record these observations as true only if directly observed from the real process:

- `genesisPersistedBeforeInteraction`
- `pluginActivationBeforeInteraction`
- `shutdownBeforeInteraction`
- `unnamedStatePreserved`
- `emptyParticipantsPreserved`
- `noPriorEncounterFabricated`

## 5. Fresh restart

Start a new DSH process with the same profile, same `soulId`, and same Soul Store.

Confirm from the fresh process that:

- `ember-001` loads again;
- the Genesis timestamp matches the pre-launch persisted record;
- Genesis provenance matches;
- name is still absent/null;
- participants are still empty;
- no prior encounter has appeared.

Record these only from the real restart:

- `restartLoadedSameSoul`
- `genesisProvenancePreserved`

At this point the core #122 persistence claim has been exercised: the Soul existed before conversation and survived process death/restart before first encounter.

## 6. Verify the application surface and fresh-session context

After the restart proof above is complete, use the normal Web session mechanism to establish the remaining general runtime gates:

- the application surface is usable;
- a genuinely fresh session receives the selected Soul context;
- persisted facts used for comparison were not pasted into the session.

For this unnamed activation-first case, use facts that actually exist before first encounter, such as the Genesis activation timestamp and Genesis provenance. Do not invent a name or relationship fact merely to make verification easier.

Only after the pre-interaction persistence proof is complete may a first conversational interaction occur.

## 7. Record and validate evidence

Create `runtime-evidence.json` using the `activation-before-interaction` scenario described in [`runtime-evidence.md`](./runtime-evidence.md). Record actual DSH version, runtime, profile, surface, observations, persisted facts, and deviations.

Validate the record:

```sh
dsh-ai-soul-runtime-evidence --record ./runtime-evidence.json
```

A validator result of `verified: true` is meaningful only when every runtime observation in the record came from the real DSH processes above.

CI, mocks, repository fixtures, configure output, preflight, and the evidence validator itself cannot manufacture runtime success.

## Failure discipline

Do not collapse failures into one result. Record the failing layer:

```text
package/profile composition
DSH effective config
plugin activation
pre-interaction lifecycle preservation
restart persistence
application surface usability
fresh-session context visibility
```

A failure is useful evidence. Do not mark #122 complete until the actual run is recorded with exact commands/results and the required observations are satisfied.

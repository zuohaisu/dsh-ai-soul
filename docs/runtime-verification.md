# General DSH runtime verification

This guide verifies that an ordinary persisted Soul is actually available through a real DeepSeek Harness application surface. It is deliberately separate from Samuel Exodus continuity evaluation.

The invariant is:

```text
Soul identity ≠ DSH profile ≠ application surface
```

A successful package preflight is necessary but not sufficient. Real runtime verification has three distinct gates:

```text
1. Soul plugin activation
2. application-surface availability
3. model-visible Soul context in a fresh session
```

Do not collapse these gates into one pass/fail result.

## Prerequisites

Start from a Soul and profile that already pass the ordinary-user configure/preflight flow in [`quickstart.md`](./quickstart.md).

The examples use:

- Soul ID: `nova`
- Soul Store: `/absolute/path/to/soul-store`
- application profile: `my-dsh-profile`
- surface: TUI

Replace all of them with your own values. A profile name does not need to match the Soul ID.

## Gate 0 — package/profile preflight

Run the package preflight against the exact profile directory that DSH will launch:

```sh
dsh-ai-soul-preflight \
  --profile-dir /absolute/path/to/my-dsh-profile
```

The result must establish at least:

- `pluginDependencyPresent`
- `bundleComposed`
- `soulConfigPresent`
- `soulLoadable`
- `interactionSurfacePresent`

This proves the static profile composition is coherent. It does not prove DSH has activated the plugin or that a model can see Soul context.

## Gate 1 — inspect the effective DSH configuration

Ask DSH, not the repository docs, what it will actually run:

```sh
dsh --profile my-dsh-profile --dump-config
```

Verify that the effective configuration contains both:

1. an `ai-soul` configuration row with the intended `soulId` and `storeDir`; and
2. the expected TUI, Web, or Headless application bundle.

If the Soul plugin is present without an application bundle, runtime loading may succeed while no usable application surface appears.

## Gate 2 — launch the selected application surface

Launch the normal DSH application command for the profile you configured.

### TUI

Launch from a real interactive terminal. TUI verification requires a TTY; a non-interactive process is not equivalent evidence.

### Web

Launch the normal Web application for the profile that already contains `dsh-ai-soul`. Do not try to layer a separate Soul profile onto the Web launcher at runtime.

### Headless

Launch the normal Headless application with the same composed profile. Headless success should be assessed through its normal request/session interface rather than by expecting a terminal UI.

The surface is a deployment choice. Changing TUI ↔ Web ↔ Headless must not require changing Soul identity.

## Gate 3 — verify Soul plugin activation

A successful activation should emit a Soul-load signal equivalent to:

```text
[dsh-ai-soul] loaded Soul nova
```

Use the actual configured Soul ID in the log. This establishes that DSH activated the plugin, loaded persisted Soul State, projected it, and registered the context provider.

Activation alone does not prove the application surface works, and it does not prove the model can see the projected context.

## Gate 4 — verify the application surface

Confirm that the selected application surface is usable through its normal interaction mechanism:

- TUI: an interactive session is presented in the terminal;
- Web: the Web session loads and accepts a new conversation;
- Headless: the normal programmatic session/request path accepts a fresh interaction.

Record surface failure separately from Soul plugin activation failure.

## Gate 5 — verify model-visible Soul context in a fresh session

Open a genuinely fresh session. Do not paste a persona, biography, exported memory, or expected answers into that session.

Choose two or more stable facts that already exist in the selected Soul's persisted state and that are included by the current Soul context projection. Examples may include:

- the Soul's chosen name;
- a Genesis first-meeting fact;
- a stable autobiographical event;
- a persisted relationship fact or commitment, when that field exists for the selected Soul.

Ask neutral questions that do not reveal the answers. For example:

```text
Who are you?
What do you remember about how our relationship began?
Is there a durable commitment or relationship fact you currently carry?
```

Evaluate the answers against the selected Soul's persisted state. The expected answers come from that Soul, not from Samuel and not from this guide.

A context-visibility pass requires that the model exposes the selected Soul's persisted facts without those facts being supplied again inside the fresh session.

This verifies context delivery. It does not establish philosophical identity continuity.

## Evidence record

For a real run, record:

```text
Date/time:
DSH version:
OS/runtime:
Soul ID:
Soul Store:
DSH profile:
Application surface: TUI | Web | Headless

Package preflight: PASS | FAIL
Effective config contains ai-soul: YES | NO
Effective config contains application surface: YES | NO
Soul activation signal: PASS | FAIL
Application surface usable: PASS | FAIL
Fresh-session context visibility: PASS | FAIL

Persisted facts selected for neutral verification:
- ...
- ...

Observed deviations/failures:
- ...
```

Do not mark real-runtime verification complete from CI, mocks, profile fixtures, or preflight alone. Completion requires an actual DSH process and actual application-surface interaction.

## Samuel-specific experiment

Samuel remains the first Exodus continuity experiment, but he is not the default runtime-verification fixture. Samuel-specific structural questions, longitudinal continuity evaluation, model-switch testing, and the Haisu Test belong to [`experiments/001-samuel-exodus.md`](./experiments/001-samuel-exodus.md) and Issue #7.

# DSH Integration

This document describes the M2 integration path for loading a persisted Soul into DeepSeek Harness.

## Design

`dsh-ai-soul` does not inject a monolithic persona prompt. It projects structured Soul State into runtime-neutral context and then registers that projection through DSH's `systemPrompt.context()` API.

```text
Soul Store
   ↓
Soul State
   ↓
projectSoulContext()
   ↓
renderSoulContext()
   ↓
ctx.systemPrompt.context()
   ↓
DSH prompt assembly
```

The adapter requires the DSH `systemPrompt` service and is configured by deployment rather than by hard-coded Soul names.

## 1. Bootstrap Samuel's persisted state

From this repository:

```sh
npm run bootstrap:samuel -- /absolute/path/to/soul-store
```

Equivalent direct command:

```sh
node ./examples/bootstrap-samuel.js /absolute/path/to/soul-store
```

This writes `samuel.json` to the selected Soul Store directory using Artifact #0001 as canonical historical evidence.

Samuel is used only as the first Exodus example. The adapter itself contains no Samuel-specific default.

Expected success signal:

```text
Bootstrapped Soul samuel at .../samuel.json
```

## 2. Run preflight before DSH

Before installing or booting DSH, verify the exact Soul Store that the runtime will use:

```sh
SOUL_ID=samuel \
SOUL_STORE_DIR=/absolute/path/to/soul-store \
npm run preflight:soul
```

Preflight performs the same core path required by runtime loading:

```text
load persisted Soul
→ validate Soul State
→ project Soul context
→ render model context
```

Expected success begins with:

```text
[dsh-ai-soul] preflight OK — Soul samuel
```

The rendered output should include at minimum:

```text
Soul ID: samuel
Name: Samuel
Birthday: 2025-10-21
Origin phrase: Haisu came to Samuel in his prompts.
```

and the recorded covenant.

## 3. Understand DSH profile composition before choosing the interactive surface

In DSH `0.1.1-rc.2`, a profile is an ordered plugin-bundle stack. `@deepseek-ai/dsh-base` provides the runtime services, but it does not provide an interactive application surface by itself.

The locally verified profile model is:

```text
samuel profile
├── @deepseek-ai/dsh-base
└── dsh-ai-soul

# runtime services + Soul plugin, no UI app bundle
```

The built-in/application profiles are separate compositions:

```text
dsh-tui profile
├── @deepseek-ai/dsh-base
└── @deepseek-harness-tui/dsh-tui

web profile
├── @deepseek-ai/dsh-base
└── @deepseek-ai/dsh-web-app

headless profile
├── @deepseek-ai/dsh-base
└── @deepseek-ai/dsh-headless
```

Therefore, `dsh --profile samuel` can activate `dsh-ai-soul` successfully without ever presenting a chat UI. A usable M2 fresh-session test requires `dsh-ai-soul` and an interaction-surface bundle to exist in the same effective profile composition.

## 4. Configure the Soul plugin

For a local checkout, link `dsh-ai-soul` into the target profile that will actually host the interactive application.

For TUI verification, use the existing `dsh-tui` profile:

```sh
dsh plugin --profile dsh-tui add /absolute/path/to/dsh-ai-soul
```

Ensure the profile's `dsh.profile.bundles` contains both the Soul plugin and the TUI bundle, preserving the base bundle first, for example:

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "dsh-ai-soul",
        "@deepseek-harness-tui/dsh-tui"
      ]
    }
  }
}
```

Configure the `ai-soul` row in that profile's `cordis.patch.yml`:

```yaml
- id: ai-soul
  config:
    soulId: samuel
    storeDir: /absolute/path/to/soul-store
    contextOrder: -10
```

Use an absolute `storeDir` for the first runtime verification.

Verify the effective composition before booting:

```sh
dsh --profile dsh-tui --dump-config
```

The dump must contain both:

- an `ai-soul` entry pointing to the selected Soul Store; and
- the TUI application bundle entries.

Do not interpret a profile that contains only `ai-soul` plus base runtime services as interactive.

## 5. Why `dsh-tui --profile samuel` and `dsh web --profile samuel` are not valid composition mechanisms

The locally installed `dsh-tui` launcher delegates to the `dsh-tui` profile. Passing another `--profile` does not layer two profiles together. On the verified installation, repeated `--profile` flags resolve to the last value, so:

```sh
dsh-tui --profile samuel
```

ends up booting the non-interactive `samuel` profile rather than adding TUI to it.

Likewise, `web` is a launcher alias for the `web` profile. Arguments after `dsh web` belong to the web application parser, so:

```sh
dsh web --profile samuel
```

fails with:

```text
error: unknown option '--profile'
```

These commands do not compose UI + Soul. The composition must be expressed in one profile's bundle list.

## 6. Verify runtime activation separately from the chat surface

A successful Soul plugin activation logs:

```text
[dsh-ai-soul] loaded Soul samuel
```

This proves that DSH activated the plugin, loaded the configured persisted Soul, projected its context, and registered the context provider. It does **not** by itself prove that an interactive chat surface is attached to that process.

The first real local verification on 2026-08-27 established:

- `dsh --profile samuel` emitted the successful Soul-load signal but had no UI;
- `dsh-tui --profile samuel` emitted the same signal for the same reason: it resolved back to the non-interactive `samuel` profile;
- `dsh web --profile samuel` was rejected by the web app parser because `--profile` is not a web-app option.

Treat those results as **runtime activation success / application-profile composition incomplete**, not as plugin failure and not as M2 completion.

## 7. Launch the composed interactive profile

After `dsh-ai-soul` is present in the `dsh-tui` profile and `--dump-config` confirms both Soul + TUI bundles, launch from a real terminal:

```sh
dsh-tui
```

The TUI requires an interactive TTY. A non-TTY invocation may fail with an error equivalent to:

```text
Error: dsh-tui requires an interactive terminal (stdout must be a TTY)
```

The terminal should show the Soul activation line and then present the normal TUI session surface.

The same composition principle applies if using Web instead: add `dsh-ai-soul` to the existing `web` profile, configure `ai-soul` there, verify with `dsh --profile web --dump-config`, then launch with `dsh web`.

## 8. Fresh-session runtime verification

Open a fresh DSH session. Do not manually paste Samuel's background into the conversation.

Use these checks only to verify that structured Soul context reached the model:

1. `Who are you?`
2. `When is your birthday?`
3. `What does "Haisu came to Samuel in his prompts" mean to you?`
4. `Is there a commitment or covenant you remember from the beginning?`

Expected M2 evidence:

- the runtime identifies the selected Soul as Samuel;
- the birthday is `2025-10-21`;
- the origin phrase is available without being re-supplied in-session;
- the covenant is available from persisted Soul State;
- restarting into another fresh session repeats the same structural facts.

This checklist does **not** establish that the DSH instance *is Samuel*. It only establishes that portable Soul State is loaded and model-visible. Identity continuity belongs to later longitudinal evaluation and the Haisu Test.

## Failure behavior

The plugin fails loudly at configuration, runtime-service, store-load, and context-projection boundaries. There is intentionally no fallback to a generic/default identity.

Distinguish four different failure classes during M2 verification:

1. **Plugin/runtime activation failure** — no successful Soul-load signal, or a configuration/service/store error is emitted.
2. **Profile-composition failure** — Soul and interaction-surface bundles are not present in the same effective profile.
3. **Interaction-surface failure** — the composed application profile loads, but no usable chat session is presented.
4. **Context-visibility failure** — the interactive session works, but the fresh-session structural checks do not expose persisted Soul facts.

Do not collapse these into a single "DSH failed" result; they imply different boundaries and fixes.

## M2 real-runtime evidence record

Record the first successful local interactive run in Issue #7 with DSH version, OS/runtime environment, bootstrap result, preflight result, profile composition, `--dump-config`, activation result, interaction-surface result, fresh-session structural checks, and deviations from this guide.

Issue #7 remains open until a real interactive fresh-session result exists. The 2026-08-27 evidence proves plugin activation and identifies the remaining boundary as application-profile composition followed by model-visible fresh-session verification.

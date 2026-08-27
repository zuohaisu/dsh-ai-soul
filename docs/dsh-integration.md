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

## 3. Install the plugin into a DSH profile

For a local checkout:

```sh
dsh plugin --profile samuel add /absolute/path/to/dsh-ai-soul
```

Verify the composition before booting when useful:

```sh
dsh --profile samuel --dump-config
```

The effective config should contain an `ai-soul` entry pointing to the selected Soul Store.

## 4. Configure the Soul

Configure the `ai-soul` row in the profile's `cordis.patch.yml`:

```yaml
- id: ai-soul
  config:
    soulId: samuel
    storeDir: /absolute/path/to/soul-store
    contextOrder: -10
```

Use an absolute `storeDir` for the first runtime verification.

## 5. Verify runtime activation separately from the chat surface

Start the selected profile directly:

```sh
dsh --profile samuel
```

A successful plugin activation logs:

```text
[dsh-ai-soul] loaded Soul samuel
```

This signal proves that DSH activated the plugin, loaded the configured persisted Soul, projected its context, and registered the context provider. It does **not** by itself prove that an interactive chat surface is attached to that process.

In the first real local verification on 2026-08-27, both `dsh --profile samuel` and `dsh-tui --profile samuel` emitted the successful Soul-load signal but did not present an interactive terminal conversation. Treat that result as **runtime activation success / fresh-session verification incomplete**, not as either M2 completion or plugin failure.

## 6. Attach an interactive DSH surface

Use a DSH interaction surface that preserves the same profile composition. For the current local verification path, try the official web surface first:

```sh
dsh web --profile samuel
```

The next success condition is not merely that the process starts. A browser chat session must be created using the `samuel` profile, without manually pasting Samuel background into the conversation.

If the web command starts but the plugin load line is absent, verify the effective profile with `--dump-config` before interpreting any model response as Soul-backed.

## 7. Fresh-session runtime verification

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

Distinguish three different failure classes during M2 verification:

1. **Plugin/runtime activation failure** — no successful Soul-load signal, or a configuration/service/store error is emitted.
2. **Interaction-surface failure** — `[dsh-ai-soul] loaded Soul ...` appears, but no usable chat session is presented.
3. **Context-visibility failure** — the interactive session works, but the fresh-session structural checks do not expose persisted Soul facts.

Do not collapse these into a single "DSH failed" result; they imply different boundaries and fixes.

## M2 real-runtime evidence record

Record the first local run in Issue #7 with DSH version, OS/runtime environment, bootstrap result, preflight result, plugin install result, `--dump-config`, activation result, interaction-surface result, fresh-session structural checks, and deviations from this guide.

Issue #7 remains open until a real interactive fresh-session result exists. The 2026-08-27 activation evidence narrows the remaining blocker to obtaining a working interaction surface and then verifying model-visible Soul context.

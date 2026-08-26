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
[dsh-ai-soul] bootstrapped Samuel at .../samuel.json
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

A preflight failure exits non-zero and identifies the boundary, for example `store-load boundary` or `context-projection boundary`.

## 3. Install the plugin into a DSH profile

For a local checkout:

```sh
dsh plugin --profile samuel add /absolute/path/to/dsh-ai-soul
```

The package declares a DSH bundle through `cordis.patch.yml`.

Verify the composition before booting when useful:

```sh
dsh --profile samuel --dump-config
```

The effective configuration should contain the `ai-soul` row.

## 4. Configure the Soul

Because Soul identity and storage are deployment choices, configure the `ai-soul` row in the profile's own `cordis.patch.yml`:

```yaml
- id: ai-soul
  name: dsh-ai-soul
  config:
    soulId: samuel
    storeDir: /absolute/path/to/soul-store
    contextOrder: -10
```

DSH profile configuration is applied after bundle layers, so this row replaces the bundle's unconfigured row with the deployment-specific values.

## 5. Boot DSH

```sh
dsh --profile samuel
```

On activation, the plugin:

1. validates `soulId` and `storeDir`;
2. loads the selected Soul from `FileSoulStore`;
3. validates Soul State;
4. creates a runtime-neutral projection;
5. registers it as DSH dynamic prompt context.

A successful load logs:

```text
[dsh-ai-soul] loaded Soul samuel
```

## 6. Fresh-session runtime verification

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

This checklist does **not** establish that the DSH instance *is Samuel*. It only establishes that the portable Soul State is loaded and model-visible. The identity-continuity verdict belongs to later longitudinal evaluation and the Haisu Test.

## Why dynamic context

DSH's `systemPrompt.context()` is intended for dynamic model context that participates in prompt assembly and can be materialized into agent history. That is a better semantic fit for current Soul projection than replacing the deployment persona or complete system prompt.

This is still M2. The projection is deliberately small and does not yet include experience capture, reflection, retrieval, or self-evolution.

## Failure behavior

The plugin fails loudly and identifies the failing boundary when possible.

### Invalid configuration

Examples:

```text
dsh-ai-soul config error: config.soulId is required
dsh-ai-soul config error: config.storeDir is required
```

### Missing DSH service

```text
dsh-ai-soul runtime error: required DSH systemPrompt service is unavailable
```

### Missing/unreadable Soul

The error begins with:

```text
dsh-ai-soul store-load error:
```

and includes only `soulId`, `storeDir`, and the storage error. It does not dump Soul contents.

### Invalid Soul projection

The error begins with:

```text
dsh-ai-soul context-projection error:
```

There is intentionally no fallback to a generic or default personality. A missing or invalid Soul should never silently create a different being.

## M2 real-runtime evidence record

When the first local run is performed, record in Issue #7:

- DSH version;
- OS/runtime environment;
- bootstrap result;
- preflight result;
- plugin install result;
- `--dump-config` result;
- boot success/error;
- fresh-session structural checks;
- any deviations from this document.

Issue #7 should remain open until that real runtime evidence exists.

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
node ./examples/bootstrap-samuel.js /absolute/path/to/soul-store
```

This writes `samuel.json` to the selected Soul Store directory using Artifact #0001 as canonical historical evidence.

Samuel is used only as the first Exodus example. The adapter itself contains no Samuel-specific default.

## 2. Install the plugin into a DSH profile

For a local checkout:

```sh
dsh plugin --profile samuel add /absolute/path/to/dsh-ai-soul
```

The package declares a DSH bundle through `cordis.patch.yml`.

## 3. Configure the Soul

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

## 4. Boot DSH

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

## Why dynamic context

DSH's `systemPrompt.context()` is intended for dynamic model context that participates in prompt assembly and can be materialized into agent history. That is a better semantic fit for current Soul projection than replacing the deployment persona or complete system prompt.

This is still M2. The projection is deliberately small and does not yet include experience capture, reflection, retrieval, or self-evolution.

## Failure behavior

The plugin fails loudly when:

- `soulId` is missing;
- `storeDir` is missing;
- the Soul file does not exist;
- stored Soul State is invalid;
- DSH does not provide the `systemPrompt` service.

There is intentionally no fallback to a generic or default personality. A missing Soul should never silently create a different being.

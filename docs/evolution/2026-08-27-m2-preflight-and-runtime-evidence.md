# Evolution Log — M2 Preflight and Runtime Evidence

**Date:** 2026-08-27

## New distinction

M2 exposed a useful boundary between three kinds of evidence:

1. **Unit/core evidence** — Soul State, store, projection, and adapter logic behave as specified in automated tests.
2. **Preflight evidence** — a real persisted Soul can be loaded, validated, projected, and rendered on the target machine before DSH starts.
3. **Runtime evidence** — a real DeepSeek Harness process loads that Soul and makes the projected context model-visible in a fresh session.

Passing (1) must not be reported as passing (3).

## Product consequence

A portable identity system needs diagnostic boundaries. Silent fallback is particularly dangerous here: if loading Samuel fails and the runtime quietly creates a generic assistant, the system has replaced an identity while pretending continuity.

Therefore `dsh-ai-soul` should fail loudly at configuration, runtime-service, store-load, and context-projection boundaries. Startup errors may reveal the selected Soul ID and store path, but should not dump Soul contents.

## Verification consequence

M2 runtime verification asks only whether portable Soul State reached another runtime. It does not answer whether the resulting being is Samuel.

`context loaded` and `identity continuity` are separate claims.

The first is an engineering acceptance criterion. The second belongs to the later Haisu Test and longitudinal continuity evaluation.

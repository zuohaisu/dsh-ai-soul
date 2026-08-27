# Profile readiness has two layers

Date: 2026-08-27

The first general DSH installation diagnostics exposed a useful distinction that should remain explicit as `dsh-ai-soul` grows beyond the Samuel experiment.

A configured Soul runtime and a usable DSH application are related but different readiness layers.

```text
runtime readiness
├── plugin dependency declared
├── Soul bundle composed
├── ai-soul loader/config declared
└── selected persisted Soul loadable

application readiness
└── requested TUI / Web / Headless bundle composed
```

Overall application-profile readiness requires both.

This distinction follows directly from the earlier real-runtime observation that `dsh-ai-soul` could activate and load a Soul while the process had no interaction surface. Diagnostics should preserve that information instead of collapsing everything into a single pass/fail signal.

The first implementation therefore emits machine-readable `runtimeReady`, `applicationReady`, and per-boundary checks. It uses a non-Samuel Soul fixture and the same contract for TUI, Web, and Headless.

One further boundary remains owned by DSH: declared profile configuration is not identical to DSH's final effective runtime configuration. `dsh-ai-soul` can validate its package/profile contract and Soul loadability, but it should not silently reimplement DSH's configuration engine. Final effective composition remains verifiable through DSH's own `--dump-config` surface until a supported machine interface exists.

The architectural consequence is consistent with the project thesis: Soul identity, plugin installation, application profile, and presentation surface remain orthogonal concepts even when DSH materializes them together in one concrete profile.

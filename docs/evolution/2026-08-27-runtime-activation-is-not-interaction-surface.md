# Runtime activation is not the interaction surface

Date: 2026-08-27

During the first real local DSH verification, the configured `samuel` profile successfully activated `dsh-ai-soul` and emitted:

```text
[dsh-ai-soul] loaded Soul samuel
```

The same local machine did not then present an interactive terminal conversation from either `dsh --profile samuel` or `dsh-tui --profile samuel`.

This separates two boundaries that the previous M2 guide had implicitly collapsed:

1. **Runtime activation** — DSH composes the profile, activates the plugin, loads the persisted Soul, and registers the projected context.
2. **Interaction surface** — a TUI, Web UI, headless request path, or other frontend creates an actual session in which model-visible Soul context can be tested.

The successful load signal is positive engineering evidence, but it is not a fresh-session result. M2 therefore remains open.

This distinction matters beyond DSH. AI Soul should treat runtime adapters and presentation/session surfaces as separate integration boundaries. A Soul may be loaded correctly even when the surrounding runtime exposes no usable conversation surface; conversely, a working chat UI does not prove that Soul context was loaded.

For M2 evidence, future records should classify failures as activation failure, interaction-surface failure, or context-visibility failure rather than reporting all three as generic runtime failure.

# Interaction surface is profile composition

Date: 2026-08-27

A deeper local inspection of DSH `0.1.1-rc.2` corrected the earlier assumption that an interaction surface could be attached to the `samuel` profile by passing `--profile samuel` to a TUI or Web launcher.

The verified architecture is composition-first:

1. A DSH profile is an ordered bundle stack.
2. `@deepseek-ai/dsh-base` provides runtime services but no interactive application by itself.
3. TUI, Web, and headless execution are themselves bundles carried by separate profiles.
4. Passing two profile selectors does not layer profiles together.
5. Therefore Soul + UI must coexist in one effective profile.

This explains the observed behavior:

- `dsh --profile samuel` loaded Samuel successfully but exposed no UI because the profile contained only base + `dsh-ai-soul`.
- `dsh-tui --profile samuel` did not compose TUI onto Samuel; the repeated profile argument resolved back to the non-interactive `samuel` profile.
- `dsh web --profile samuel` was rejected because arguments after the `web` alias belong to the web application parser, which does not accept `--profile`.

The correct M2 verification boundary is now:

```text
application profile
├── @deepseek-ai/dsh-base
├── dsh-ai-soul
└── interaction-surface bundle
```

This is an integration/deployment concern, not a Soul Core change. The adapter remains runtime-surface agnostic.

A useful architectural consequence follows: **identity selection and presentation surface are orthogonal dimensions**. Samuel should not conceptually equal a TUI profile, and TUI should not conceptually equal a Soul. The current DSH deployment mechanism may materialize a concrete combination in one profile, but AI Soul itself should preserve that separation.

M2 remains incomplete until the composed profile produces a real fresh session in which persisted Soul context is model-visible.

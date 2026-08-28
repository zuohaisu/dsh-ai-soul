# DSH profile configure diagnostics

`dsh-ai-soul-configure` and `dsh-ai-soul-preflight` share one readiness and diagnostic contract.

The configure command first plans the profile changes, then runs the same profile preflight logic against that planned composition. Its JSON output therefore includes the same compatibility fields and actionable diagnostics:

- `ready`
- `runtimeReady`
- `applicationReady`
- `checks`
- `diagnostics`
- `errors`

A configuration plan that successfully composes the Soul layer but targets an application surface that is absent from the profile is not a Soul failure. For example, requesting `web` against a TUI-only profile reports `application-surface-missing` with a hint to add `@deepseek-ai/dsh-web-app`.

The configure command does not infer Soul identity, install missing application bundles, or replace DSH's effective-config verification. It only projects the same installation facts that `dsh-ai-soul-preflight` reports, so automation and humans can use one stable set of diagnostic codes across configure and verify flows.

See `docs/application-profile-install.md` for the complete profile/Soul/surface composition model.

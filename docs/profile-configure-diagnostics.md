# DSH profile configure diagnostics

`dsh-ai-soul-configure` and `dsh-ai-soul-preflight` share the same composition vocabulary, but they answer two different points in the install flow.

The configure command plans profile changes and evaluates whether the **planned files** declare the Soul dependency, compose the Soul bundle, configure the requested Soul/store, and retain the requested application surface. Its JSON output includes:

- `ready`
- `runtimeReady`
- `applicationReady`
- `checks`
- `diagnostics`
- `errors`

That planning result intentionally does not prove that a package manager has installed the declared dependency. `dsh-ai-soul-configure --write` edits `package.json` and `cordis.patch.yml`; it does not run npm, pnpm, yarn, or the DSH plugin installer.

After writing configuration and installing dependencies, run `dsh-ai-soul-preflight` against the actual profile directory. Directory preflight adds the `pluginPackageInstalled` check and resolves `dsh-ai-soul` from the target profile. If `package.json` declares the dependency but the package is not actually resolvable, preflight returns:

```text
code: plugin-package-not-installed
check: pluginPackageInstalled
```

This prevents a declared-but-uninstalled dependency from being mistaken for runtime readiness.

A configuration plan that successfully composes the Soul layer but targets an application surface that is absent from the profile is not a Soul failure. For example, requesting `web` against a TUI-only profile reports `application-surface-missing` with a hint to add `@deepseek-ai/dsh-web-app`.

Neither command infers Soul identity from the DSH profile or application surface. Soul identity, profile composition, dependency installation, and TUI/Web/Headless surface remain separate configuration facts.

See `docs/application-profile-install.md` for the complete profile/Soul/surface composition model.

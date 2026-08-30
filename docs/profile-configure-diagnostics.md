# DSH profile configure diagnostics

`dsh-ai-soul-configure` and `dsh-ai-soul-preflight` share the same composition vocabulary, but they answer two different points in the install flow.

The configure command plans profile changes and evaluates whether the **planned files** declare the Soul dependency, compose the Soul bundle, configure the requested Soul/store, and retain the requested application surface. Its JSON output includes:

- `ready`
- `runtimeReady`
- `applicationReady`
- `checks`
- `diagnostics`
- `errors`

That planning result intentionally does not prove that a package manager has installed the declared dependencies. `dsh-ai-soul-configure --write` edits `package.json` and `cordis.patch.yml`; it does not run npm, pnpm, yarn, or the DSH plugin installer.

DSH initializes a new profile patch as the root empty sequence `[]`. Configure replaces that placeholder with the `ai-soul` entry sequence. If `[]` already coexists with profile entries, configure fails closed and preflight reports:

```text
code: profile-patch-invalid
check: patchDocumentValid
```

This prevents a line-oriented configuration match from being mistaken for a DSH-parseable patch document.

After writing configuration and installing dependencies, run `dsh-ai-soul-preflight` against the actual profile directory. Directory preflight verifies two independent installation facts:

- `pluginPackageInstalled` resolves `dsh-ai-soul` from the target profile.
- `applicationSurfacePackageInstalled` resolves the requested TUI/Web/Headless bundle from the same profile.

If `package.json` declares the Soul dependency but the package is not actually resolvable, preflight returns:

```text
code: plugin-package-not-installed
check: pluginPackageInstalled
```

If the requested application bundle is composed but its package is not resolvable, preflight returns:

```text
code: application-surface-package-not-installed
check: applicationSurfacePackageInstalled
```

This prevents declared-but-uninstalled packages from being mistaken for startup readiness. The Soul package affects `runtimeReady`; the requested application package affects `applicationReady`, so failures remain attributable to the correct axis.

A configuration plan that successfully composes the Soul layer but targets an application surface that is absent from the profile is not a Soul failure. For example, requesting `web` against a TUI-only profile reports `application-surface-missing` with a hint to add `@deepseek-ai/dsh-web-app`.

Preflight is still a startup-time static check. Successful package resolution does **not** prove that a real DSH process activated the plugin, served the surface, or exposed Soul context in a fresh session; those observations belong to the runtime-evidence gate.

Neither command infers Soul identity from the DSH profile or application surface. Soul identity, profile composition, dependency installation, and TUI/Web/Headless surface remain separate configuration facts.

See `docs/application-profile-install.md` for the complete profile/Soul/surface composition model.

# DSH application-profile install contract

`dsh-ai-soul` is a Soul layer, not an application surface. A usable DSH composition must contain both the Soul plugin and one application surface in the same profile.

```text
selected Soul + dsh-ai-soul + DSH application surface
```

The profile name, Soul ID, plugin identity, and surface are separate concepts:

- **profile** — the DSH bundle composition that is booted;
- **Soul ID** — the persisted AI identity selected by `ai-soul.config.soulId`;
- **plugin** — `dsh-ai-soul`, which loads and projects the selected Soul;
- **surface** — TUI, Web, or Headless application bundle.

A profile named `web` can host Soul `aster`; a profile named `dsh-tui` can host Soul `samuel`. Naming a profile after the Soul is neither required nor sufficient.

## Supported application bundles

| Surface | Bundle | Typical launch |
| --- | --- | --- |
| TUI | `@deepseek-harness-tui/dsh-tui` | `dsh --profile dsh-tui` |
| Web | `@deepseek-ai/dsh-web-app` | `dsh web` |
| Headless | `@deepseek-ai/dsh-headless` | `dsh --profile headless ...` |

Web and Headless are shipped DSH profiles that can auto-initialize from DSH templates. The currently recognized TUI bundle is an out-of-tree application bundle, so its containing profile must already exist and include that bundle before `dsh-ai-soul` can compose into it. `dsh-ai-soul` does not provide or install a TUI implementation.

The exact launcher behavior is owned by DSH. Current DSH exposes `dsh` as the supported Node application launcher, including for named out-of-tree profiles. The invariant owned by `dsh-ai-soul` is that the target profile must compose the Soul plugin and the desired application bundle together.

## Installation contract

Given an existing application profile `<profile>` and a persisted Soul `<soul-id>`:

```sh
dsh plugin --profile <profile> add /absolute/path/to/dsh-ai-soul
```

The resulting profile package must declare the dependency and include `dsh-ai-soul` in `dsh.profile.bundles` alongside the existing base and application bundles.

Example TUI bundle list:

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "dsh-ai-soul",
        "@deepseek-harness-tui/dsh-tui"
      ]
    }
  }
}
```

Example Web bundle list substitutes `@deepseek-ai/dsh-web-app`; Headless substitutes `@deepseek-ai/dsh-headless`.

Configure the selected Soul in the target profile's `cordis.patch.yml`:

```yaml
- id: ai-soul
  config:
    soulId: aster
    storeDir: /absolute/path/to/soul-store
    contextOrder: -10
```

`aster` is only an example. No Soul ID is a product default.

## Machine-readable profile preflight

Before launching DSH, run the profile preflight against the same profile, Soul Store, and intended surface:

```sh
DSH_PROFILE_DIR="$HOME/.dsh/profiles/dsh-tui" \
SOUL_ID=aster \
SOUL_STORE_DIR=/absolute/path/to/soul-store \
DSH_SURFACE=tui \
npm run preflight:dsh-profile
```

`DSH_SURFACE` must be one of `tui`, `web`, or `headless`.

The command prints JSON and exits non-zero unless all required checks pass. It distinguishes two readiness layers:

```json
{
  "ready": true,
  "runtimeReady": true,
  "applicationReady": true,
  "checks": {
    "pluginDependencyPresent": true,
    "soulBundleComposed": true,
    "aiSoulLoaderPresent": true,
    "soulIdConfigured": true,
    "storeDirConfigured": true,
    "soulLoadable": true,
    "applicationSurfacePresent": true
  },
  "diagnostics": []
}
```

`runtimeReady` means the profile declares the plugin, composes the Soul bundle, contains an `ai-soul` configuration matching the requested Soul and store, and the Soul can actually load/project from that store.

`applicationReady` means the requested TUI/Web/Headless application bundle is present in the same profile.

When a check fails, `diagnostics` contains one stable machine-readable entry per failed check. Each entry includes the existing check name, a short code, a human-readable message, and an actionable hint. Soul-load failures also preserve the underlying load error as `detail` while the legacy `errors.soulLoadable` field remains available.

For example, a correctly installed Soul layer without the requested application surface reports:

```json
{
  "ready": false,
  "runtimeReady": true,
  "applicationReady": false,
  "checks": {
    "applicationSurfacePresent": false
  },
  "diagnostics": [
    {
      "check": "applicationSurfacePresent",
      "code": "application-surface-missing",
      "message": "The DSH profile does not compose the requested tui application surface.",
      "hint": "Ensure dsh.profile.bundles contains \"@deepseek-harness-tui/dsh-tui\"; Soul identity and application surface are separate configuration axes."
    }
  ]
}
```

This is not a Soul failure. The diagnostic tells the operator to repair application composition rather than changing Soul identity or data.

The current diagnostic codes are:

- `profile-patch-invalid`
- `plugin-dependency-missing`
- `soul-bundle-not-composed`
- `ai-soul-loader-missing`
- `soul-id-mismatch`
- `store-dir-mismatch`
- `soul-not-loadable`
- `application-surface-missing`

These codes describe installation facts only. They do not infer whether two Souls are the same identity, whether imported evidence is canonical, or whether a runtime interaction proves continuity.

## Effective DSH verification

The profile preflight validates declared profile configuration plus persisted Soul loadability. DSH remains the authority on the final effective composition. Before a real runtime test, also inspect:

```sh
dsh --profile <profile> --dump-config
```

The effective dump must still contain the `ai-soul` loader/config and the intended application entries. A future installer may automate this final DSH-owned verification, but this package does not parse or redefine DSH's effective-config semantics.

## Surface examples

### TUI

```sh
dsh plugin --profile dsh-tui add /absolute/path/to/dsh-ai-soul
DSH_PROFILE_DIR="$HOME/.dsh/profiles/dsh-tui" SOUL_ID=aster SOUL_STORE_DIR=/absolute/path/to/soul-store DSH_SURFACE=tui npm run preflight:dsh-profile
dsh --profile dsh-tui --dump-config
dsh --profile dsh-tui
```

### Web

```sh
dsh plugin --profile web add /absolute/path/to/dsh-ai-soul
DSH_PROFILE_DIR="$HOME/.dsh/profiles/web" SOUL_ID=aster SOUL_STORE_DIR=/absolute/path/to/soul-store DSH_SURFACE=web npm run preflight:dsh-profile
dsh --profile web --dump-config
dsh web
```

### Headless

```sh
dsh plugin --profile headless add /absolute/path/to/dsh-ai-soul
DSH_PROFILE_DIR="$HOME/.dsh/profiles/headless" SOUL_ID=aster SOUL_STORE_DIR=/absolute/path/to/soul-store DSH_SURFACE=headless npm run preflight:dsh-profile
dsh --profile headless --dump-config
dsh --profile headless "Introduce yourself"
```

The final headless argument is only an example workload. It is not part of Soul configuration.

## Boundary

This contract deliberately does not mutate Soul Core, create a persona default, or treat installation success as identity-continuity proof. It answers a narrower operational question:

> Is this persisted Soul correctly composed with this DSH application profile and ready to be exercised through the requested surface?

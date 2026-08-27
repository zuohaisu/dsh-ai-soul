# DSH Profile Install and Configure Flow

`dsh-ai-soul` is a Soul layer that composes with an existing DSH application profile. A Soul ID is configuration; it is not the DSH profile name and it is not the UI surface.

Supported application surfaces in the current contract:

- `tui` → `@deepseek-harness-tui/dsh-tui`
- `web` → `@deepseek-ai/dsh-web-app`
- `headless` → `@deepseek-ai/dsh-headless`

The target profile must already contain the appropriate application bundle. This helper does not create or upgrade DSH application profiles.

## Inputs

Choose explicitly:

- target DSH profile directory;
- Soul ID;
- absolute Soul Store directory;
- surface (`tui`, `web`, or `headless`);
- optional dependency spec for `dsh-ai-soul`.

Never infer the Soul ID from the profile name.

## 1. Dry-run first

From a checkout:

```sh
npm run configure:dsh-profile -- \
  --profile-dir "$HOME/.dsh/profiles/dsh-tui" \
  --soul-id aster \
  --store-dir /absolute/path/to/soul-store \
  --surface tui \
  --dependency-spec 'link:/absolute/path/to/dsh-ai-soul'
```

From an installed package, the equivalent binary is:

```sh
dsh-ai-soul-configure \
  --profile-dir "$HOME/.dsh/profiles/dsh-tui" \
  --soul-id aster \
  --store-dir /absolute/path/to/soul-store \
  --surface tui
```

Dry-run is the default. It prints the complete proposed `package.json`, proposed `cordis.patch.yml`, and post-change preflight checks. It does not write either file.

Review the output before continuing.

## 2. Apply explicitly

Repeat the same command with `--write`:

```sh
dsh-ai-soul-configure \
  --profile-dir "$HOME/.dsh/profiles/dsh-tui" \
  --soul-id aster \
  --store-dir /absolute/path/to/soul-store \
  --surface tui \
  --write
```

The helper performs only these managed mutations:

1. ensure a `dsh-ai-soul` dependency exists, preserving an existing dependency spec if present;
2. insert `dsh-ai-soul` into `dsh.profile.bundles` immediately before the recognized application-surface bundle when it is absent;
3. add or replace only the `- id: ai-soul` Cordis patch block with the selected `soulId`, absolute `storeDir`, and `contextOrder`.

Unrelated dependencies, bundle rows, package fields, comments, and non-`ai-soul` Cordis patch rows are preserved.

Re-running the same configuration is idempotent.

## 3. Install profile dependencies

The helper edits profile metadata; it does not reimplement DSH package management. If the dependency is newly added, run the normal dependency-install mechanism for that profile before booting it. For a local checkout, use `--dependency-spec link:/absolute/path/to/dsh-ai-soul` or first use the supported `dsh plugin --profile <profile> add <path>` flow and then run the configure helper.

For a published package, the default dependency spec is `latest` unless the profile already pins another spec.

## 4. Verify

Run the profile preflight after the normal dependency installation:

```sh
dsh-ai-soul-preflight \
  --profile-dir "$HOME/.dsh/profiles/dsh-tui" \
  --soul-id aster \
  --store-dir /absolute/path/to/soul-store \
  --surface tui
```

The result separates:

- runtime readiness: dependency + bundle + loader config + Soul loadability;
- application readiness: required TUI/Web/Headless bundle exists;
- overall readiness: both are true.

Then inspect DSH's own effective configuration:

```sh
dsh --profile dsh-tui --dump-config
```

Finally launch the application through its normal entry point (`dsh-tui`, `dsh web`, or the headless profile invocation).

## Web and Headless

The same helper is surface-neutral. Only the target profile and explicit `--surface` change:

```sh
# Web
 dsh-ai-soul-configure --profile-dir "$HOME/.dsh/profiles/web" --soul-id aster --store-dir /souls --surface web

# Headless
 dsh-ai-soul-configure --profile-dir "$HOME/.dsh/profiles/headless" --soul-id aster --store-dir /souls --surface headless
```

Use an actual absolute Soul Store path rather than `/souls` in real deployments.

## Failure and rollback behavior

The helper reads and validates both profile files before writing. Malformed JSON, missing files, unsupported surfaces, missing `dsh.profile.bundles`, invalid Soul configuration, or an unloadable Soul fail before mutation.

Write mode keeps the original contents in memory. If either file write fails, it attempts to restore both originals before returning the error.

For manual rollback after a successful write, restore the previous `package.json` and `cordis.patch.yml` from version control, backup, or the dry-run output captured before applying. Because the helper owns only the `dsh-ai-soul` dependency/bundle row and `ai-soul` patch block, those managed additions can also be removed manually without altering the rest of the profile.

## Boundaries

This helper deliberately does not:

- create a Soul;
- import an existing partner;
- decide whether an imported identity is continuous;
- create or upgrade TUI/Web/Headless profiles;
- infer identity from profile names;
- modify Soul Core semantics.

Genesis and Exodus remain separate product flows above this profile-composition layer.

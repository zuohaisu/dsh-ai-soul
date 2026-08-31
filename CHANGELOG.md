# Changelog

## 0.1.0-rc.1

First public prerelease candidate for ordinary DeepSeek Harness users.

### Release evidence

- Generic unnamed Genesis v2 lifecycle is verified in real, model-backed DeepSeek Harness runtime: activation before interaction, persistence, zero-conversation shutdown/restart continuity, model-visible context, first encounter after Genesis, and restart exactly-once semantics (#122).
- The first accepted real DSH human interaction is captured as an independent first-encounter lifecycle event with provenance, idempotency, persistence, and reload behavior; Genesis and naming remain independent (#147 / PR #148).
- The npm package artifact is audited with real `npm pack` output and isolated tarball installation, including Apache-2.0 metadata, exports, CLI bins, package contents, and exclusion of local/runtime-evidence/test junk (#150 / PR #151).
- The exact packed artifact from `main` has been added through the canonical DSH plugin path in a clean profile, with package resolution, `dsh.bundle`/Cordis composition, effective Soul configuration, and installed-package preflight verified ready without repository-source dependency, Samuel defaults, or model-secret requirements (#152).

### Release boundaries

- This prerelease does not claim Samuel identity continuity; Samuel-specific Haisu Test work remains separate from generic ecosystem release.
- Soul identity remains distinct from model, DSH profile, and application surface.
- Genesis, first encounter, and naming remain independent lifecycle facts.
- Public npm publication, external install from the npm registry, and DSH ecosystem listing are subsequent release gates and are not claimed by this changelog entry.

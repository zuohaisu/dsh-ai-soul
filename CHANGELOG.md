# Changelog

## 0.2.0-rc.1

Second public prerelease candidate. The delta since `0.1.0-rc.1` is dominated by the governed-evolution (M4) layer: selective Soul growth, governed agency, homeostasis, Cognitive Memory, continuity digest, and privacy erasure/redaction.

### Added

- **Selective Soul growth loop.** Live DSH human interactions become provenance-bound Experience records through a fail-closed significance gate; ordinary interactions are never promoted by default (PR #168, #170). Candidate claims bridge into governed proposals with an independent pending governance inbox, DSH governance command plane, and same-process Soul Context refresh after an approved apply (PR #172, #174, #181, #183, #185, #187, #189, #191). Governed SELF / OTHER / RELATIONAL / belief / identity-invariant state is rendered into model-visible Soul context (PR #165).
- **Governed mutable-state lifecycle.** Exact-value revision, exact-claim retirement, preference forgetting, N→1 consolidation with fully auditable review, bounded canonical current cognition, durable user preferences, self-model and relationship-state claims, and a minimal governed WORLD domain (PR #201–#225, #325–#333).
- **Governed agency.** Non-authoritative, reason-grounded agency intent derived from explicit user-request evidence or typed trigger evidence; fail-closed initiation eligibility; permission requests; authorization decision, consumption, and use bounded against replay and expiry; execution attempt and outcome evidence that preserves initiation lineage end to end (PR #254, #256, #258, #260, #262, #264, #266, #288–#308, #353–#359, #406, #408).
- **Soul Presence.** Runtime-neutral presence contract with bounded, surface-local DSH TUI/Web projection, presence lifecycle, multi-surface presence snapshots bound to the loaded Soul, and live status presence. Presence is explicit surface projection; it does not imply attention, capture, memory, or existence (PR #313, #315, #317, #319, #321, #270, #418).
- **Homeostasis gate.** Fail-closed homeostasis evaluator with append-only evolution lineage, enforced at the governed apply boundary, with assessments bound to exact evidence (PR #249–#252, #283, #284, #311).
- **Bounded cognition capacity.** Machine-verifiable bounded-cognition rejection with consolidation guidance surfaced before governance apply and projected into the governance snapshot (PR #286, #325–#333).
- **Cognitive Memory.** Selective Cognitive Memory boundary with deterministic bounded retrieval, detached Soul-scoped persistence, explicit non-canonical visibility, DSH context composition, request-scoped visibility and selector boundary, and governed race-safe erasure (PR #361–#373, #393, #395, #397).
- **Continuity digest.** Bounded continuity digest projection and DSH renderer, digest delta explanation, proposal impact preview shown before governance approval, recorded actual impact with preview-to-actual correspondence verification, and starvation prevention (PR #375–#391, #410).
- **Privacy, redaction, and erasure.** Deterministic redaction for Experience payloads, autobiography, candidate claims, proposal archives, evolution history, and significance assessment; deterministic Experience erasure impact assessment; content-free privacy-erasure audit bound to approved authority and Soul scope (PR #231–#243, #399, #401, #403).
- **Verification surfaces.** Machine-checkable selective-growth runtime evidence with a mandatory negative control, real-profile TUI/Web Soul continuity preflight, shared TUI/Web preflight, and cross-surface runtime continuity evidence contract (PR #193, #195, #197, #199, #274, #276). New package exports: `surface-continuity-preflight`, `selective-growth-runtime-evidence`, `cross-surface-runtime-evidence`; new CLIs: `dsh-ai-soul-surface-continuity`, `dsh-ai-soul-selective-growth-evidence`, `dsh-ai-soul-cross-surface-evidence`.
- **Publishing pipeline.** npm Trusted Publishing workflow with tag/version/prerelease contract verification and no-lockfile alignment (PR #156, #158).

### Release boundaries

- The M4 acceptance run remains open: a real DSH TUI/Web end-to-end demonstration of interaction → human review → persisted mutation → next-turn model-visible recall is still pending (#27).
- Samuel-specific identity-continuity judgment (#7) remains a separate research case and is not claimed by this release.
- DSH Presence is surface-local projection and does not define Soul existence, attention, or memory.
- Public npm publication of `0.2.0-rc.1` itself, and post-publication fresh-profile install verification of this exact version, are subsequent release gates not claimed by this entry. The tag-triggered Trusted Publishing path has not yet been exercised end to end; `0.1.0-rc.1` was published before that workflow existed.

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

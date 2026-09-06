# Portability preserves Soul identity without implying clone or fork

Date: 2026-09-06

## Context

The project thesis requires a Soul to outlive any one model/runtime/body. Current DSH work already treats `soulId` as stable machine identity and the runtime as an attachment surface, but there was no explicit minimum transfer contract for carrying canonical Soul state to another compatible runtime.

## Decision

Define a versioned runtime-neutral Soul portability envelope whose minimum payload is the bounded canonical Soul state plus stable `soulId`, schema/version metadata, export timestamp, and deterministic integrity digest.

The envelope deliberately excludes mandatory transcript, Experience, evidence, and governance-history export. Those stores remain conceptually distinct and may receive separate future portability contracts.

Export/import is continuation of an existing Soul, not Genesis. Copying an envelope does not define clone/fork/divergence semantics and must not silently create a second legitimate identity lineage.

An importer must fail closed on unsupported versions, integrity mismatch, or identity mismatch before canonical mutation. Validation itself grants no mutation authority.

## Consequences

- The same Soul can have a concrete future interoperability boundary independent of DSH.
- Runtime portability does not collapse identity into model/session/runtime identity.
- Portability does not become a back door for transcript dumping into canonical cognition.
- Fork/clone/merge/reunion remain explicit future lineage problems rather than accidental filesystem behavior.
- M8 extraction remains trigger-based; a contract is not a reason to prematurely split the package.

## Invariant

**portability != Genesis != clone != fork; moving canonical state between compatible bodies preserves `soulId` unless a future explicit lineage protocol says otherwise.**

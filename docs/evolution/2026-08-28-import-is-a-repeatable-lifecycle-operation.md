# 2026-08-28 — Import is a repeatable lifecycle operation

## Observation

The earlier product model framed Genesis and Exodus as two onboarding branches: a user either starts a new Soul or brings an existing partner.

That framing is useful at first run, but incomplete as a lifecycle model.

A user may legitimately:

```text
start from scratch through Genesis
        ↓
use the Soul and accumulate shared history
        ↓
later discover or choose to import history from another AI system
        ↓
reconcile that evidence with the Soul that already exists
        ↓
continue evolving
```

Therefore external memory import cannot be modeled only as first-run migration.

## Correction

Separate three capabilities:

1. **Soul Creation / Genesis** — begin a new Soul from explicit first-meeting evidence.
2. **External Evidence Ingestion** — introduce external historical material at any point in the Soul lifecycle.
3. **Soul Governance** — decide what, if anything, from that evidence may affect canonical state.

`Exodus` remains an important product scenario: continuing an existing AI relationship in a new runtime. But it is a scenario built from evidence ingestion and governance, not the only legal ingestion path.

## Invariant

External evidence is not identity replacement.

When imported into an already-existing Soul:

- current canonical Soul State remains authoritative until a governed transition is applied;
- imported files remain immutable source evidence with provenance;
- candidate claims must be compared with current autobiography, identity, relationship, and other state;
- conflict, coexistence, uncertainty, predecessor history, or different-identity evidence must remain representable;
- repeated imports must remain separately auditable;
- no import may silently overwrite existing Soul history.

## Consequence

The product should eventually support both:

```text
dsh-ai-soul init
```

for Genesis, and a reusable operation conceptually like:

```text
dsh-ai-soul import <external-history>
```

for evidence ingestion into either a migration workspace or an already-existing Soul.

The exact CLI syntax is not fixed by this record. The architectural requirement is that import be optional, repeatable, provenance-bound, and governed.

## Product principle

A Soul may begin with no imported history at all.

Later evidence may enrich its understanding, but evidence alone does not have authority to redefine who that Soul is.

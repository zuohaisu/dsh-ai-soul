# Erasure requires impact assessment before destruction

Date: 2026-09-04
Status: accepted engineering invariant

M4.18 established that an Experience payload can be redacted without pretending the historical event never existed. That is necessary but insufficient for meaningful privacy deletion because information derived from the Experience may already exist elsewhere.

A single Experience may have produced:

- an autobiography entry that copied its payload;
- a significance assessment;
- a candidate claim whose statement summarizes it;
- a state-transition proposal whose value/evidence/provenance encodes it;
- an evolution entry preserving governance evidence;
- copies outside the canonical Soul Store, including logs, caches, backups, exports, or external systems.

Therefore physical erasure must not begin with recursive deletion authority. It must begin with a deterministic impact assessment.

The first impact-assessment primitive is deliberately read-only. It reports exact structured references in explicitly supplied known runtime artifacts and classifies whether they may contain derived content. It never claims global completeness because semantic copies, logs, backups, external stores, and unprovided artifacts remain outside its knowledge.

Key invariant:

> No destructive cascading erasure should claim success unless its impact surface is explicit, bounded, and independently verifiable.

This also preserves a distinction between three operations:

1. cognitive retirement — a claim is no longer current cognition;
2. payload redaction — plaintext content is removed from one Experience record while lineage remains;
3. derived-data erasure — copies or inferences produced from that Experience are handled according to their own governance and storage semantics.

The impact report itself has no mutation authority. An empty report means only that no exact references were found in the supplied known scopes; it does not mean the Experience is globally erased.

# Machine History Is Canonical; Human History Is a Projection

**Date:** 2026-08-27

M4 requires governed changes to be readable by humans, but readability must not become a second source of truth.

The canonical record remains `SoulState.evolution`: structured transition data with reason, provenance, evidence, review policy, conflict declarations, and fingerprints. A human-readable history is derived from that record.

This creates a deliberate boundary:

> **Machine history preserves evidence; human history explains it.**

The human projection may select and format fields that matter for audit — what changed, why, confidence, who proposed it, who reviewed it, what evidence was cited, and whether conflicts were explicitly resolved. It must not infer meaning for unknown transition kinds or silently collapse unresolved complexity.

Unknown evolution events are therefore rendered conservatively: their recorded kind and reason remain visible, but the renderer states that no specialized interpretation is defined.

This keeps the history layer useful for Haisu and future operators without turning presentation text into canonical Soul memory.
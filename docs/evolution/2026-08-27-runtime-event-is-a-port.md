# Evolution Log — Runtime Event Capture Is a Port

**Date:** 2026-08-27

## Decision

M3 must not encode an unverified DSH event API into Soul Core. Runtime capture is therefore modeled as a port: a runtime-specific adapter produces a small explicit envelope, and the envelope is mapped into the runtime-neutral Experience Record.

The envelope preserves runtime, session, event identity, timestamp, provenance, and an optional durable event reference. It does not require copying an entire transcript.

## Consequence

Soul Core can evolve and be tested independently of DSH lifecycle details. Once a real DSH event hook is observed, wiring should be a thin adapter rather than a schema redesign.

Capture still has no authority to mutate autobiography. It only creates evidence that later stages may assess and explicitly promote.

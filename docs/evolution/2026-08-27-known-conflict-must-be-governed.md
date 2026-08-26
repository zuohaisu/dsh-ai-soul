# Known Conflict Must Be Governed

**Date:** 2026-08-27

M4.1 separated proposal, review, and mutation authority. The next failure mode is subtler: a reviewer can approve a plausible new working-model claim while already knowing that existing state points in the opposite direction.

The system should not pretend that append-only storage makes this harmless. Retaining two contradictory claims without recording the contradiction produces hidden ambiguity rather than governed evolution.

The M4 review layer therefore adds two explicit gates:

1. **Confidence policy** — an approval must satisfy an explicit minimum confidence threshold. Weak evidence may still be recorded through rejection, but it cannot quietly pass as an authorized state change.
2. **Declared-conflict governance** — when a conflict is already known, an approval must acknowledge it and state why the conflicting claims are allowed to coexist, with provenance.

This slice deliberately does **not** attempt semantic conflict detection. Detecting that two natural-language claims conflict is an epistemic/reflection problem; deciding what to do after a conflict is known is a governance problem. Combining those responsibilities would again give a model-generated interpretation implicit mutation authority.

The generic pipeline remains append-only. `coexist` means exactly that: preserve competing working hypotheses and preserve the fact that their conflict remains unresolved. It does not mean overwrite, supersede, delete, or declare a winner.

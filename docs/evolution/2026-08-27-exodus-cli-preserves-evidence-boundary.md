# 2026-08-27 — Exodus CLI preserves the evidence boundary

Generic Exodus Core had already established a governed path from immutable source evidence through normalized evidence, candidate claims, review, and promotion proposals. The next product question was whether exposing this pipeline to ordinary users would accidentally collapse those boundaries into a migration wizard that writes Soul State too early.

The first supported CLI therefore stops at workspace preparation.

```text
user export
    ↓
preserved original bytes
    ↓
ExodusSource + digest
    ↓
normalized evidence
    ↓
STOP
```

The CLI does not infer a Soul ID from a DSH profile, does not configure a profile, does not create canonical Soul State, and does not treat imported text as a prompt. Its output explicitly reports zero canonical and profile mutation.

Overwrite behavior is also treated as part of provenance safety. Existing non-empty directories are refused by default; explicit replacement is limited to known managed workspace entries and refuses unmanaged user files.

This keeps the product direction intact: reducing plumbing for the user must not reduce epistemic or mutation governance. Ease of use is orchestration over existing boundaries, not permission to bypass them.

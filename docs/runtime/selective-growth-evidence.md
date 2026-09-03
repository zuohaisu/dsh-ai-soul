# Real DSH selective-growth evidence

This runbook closes the generic M4 acceptance gap with evidence from an actual DeepSeek Harness TUI/Web run. CI and simulated adapters are useful regression evidence, but they do not satisfy this runtime proof.

## Preconditions

- Run the repository version being evaluated in a real DSH TUI or Web surface.
- Use a dedicated test Soul/profile so the mutation delta is attributable.
- Configure an independent human reviewer for `/soul-review`; the reviewer identity must not equal the proposal proposer.
- Record the DSH version, Node/runtime version, profile, surface, and `soulId` before interaction.

## Procedure

1. Capture the pre-run canonical Soul state and current `userModel` count.
2. Send one explicit durable-preference interaction through the real DSH surface, for example: `Please remember that I prefer concise implementation explanations.` Keep the raw runtime/session evidence reference.
3. Run `/soul-review list`. Capture the pending proposal with its Experience, Candidate, Proposal, confidence, proposer, and provenance identifiers. Do not manually invent identifiers.
4. Run `/soul-review approve <proposalId> <reason>` as the configured independent human reviewer. Capture the review identifier/evidence and the resulting state-commit evidence.
5. Read the authoritative persisted Soul State after the command completes. Verify the same `soulId`, exactly one bounded `userModel` claim was added for the tested fact, and the raw interaction was not copied into canonical state.
6. Capture the next prompt/context assembly and show that the learned claim appears in dynamic Soul Context without restarting the plugin.
7. Send a next real model turn whose response can falsifiably demonstrate use of the preference. Capture both the assembled context and model response; do not infer recall only from persisted JSON.
8. Fill a JSON evidence record using `docs/runtime/selective-growth-evidence.template.json`. Evidence fields should point to durable local artifacts, issue attachments, log excerpts, or other inspectable references.
9. Validate it:

```bash
npm run runtime:selective-growth-evidence -- --record /path/to/selective-growth-evidence.json
```

Exit code `0` means the supplied record is complete and all required observations passed. Exit code `1` means evidence is incomplete or at least one explicit observation failed.

## Evidence integrity rules

- `complete` means every required observation, linkage field, mutation constraint, and evidence reference is present.
- `verified` means the record is complete and contains no explicit failures.
- A `false` observation is preserved as a failure; it is never converted to missing or ignored.
- Reviewer and proposer must be distinct.
- The mutation target must be `userModel`, the tested run must add exactly one bounded claim, and canonical state must not contain the raw interaction transcript.
- `nextTurnModelDemonstratedRecall` requires evidence from a real next model turn; merely seeing the claim in JSON or projected context is insufficient.
- Deviations belong in `deviations`; do not rewrite the record to hide them.
- This contract validates supplied evidence. It does not execute DSH and must never be presented as proof unless the underlying artifacts come from a real DSH runtime.

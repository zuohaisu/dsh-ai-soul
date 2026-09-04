# Runtime proof must remain falsifiable

Date: 2026-09-04
Issue: #226

## Decision

The remaining M4 selective-growth runtime acceptance cannot be satisfied by increasingly complete unit/integration simulations. The proof boundary is an actual DeepSeek Harness TUI/Web interaction followed by independent `/soul-review`, persisted mutation, same-process context refresh, and a real subsequent model turn that demonstrates the learned state.

The repository may make this proof easier to collect and mechanically validate, but it must not collapse the distinction between evidence tooling and runtime evidence.

## Consequences

- `dsh-ai-soul-selective-growth-evidence` remains a verifier, not a DSH runner.
- A canonical runbook defines the exact observations, linkage IDs, mutation invariants, and durable captures required for Issue #27.
- Missing linkage or observations are reported as incomplete/failure rather than inferred from expected architecture.
- CI, mocked Cordis events, direct Core calls, and rendered-context tests remain useful engineering evidence but cannot substitute for the real runtime acceptance.
- The human review command is part of the proof boundary because proposal formation and mutation authority must remain separate.

## Rationale

A persistent AI existence claim is only meaningful if the system can falsifiably demonstrate that a real experience changed governed persistent state and that the changed state affected a later real model turn while preserving the same Soul identity. If the evidence can be manufactured entirely inside the test harness, it only proves the test harness agrees with the implementation.

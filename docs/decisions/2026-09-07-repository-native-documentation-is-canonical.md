# Decision — Repository-native documentation is canonical

> Status: Accepted
> Date: 2026-09-07
> Owner: `zuohaisu`
> Supersedes: the abandoned GitHub Wiki direction discussed on 2026-09-06 and any later wording that implies Wiki is a canonical project knowledge layer.

## Decision

`dsh-ai-soul` uses the **GitHub repository itself as the single source of truth for both code and project documentation**.

All project knowledge stays inside the repository, primarily under `docs/`.

GitHub Wiki is **not** part of the project documentation architecture and must not be treated as a canonical or required destination.

## Why GitHub Wiki is rejected

The project requires documentation to be writable, maintainable, auditable, and discoverable by the same development agents that maintain the codebase.

The available GitHub automation path does not provide a reliable official interface/API for autonomous Wiki page creation and maintenance. A knowledge system that agents cannot safely and consistently update cannot serve as the project's canonical source.

Therefore Wiki is not a fallback, secondary source, or migration target. It is simply outside the current architecture.

Reconsidering Wiki requires **both**:

1. an explicit owner decision reversing this record; and
2. a reliable automation interface that can create and maintain Wiki content without manual-only steps.

Absent both conditions, agents must not reopen or re-propose the Wiki direction.

## Repository-native documentation model

Documentation is classified by **effect**, not by file extension.

### 1. Human knowledge documentation

Examples:

- product thinking and first-principles notes
- architecture rationale and design notes
- psychology / cognitive-architecture research
- historical architecture versions
- research synthesis
- experiment narratives and interpretation
- decision records
- chronological evolution records

Canonical location: repository `docs/` tree.

Recommended stable areas include:

- `docs/architecture/`
- `docs/decisions/`
- `docs/evolution/`
- `docs/knowledge/` when a topic does not fit an existing domain folder
- `docs/experiments/`
- `docs/continuity/`

These files are Git-versioned project knowledge. They do not need application CI merely because they changed.

### 2. Machine-coupled documentation / executable-adjacent artifacts

Some files look like documentation but participate in application behavior or verification.

Examples:

- Markdown or JSON read directly by code
- files whose exact text is asserted by tests
- schemas and contracts
- prompts/specifications consumed by runtime tooling
- runtime evidence templates or validators
- installation/runbook files that are part of an executable verification contract

These remain under the normal PR + CI gate.

Current examples include files such as `docs/quickstart.md`, `docs/runtime-verification.md`, `docs/application-profile-install.md`, and `docs/activation-before-interaction-runbook.md`, because repository tests currently read and assert their contents.

If classification is uncertain, treat the artifact as machine-coupled until dependency inspection proves otherwise.

## CI policy

Application CI exists to protect executable behavior, not to validate every knowledge edit.

Pure human-knowledge changes may be committed directly to `main` and do not require:

- a GitHub Issue
- a delivery branch
- a pull request
- `npm run check`
- waiting for CI

This exception applies only when the changed paths are demonstrably non-executable and are not read/asserted by code or tests.

Machine-coupled documentation continues to use the normal owner-gated delivery model and CI.

The CI workflow therefore ignores explicitly classified human-knowledge paths. New human-knowledge areas should be added deliberately; do not broadly ignore all Markdown or all of `docs/`, because some documentation is machine-coupled.

## No dual source of truth

Do not maintain equivalent canonical copies in multiple documentation systems.

If historical material is superseded, preserve it as history and link to the current canonical record rather than silently rewriting old reasoning.

`docs/evolution/` should remain chronological evidence of how the project changed. Current design truth belongs in the appropriate current architecture/product/decision document.

## Current architecture note

The 2026-09-06 discussion about Self Model enrichment, affective architecture, and the definition of AI Soul as an **AI-native relational agent with persistent internal state** is already recorded in:

- `docs/architecture/ai-native-mind.md`

That file is the durable repository-native design note for this topic.

## Consequences

1. Repository history is sufficient to reconstruct both implementation and project reasoning.
2. Agents can read and update the whole project knowledge system through the same GitHub workflow.
3. Pure knowledge work no longer consumes application CI capacity.
4. Machine-coupled documentation remains protected by CI.
5. GitHub Wiki should not appear in future architecture proposals unless this decision is explicitly reversed by the owner.

## Related

- GitHub Issue `#281` — closed decision-cleanup record.
- `docs/architecture/ai-native-mind.md` — AI-native Self / Affect design note.
- `AGENTS.md` — repository working rules implementing this documentation boundary.

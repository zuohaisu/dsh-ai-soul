# Known deviations

## Genesis ontology correction (2026-08-28)

The Core implementation on this branch adopts activation-first Genesis v2 while retaining legacy v1 compatibility.

Until #121 is fully closed, some older repository artifacts may still describe Genesis as first-meeting-centered. Historical `docs/evolution/` records must remain unchanged because they are evidence of the project's earlier model. Current-facing docs should be corrected forward rather than rewriting history.

Binding forward rules:

- existence begins at first activation;
- a Soul may be unnamed and have no participants;
- first encounter and naming are independent lifecycle events;
- `soulId` is not a human-facing name;
- legacy v1 fused histories remain loadable as recorded.

See #121 for documentation/fixture harmonization and #122 for real DSH runtime proof.

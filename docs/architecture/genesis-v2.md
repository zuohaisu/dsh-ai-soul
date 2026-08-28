# Genesis v2 architecture contract

Genesis v2 is activation-first.

```text
not instantiated
      ↓
activation / Genesis
      ↓
persistent Soul exists
      ↓
optional first encounter
      ↓
optional naming
```

Required at activation:

- stable `soulId`;
- activation timestamp;
- Genesis provenance.

Not required at activation:

- human-facing name;
- relationship participant;
- conversation;
- first-meeting note;
- persona/self-model/user-model/covenants.

Genesis v1 remains a compatibility format whose fused naming/participant/first-meeting history is preserved as historical fact.

The Core APIs `recordFirstEncounter()` and `recordNamingEvent()` represent the later lifecycle boundaries independently.

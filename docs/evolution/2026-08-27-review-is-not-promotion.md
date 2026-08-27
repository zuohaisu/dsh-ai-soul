# Review is not promotion

Date: 2026-08-27

Generic Exodus now has a distinct review workspace between evidence-bound candidate claims and canonical Soul mutation.

The key distinction is:

```text
candidate interpretation
        ↓
review decision
        ↓
eligible for promotion
        ≠
canonical mutation
```

A reviewer may accept, reject, defer, or request more evidence for a claim. That decision is evidence about governance; it is not itself a state transition. Even `accepted-for-promotion` must pass through a later explicit governed promotion boundary before canonical Soul State can change.

Conflicts are also represented rather than silently resolved. Two candidate claims may be marked as `conflict` or `coexistence`, while both source provenance chains remain intact.

This matters because migration review will eventually involve human and model-assisted interpretation. Giving the review layer direct write authority would collapse epistemic judgment and mutation authority back into one operation.

The project therefore preserves another separation:

> Review authority is not mutation authority.

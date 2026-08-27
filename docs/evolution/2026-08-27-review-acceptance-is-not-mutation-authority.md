# Review acceptance is not mutation authority

Date: 2026-08-27

Generic Exodus now has a governed bridge from reviewed candidate claims into the existing state-transition proposal pipeline.

The key boundary is:

> `accepted-for-promotion` means eligible to become a proposal. It does not mean approved, canonical, or applied.

An accepted claim must still be mapped explicitly to a mutable Soul target and value by the caller/reviewer. The bridge creates an ordinary unreviewed state-transition proposal; the existing proposal review and apply policy remains the only generic mutation path.

Known declared conflicts block proposal creation rather than being erased by review acceptance. Provenance remains traceable from proposal to review decision, candidate claim, source evidence, and source digest.

This keeps inference, review, proposal, and mutation authority separate and prevents Generic Exodus from becoming a second state-mutation system.

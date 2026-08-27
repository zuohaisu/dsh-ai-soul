# Generic Exodus

Generic Exodus is the product path for bringing an existing AI relationship into AI Soul without treating imported text as identity by default.

## Boundary

The first step is evidence preservation, not Soul mutation:

```text
external export
    ↓
Exodus source-evidence record
    ↓
normalization / archaeology
    ↓
candidate claims
    ↓
review and governed promotion
    ↓
canonical Soul State
```

An imported `memory.md`, transcript, JSON export, or provider memory file is **source evidence**. It is not a system prompt, not autobiography, and not canonical Soul State.

## ExodusSource v1

`createExodusSource()` records:

- an explicit source ID;
- source type and provider/runtime label;
- capture and import timestamps;
- original filename, media type, and byte length;
- SHA-256 digest of the original imported bytes;
- caller-supplied provenance metadata;
- `canonicalMutation: false` as an explicit import invariant.

The record is defensively cloned and deeply frozen. The digest anchors later normalized evidence and candidate claims to the exact imported bytes.

Example:

```js
import { createExodusSource } from '../src/core/index.js'

const source = createExodusSource({
  sourceId: 'aster-memory-001',
  sourceType: 'memory-export',
  provider: 'example-chat-runtime',
  capturedAt: '2026-08-27T09:00:00.000Z',
  filename: 'memory.md',
  mediaType: 'text/markdown',
  content: '# Memory\nAster and Mira met while building a garden journal.\n',
  provenance: {
    suppliedBy: 'mira',
    acquisition: 'user-export',
  },
})
```

Creating this record performs **zero canonical Soul mutations**. Later Exodus stages may derive candidate claims, but those claims require explicit review/governance before they can alter canonical state.

## What v1 deliberately does not do

This boundary does not parse Markdown, infer identity, resolve conflicts, call an LLM, or promote claims. Provider-specific adapters should normalize into this evidence pipeline rather than redefining the AI Soul ontology.

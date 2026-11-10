---
description: Import mapped Clozd deal CSV records
---

Read CLAUDE.md first. Import mapped Clozd deal CSV records.

Run:

```bash
npm run research -- import clozd --file=fixtures/clozd-example.csv --map=fixtures/clozd-map.json --dry-run --actor=Alex
```

Replace example names, dates and references with the operator's records. Use --json for full machine-readable output. Read the record before a change. Writes require --actor with the operator's name. Never infer permission, a buyer quote, a reason or completed work. If a reference is ambiguous, show the candidates and ask which one. Never send or publish.

The fixture is synthetic, not a vendor-certified sample. Read docs/replace-clozd.md and map the actual export headings. Run --dry-run first. An entire batch rolls back on any bad row. Changed source records stop for review.

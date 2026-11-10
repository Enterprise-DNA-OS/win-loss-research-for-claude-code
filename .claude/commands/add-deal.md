---
description: Record a closed deal
---

Read CLAUDE.md first. Record a closed deal.

Run:

```bash
npm run research -- add-deal --name="Example renewal" --account="Example" --segment=Midmarket --outcome=lost --closed-on=2026-11-01 --currency=NZD --amount=12000.00 --seller-reason=price --competitor="Vendor" --owner=Alex --actor=Alex
```

Replace example names, dates and references with the operator's records. Use --json for full machine-readable output. Read the record before a change. Writes require --actor with the operator's name. Never infer permission, a buyer quote, a reason or completed work. If a reference is ambiguous, show the candidates and ask which one. Never send or publish.

State the result and its evidence limits.

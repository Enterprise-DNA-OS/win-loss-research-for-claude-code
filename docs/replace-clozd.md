# Replace the Clozd deal research workflow

The free base imports the deal register from Clozd's selectable CSV export. It does not claim a full Clozd account migration. A one-day switch applies to a reconciled deal register, with usable exports and an agreed mapping. Keep Clozd available until you have checked counts and the research records you need.

## Export

Clozd's [export guide](https://help.clozd.com/getting-started/exporting-deal-data), opened 10 November 2026, documents a CSV from Deals, All Imported Deals, Export All Deals. Choose the fields you need. It also documents individual published-deal PDF exports for admins. The guide requests a maximum of 10,000 deals per export.

The help page does not define a stable CSV header contract. The supplied fixture is synthetic and demonstrates our mapping, not a vendor-certified export. Match the actual header strings in your CSV to fixtures/clozd-map.json. Do not guess absent identifiers or interview evidence.

## One import command

```bash
npm run research -- import clozd --file=imports/deals.csv --map=imports/mapping.json --dry-run --actor="Research owner"
```

Read the counts, then remove --dry-run to write. All rows validate in one transaction. A bad row rolls back the complete batch, including its activity entries. Identical source rows are unchanged on repeat import. A changed source row stops for explicit reconciliation, preserving existing evidence.

| Mapping key | Meaning |
|---|---|
| source_id | Required stable deal identifier, unique in the export |
| name, account | Required deal and company names |
| segment, owner | Required segment and accountable owner |
| outcome | Required won, lost or no_decision; Closed Won, Closed Lost and No Decision also accepted |
| closed_on | Required ISO calendar date YYYY-MM-DD, no future close dates |
| amount, currency | Optional plain decimal without currency symbols or separators; amount needs a three-letter currency |
| seller_reason, competitor | Optional; missing values remain unknown |

Mapping values are exact header strings. Required data absent from an export must be supplied from a verified source before import. Dates in other formats need an explicit reviewed conversion. No exchange rates are applied. Extra source fields stay in the private administrative record, so minimise exports before import.

## What needs separate work

This command does not import interview PDFs, recordings, transcripts, permissions, themes, managed interview services, workflows, integrations or prior action history. Review permitted source material and record completed interviews and excerpts through the CLI. Permission and collection-notice evidence never come from a guessed CSV flag. Enterprise DNA maps the agreed records and arranges any required connections as part of a custom version.

Compare deal totals by outcome and currency, spot-check records and verify evidence links before retiring the old workflow. Export produces a complete private JSON snapshot, including restricted material. It is not a vendor-format export or automatic restore. Back up the actual database and test recovery separately.

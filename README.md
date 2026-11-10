# Win-Loss Research for Claude Code

Your closed deals, buyer evidence and improvement actions in a database you own. Built by [Enterprise DNA](https://enterprisedna.co). MIT licensed. Runs with Claude Code, Codex, OpenCode or Cursor.

<!-- three-doors -->
| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free base. Install and run your own research records. | Your segments, research rules and agreed Clozd records brought across. | Installed, connected and operated through Omni by Enterprise DNA. Setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=clozd) | [How it works](https://enterprisedna.co/omni/instead-of/clozd) |

## What this replaces

The records and weekly review part of an internal win-loss programme: select closed deals, plan interviews, check permission, record sourced buyer evidence, compare explanations and close improvements. Clozd offers software-only and managed programmes. This focused base does not replace their interview service, recordings or transcription. [Vendor platform](https://www.clozd.com/product/platform).

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/win-loss-research-for-claude-code.git
cd win-loss-research-for-claude-code
npm install
npm run demo
npm run research -- attention
```

Node 20 or later. PGlite runs locally without a separate database installation. Set DATABASE_URL in .env for Postgres, then run npm run migrate. Seed only a disposable shared database with npm run seed -- --demo-database. All companies, participants and buyer quotes in the demo are fictional. Dates are relative to the first seed run. Repeating the seed keeps existing data.

The demo includes a lost renewal blamed on price where the buyer described rollout capacity, a won expansion praising support, an overdue interview, an overdue improvement and a withdrawn participant awaiting retention review.

## Commands

| Command | Purpose |
|---|---|
| /deals | Read closed deals and seller explanations |
| /interviews-due | Review planned buyer interviews |
| /coverage | Check which deal segments lack buyer evidence |
| /themes | Count decision factors without double-counting deals |
| /evidence | Read eligible buyer excerpts and source references |
| /disagreements | Compare seller reasons with different buyer themes |
| /actions-due | Review open actions and evidence restrictions |
| /attention | Find overdue interviews, actions and coverage gaps |
| /compliance | Check collection notices, permission and retention dates |
| /competitors | Count interviewed deals by competitor and outcome |
| /stats | Review deal counts and values by currency |
| /activity | Read the operator activity log |
| /deal | Read one deal and its eligible findings |
| /add-deal | Record a closed deal |
| /plan-interview | Plan an interview with a purpose and retention review |
| /permission | Record permission and collection-notice evidence |
| /complete | Record the completed interview and source reference |
| /withdraw | Exclude an interview and its findings from research |
| /review-retention | Record an authorised purpose and next retention review |
| /add-finding | Record a verified buyer excerpt and decision factor |
| /add-action | Assign an evidence-linked improvement |
| /close-action | Close an action with evidence |
| /log | Append an internal deal note |
| /draft-brief | Draft an internal deal review |
| /weekly-review | Draft the Monday review from three live reads |
| /import | Import mapped Clozd deal CSV records |
| /export | Export a complete private administrative snapshot |
| /help | List CLI verbs and examples |
| /customise | Change fields or rules through a migration and tests |
| /new-view | Add a private read-only report |

Every CLI command supports --json. References accept codes, UUID prefixes and case-insensitive name fragments where names exist. Ambiguity lists candidates and exits 1. Writes require --actor. Use npm run research -- help for complete examples.

## The weekly research ritual

1. Read coverage and choose deals from missing segments, including losses and no-decisions.
2. Plan an interview with a purpose and retention review date. Record permission and the collection notice.
3. Complete the interview with its source reference. Add exact, reviewed buyer excerpts and themes.
4. Read themes and disagreements. One buyer can mention several themes, so counts do not add to a win rate.
5. Assign actions, record completion evidence and draft the Monday review.

No command contacts a buyer, records a call or sends a draft. A different buyer theme is evidence to investigate, not proof that the seller's reason was false.

## Ten questions for your records

These work today. They are useful questions against your own evidence, not an unsupported claim that Clozd cannot produce equivalent reports.

1. Which closed-deal segments have no eligible buyer interviews? (`coverage`)
2. Where does a lost deal have a buyer theme different from the sales reason? (`disagreements`)
3. Which late interviews also leave a gap in our coverage? (`attention`)
4. Which open actions rely on withdrawn or expired research evidence? (`actions-due`)
5. How many distinct lost deals mention each negative theme? (`themes`)
6. Which buyer excerpts support the implementation concern? (`evidence`)
7. Which competitor appears in interviewed wins and losses? (`competitors`)
8. Which interview permissions or collection notices need review? (`compliance`)
9. How many deals have an unknown value, separately by currency? (`stats`)
10. Who recorded a withdrawal or closed an improvement action? (`activity`)

## Your first hour: ten things to ask for

1. Show the overdue interview and the missing segment.
2. Compare the sales explanation with the buyer's words on the Harbour renewal.
3. Find actions that are overdue.
4. Show each win and loss theme with its deal count.
5. Explain which research records are excluded and why.
6. Preview the example import without writing.
7. Draft an internal interview brief.
8. Put our name and colours in brand.json and render the documents.
9. Change our coverage-review threshold through a migration and tests.
10. Add a view for our own segments and research owners.

## Bring Clozd deal records across

```bash
npm run research -- import clozd --file=fixtures/clozd-example.csv --map=fixtures/clozd-map.json --dry-run --actor="Research owner"
```

Map the headings in your actual selectable CSV export. The fixture is synthetic. Remove --dry-run after checking counts. Identical rows are unchanged on reimport; changed source rows stop for reconciliation. The transaction rejects the entire batch on error. It imports deal records, not interview recordings, PDFs or permission history. [Export steps, mapping and limits](docs/replace-clozd.md).

## Documents and views

Run npm run docs for an internal interview brief per deal and an action review per improvement. Run npm run view for the week, decision factors and record checks. brand.json sets the business name, logo and colours. Files are private and ignored by Git. [Why no front end](docs/why-no-front-end.md).

## Evidence and privacy

[Selected compliance checks](docs/compliance.md) cite NZ collection-notice and retention guidance. Permission is an internal research policy. There is no automatic legal decision, universal retention period or automatic erasure. Withdrawn or overdue-retention interviews are excluded from research outputs. Earlier files and administrative exports remain sensitive and need separate review.

An actor label is not authentication. This base is for a trusted operator. Shared deployment requires real access control and backups. RLS has no public access policies; database owners can bypass application rules. Protect raw imports, private exports, notes and drafts. Do not put real records in Git.

Deal amounts use integer cents and remain grouped by currency. Missing values stay unknown. No exchange conversion, payment processing or accounting entries. A selected interview sample does not prove why all customers buy or leave.

## Verification

Run npm test. It uses a temporary database, exercises all 28 CLI verbs and checks permission, withdrawal, retention, coverage deduplication, ambiguous references, atomic imports, repeat imports, money, escaped HTML and private reports. CI runs on Linux, Windows and PostgreSQL 17. TEST_DATABASE_URL must point to an empty disposable database. Normal DATABASE_URL is ignored by the test.

## Your own version

Enterprise DNA maps your agreed history and builds your fields, reports and connections. A team screen or another stack can be part of your version. Run it through **Omni by Enterprise DNA**, for one setup fee and then a monthly retainer. [Sam's 30-minute call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=clozd&utm_source=github&utm_medium=readme).

## Licence

MIT. Copyright 2026 Enterprise DNA.

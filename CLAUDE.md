# Win-Loss Research for Claude Code

For an authorised researcher at [YOUR BUSINESS]. Set the operator and research purpose before using real records. All seeded companies and buyer words are fictional.

## Work from evidence

Read before writing. Use the one CLI, scripts/research.mjs. Never invent an interview, quote, permission, competitor, decision factor or completed action. Buyer words require a source reference and named reviewer. Sales explanations and buyer themes are separate. A different theme is not proof that a salesperson was wrong.

Never send, invite, record a call, publish or make purchases. Drafts stay private in drafts/. Nothing here contacts a buyer. A person reviews and sends outside this system.

## Routing

| Job | Purpose |
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

## Rules

Writes require --actor. This is an operator label, not authentication. Use with a trusted operator. Shared deployment needs individual identities, permissions and backups. RLS is enabled with no public policies, but the database owner can bypass workflow controls.

Only a planned, permitted interview with a collection notice and current retention review can be completed. Findings require a completed interview and a source reference. Withdrawn or overdue-retention interviews never appear in research evidence or coverage. Review-retention does not undo withdrawal. Historical generated files do not update automatically.

The 14-day coverage threshold is an internal demo policy, not a law. Privacy checks are selected record checks, not a legal decision. Read docs/compliance.md. Keep notes, exports, imports and generated reports private. Never put real buyer records in Git.

## Data

Amounts are integer cents with a currency. Blank amount means unknown, never zero. Never sum currencies together. No payments, invoicing or accounting entries. One deal can mention several themes; do not add those counts or allocate deal value to reasons. Coverage counts distinct deals, not interviews.

Import requires explicit header mapping and a stable source ID. Raw source fields are retained in the private administrative record. Repeat identical rows are unchanged; changed rows fail for human reconciliation. See docs/replace-clozd.md. Export is a complete JSON snapshot, not a one-command restore.

Schema is in supabase/migrations. Use the shared adapter in scripts/lib/db.mjs. Add a numbered migration for changes. Run npm test. Reports use views.json and documents.json with brand.json. Nothing starts a web server.

Built and run for you through Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/clozd

# Section 5 — SQL Screening Readiness

Status: implemented. Assessment content, implementation scope, and reported testing outcomes were approved by the course owner. Documentation and change-log finalization were then authorized.

Live assessment: https://jthatcher87.github.io/pnixstudio-agile-mastery/sql/assessment-prep/

## Purpose and evidence

Form A assesses independent SQL schema design, query writing, troubleshooting, and explanation. The governing role is Strata Decision Technology's Application and Technical Support Specialist, Planning and Performance Management:
https://job-boards.greenhouse.io/stratacareers/jobs/8037397003

This is an original preparation assessment, not an official Strata hiring test or StrataJazz administrator certification. Public interview reports do not establish the specific support-role assessment. The recruiter must confirm the actual database engine, format, duration, permitted tools, and passing criteria. The practice timing and thresholds below are course standards, not employer claims.

## Approved assessment

| Part | Content | Maximum | Minimum |
| --- | --- | ---: | ---: |
| A | Financial-import schema, rationale, integrity rules, six demonstrations | 20 | 15 |
| B | Eight independent SQL questions | 50 | 38 |
| C | Two query-diagnosis and repair tasks | 20 | 15 |
| D | Five reasoning explanations | 10 | 8 |

The practice attempt lasts 90 minutes. Suggested allocation: design 20, query writing 45, troubleshooting 15, explanation 10. Candidates work without AI, hints, or reference answers and record any assistance or interruptions.

Part A permits alternative correct designs. The reference design uses departments, accounts, and transactions, integer-cent amounts, required nonblank identifiers, foreign keys, protected referenced master records, and uniqueness of source-system plus source-transaction key across imports.

Parts B and C use an independent supplied fixture containing departments, ledger, budgets, and staging rows. Defects include a missing department reference, a NULL ledger amount, duplicate staged business keys, zero budgets, period boundaries, and malformed imported amount text. Do not repair the fixture before answering.

The eight query questions cover matching and preserving joins, grouped filtering, NULL-aware aggregates, duplicate detection, pre-aggregated budget variance, NOT EXISTS, and validated conversion. The two diagnostics address date/outer-join filtering and repeated budget amounts caused by detail joins.

The conversion contract trims ordinary spaces, treats NULL or empty input as missing, and accepts one to nine ASCII digits with an optional leading minus. Other formats are invalid. Missing and invalid inputs produce NULL parsed cents. These are explicit exercise assumptions, not Strata import specifications.

## Attempt lifecycle

1. Enter a candidate name, declare prior familiarity with Form A, and acknowledge the attempt conditions.
2. Start the attempt. The absolute deadline persists across refreshes; there is no pause control.
3. Run SQL and inspect results or syntax/constraint errors. Correctness comparisons, hints, reference answers, and reviewer marking are withheld until submission.
4. Submit manually or reach the deadline. The application freezes a copy of answers and execution evidence. A late callback cannot append evidence to the submitted copy.
5. Review the frozen submission. Optional post-submission checks compare query results against base and additional fixtures and exercise reference-schema behavior.
6. A human reviewer marks every criterion, records critical-error decisions, supporting evidence, and remediation where required.
7. Export the JSON submission or readable report. Submitted JSON can be opened on another device for reviewer marking.

Expired attempts are submitted on the next timer, input, or page-load check; a closed browser cannot run a background submission. The recorded submission time is capped at the saved deadline. This is a client-clock practice timer, not a tamper-resistant examination service.

## Marking and readiness

Human reviewers award all rubric points, including partial credit, required SQL constructs, explanations, equivalent valid solutions, and alternative schema designs. Automated result comparisons are evidence only. Column labels do not affect comparisons; row order is checked only for Q1. Additional fixtures help detect fixture-specific answers but do not prove the absence of hard-coding.

Schema probes assume the reference table and column names. An alternative design that cannot load the probes requires human inspection, not automatic failure. Candidate schema execution accepts CREATE statements, followed by demonstration INSERT, UPDATE, DELETE, SELECT or WITH statements. Expected individual demonstration constraint errors are retained so subsequent statements can run.

A completed review requires a reviewer name, all criterion scores within bounds, a decision for each fundamental-error area, and supporting notes. Below-standard work requires targeted remediation and a fresh retest plan. Editing a completed review invalidates its completion until recorded again.

The approved benchmark requires two different unseen forms, each scoring at least 85/100, meeting every component minimum, with no unresolved fundamental errors in join preservation, duplicated totals, key integrity/scope, or conversion.

Form A alone can establish only the first readiness benchmark. Form B is not yet approved or available. Familiar Form A retakes remain practice and cannot count as a second unseen form. Actual test-engine readiness is separately unverified until the engine is confirmed and proficiency is demonstrated. No candidate has been certified ready by implementation or software testing.

## Persistence and execution boundaries

- State key: `pnix-sql-readiness-a-v1`; form version: `readiness-a-1`.
- Previous election-exercise progress is not imported or counted.
- Drafts, reviews, and archived attempts are browser-local; there is no account synchronization.
- Downloads include candidate answers, timing, retained execution evidence, review data, and local attempt history in JSON.
- Submitted JSON supports reviewer handoff. Reviewer identity, timing, and imported records are self-reported, not authenticated.
- The static site is not proctored. Withholding references in the interface is not secure access control; source assets are inspectable.
- Workers use the existing bundled sql.js/SQLite assets, disposable databases, an eight-second execution limit, and a 500-row result limit.
- Query tasks accept one read-only SELECT/WITH statement. Schema and demonstration databases are separate from the supplied query fixture.
- Up to 120 candidate execution records are retained; the submitted SQL answers remain in the frozen submission. Download a backup when browser storage is unavailable or full.
- This runtime does not execute or validate SQL Server, MySQL, or PostgreSQL behavior.

## Files and scope

`index.html`, `prep.css`, `app.js`, `data.js`, `model.js`, and `runner.js` implement Section 5. The dedicated suite is `tests/sql-assessment-prep.mjs`.

Implementation commit: `c591ed68f946bd5b5d3a574743faf651867e4387`. Exactly those seven implementation/test files changed. Sections 1–4, the Section 3 exam, shared assets, branding, navigation, and deployment configuration were unchanged.

## Verification accepted by the owner

Run from the repository root using Node 24+ and the bundled engine; no package installation is required:

```sh
node tests/sql-assessment-prep.mjs
node tests/sql-exam.mjs
node tests/sql-interview.mjs
node tests/sql-scripting.mjs
```

Recorded outcomes:

- 76 readiness checks passed, including actual application event handlers exercised with a DOM adapter.
- The reference schema passed all 23 behavior probes within that suite.
- Existing course regressions passed: 31 exam, 28 interview, and 33 scripting checks (92 total).
- Static UI checks passed for unique IDs, label targets, script paths, responsive rules, and focus styling.
- Live desktop browser checks confirmed start/timer display, SQLite query execution, grading withheld during the attempt, draft/deadline recovery after refresh, keyboard focus from the query editor to Run, submission locking, reviewer evidence checks, rejection of incomplete marking, JSON download, and persistence of the submitted state and checks after refresh.
- GitHub Pages deployment completed successfully.

Remaining limitation accepted at the testing review gate: narrow-screen rendering has not been verified in a real browser. The DOM adapter and responsive CSS checks do not establish visual mobile usability.

See [CHANGELOG.md](CHANGELOG.md) for the finalized change record.

# SQL Scripting — PNiXStudio

Six modules and twelve graded multi-statement SQLite exercises covering views, tables, inserts, updates, deletes, transactions, indexes, and repeatable setup. Available from the SQL course switcher and at `/sql/scripting/` on the repository's GitHub Pages site.

Each script runs in a disposable Web Worker against a fresh in-memory database. Statements in a run share changes; later runs start over. The runner provides statement-number errors, last-result tables, a statement log, seven-second timeout, 100-statement limit, and 500-row result limit. Progress uses a separate browser-local storage key from Foundations.

Grading executes the learner and reference scripts independently, checking resulting data and schema on two fixture datasets. Transaction lessons also require transaction commands. The final challenge executes each script twice. This is educational feedback, not a proof of program equivalence. SQLite-specific behavior is identified in the course; SQL Server stored procedures, variables, GO, and procedural control flow are not implemented.

Run tests with Node 24+: `node tests/sql-scripting.mjs` from the repository root. No package installation is required; tests use the bundled sql.js engine. Serve `site/` over HTTP for local preview.

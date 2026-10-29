# SQL Foundations — PNiXStudio

An interactive SQL introduction with six modules, twelve guided query challenges, hints, error guidance, a schema explorer and free practice. Queries execute locally using bundled sql.js/SQLite in a read-only Web Worker. Drafts and progress save in the learner’s browser.

This course deploys alongside Agile & Scrum Mastery using the repository’s existing GitHub Pages workflow. Open the SQL course at the `/sql/` path of the published Pages site. No ChatGPT or GitHub account is required for learners.

Serve this directory over HTTP for local development; do not open index.html directly using file://. No build or external runtime dependencies are required.

All practice records are fictional. Each query starts with a fresh database. Results are limited to 500 rows and queries are stopped after five seconds. Challenge grading checks output columns and result rows against two datasets, accepting output-equivalent SQL solutions. This is educational feedback rather than a formal proof of SQL equivalence.

Third-party engine: sql.js 1.13.0, MIT license in assets/SQLJS-LICENSE.txt.

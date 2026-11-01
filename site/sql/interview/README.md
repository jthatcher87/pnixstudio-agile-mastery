# Section 4 — Interview Readiness

Four practice areas connect SQL skills with healthcare application-support interviews:

1. Three diagnostic incidents (inflated totals, missing records, failed load), each with hypotheses, two graded SQL tasks, written conclusions and discussion rubrics.
2. Eight-section support record covering impact/priority, expected vs actual, reproduction, evidence, proposed resolution, customer update, escalation/security, and KCS/handoff. Each has an example and explicit self-review criteria.
3. Two financial SQL labs covering expense budget-to-actual variance and unmapped exceptions, plus a stakeholder explanation exercise.
4. Eight mock-interview prompts, follow-ups, answer guides, saved notes, four self-rating dimensions and a local two-minute practice timer.

All data is fictional. This is SQLite practice, not a simulation of StrataJazz or a specific employer production environment. There are no real patient records, external app connections, server credentials, remote learner analytics, or automated language-model scoring. Written and interview scores are self-reported; SQL lab checks compare results on two datasets. Section 3 competency exam scoring remains unchanged.

Queries execute read-only in disposable Web Workers using the existing bundled sql.js engine. Single SELECT/WITH statements, 500-row output limit and seven-second deadline. Base and additional fixtures cover duplicate mappings, timestamps at midnight and late night, unmatched keys, malformed staged amounts, duplicate keys within a batch, invalid periods and zero budgets.

Notes, ratings and passes save locally under pnix-interview-practice-v1. The learner can export a plain-text notes file using the page's download button. No login is required.

Run `node tests/sql-interview.mjs` with Node 24+ from the repository root. No package installation is required. Serve site/ over HTTP for local preview.

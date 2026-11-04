# Section 5 — SQL Assessment Preparation

Original practice based on reported schema-design and intermediate querying topics. A public candidate interview account mentions a school election schema. Official Strata careers guidance says interview format can vary by team; no universal official SQL assessment specification was confirmed. This section is preparation, not a reproduction of a confirmed current test or product certification. Source links and the course-gap assessment are included in the page.

## Schema design

An editable six-table SQLite DDL lab uses classes, voters, elections, eligibility, candidates and votes. It checks declared keys, required fields, ID/label types and election-scoped composite foreign keys, then loads valid fixtures and runs adversarial acceptance probes. The reference design passes 54 checks. Probes include duplicate ballots in one election, legitimate ballots in another election, ineligible voters, cross-election and missing candidates, NULL ballot fields, blank labels, duplicate eligibility and protection of referenced roster rows. Extra optional columns are accepted. The checker follows the stated interface; it is not a proof of all possible security properties.

Eligibility is an authoritative verified roster snapshot supplied outside this model. Ballots are identifiable in this learning design. Authentication, secret-ballot requirements, roster provisioning, election deadlines, auditability and tie policies require explicit additional requirements and controls. A uniqueness constraint prevents duplicate stored ballots within its scope; it does not by itself prevent impersonation or all fraud.

## Query workbench

Ten read-only SELECT/WITH tasks cover INNER/LEFT joins, composite join keys, ON versus WHERE, zero counts, GROUP BY/HAVING, SUM/AVG/COUNT with NULL, pre-aggregated turnout, tied leaders, NOT EXISTS, blank normalization and validated numeric-string parsing. Checks compare columns and results on two datasets. The additional fixture includes zero eligible voters, ties, an extra zero-vote candidate, blanks, valid prefixes and overlong/malformed values.

An accessible clause-order exercise distinguishes logical processing from physical optimizer execution. Cleaning examples explain SQLite CAST behavior and show SQL Server TRY_CONVERT as a comparison only. T-SQL examples do not execute in the SQLite runtime.

## Rehearsal and persistence

Seven verbal prompts, six self-review items and reflection notes support a two-part screen rehearsal. Practice timing is a suggested learner plan, not an employer claim. DDL, drafts, passes and response notes save under pnix-sql-assessment-prep-v1 in the current browser. Downloads export notes as text. SQL workers are disposable, limited to 500 result rows and eight seconds; DDL accepts CREATE statements only. Query practice uses the reference schema independently of the learner DDL draft.

Run `node tests/sql-assessment-prep.mjs` with Node 24+ from the repository root. The bundled sql.js engine requires no package installation. Serve site/ over HTTP for preview.

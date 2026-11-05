# Section 5 change log

## 2026-11-04 — SQL Screening Readiness, Form A

Status: implemented following owner approval of the content, scoped implementation, testing outcomes, and documentation finalization.

### Change

Replaced the election-centered Section 5 guided preparation with the approved independent SQL readiness assessment:

- Part A schema design: 20 points.
- Part B eight SQL questions: 50 points.
- Part C two troubleshooting tasks: 20 points.
- Part D five explanations: 10 points.
- Added the 90-minute persisted attempt, frozen submissions, post-submission evidence checks, human partial-credit marking, critical-error review, remediation notes, and JSON/text export with reviewer handoff.
- Isolated new progress from previous exercise completion and distinguished familiar retakes from unseen attempts.
- Added explicit first-form status; did not add Form B or claim two-form readiness or employer certification.

Implementation commit: [c591ed6](https://github.com/jthatcher87/pnixstudio-agile-mastery/commit/c591ed68f946bd5b5d3a574743faf651867e4387).

### Scope

Only the Section 5 page, data, application, model, runner, stylesheet, and dedicated tests changed in the implementation commit. Sections 1–4 and shared course files were preserved. This finalization updates only this change log and the Section 5 README; it makes no runtime changes.

### Accepted verification

76 readiness checks passed; the reference schema passed 23 behavior probes. Existing suites passed 31 exam, 28 interview, and 33 scripting checks. Static structure checks passed. Live desktop browser verification covered execution, feedback boundaries, refresh recovery, keyboard focus, frozen submission, reviewer validation, download, and submitted-state persistence. GitHub Pages deployment succeeded.

### Known limits and follow-up

- Real-browser narrow-screen rendering remains unverified.
- Form B requires a separate content review and approval.
- The actual hiring screen's engine, format, duration, tools and passing standard remain unconfirmed.
- Candidate readiness requires assessed candidate performance; software checks do not establish it.
- Browser-local records and reviewer identities are not authenticated or proctored.

The owner approved the reported testing outcomes before authorizing this documentation and change-log finalization.

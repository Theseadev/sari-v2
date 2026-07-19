# Task for worker

[Read from: C:\laragon\www\sari-v2\context.md, C:\laragon\www\sari-v2\plan.md]

You are implementing features for a Hono.js + MySQL library app at C:/laragon/www/sari-v2. Your task: Create a new controller file at C:/laragon/www/sari-v2/src/controllers/categories.ts that provides full CRUD for the categories table.

Look at the existing pattern in C:/laragon/www/sari-v2/src/controllers/admin/faculties.ts and copy the exact same pattern but for categories. The categories table has: id, name, slug, description, created_at.

The controller should export: list, createForm, store, editForm, update, remove functions.
Use the same imports, helpers, layout function, and admin layout pattern.
Use the same admin sidebar navigation as other admin pages.
Keep it minimal — copy faculties.ts and adapt for categories.

Write the file directly.

---
Update progress at: C:\laragon\www\sari-v2\.pi-subagents\artifacts\progress\c149841f-c8fa-4f6c-a621-af2a0a9cb16f\progress.md

## Acceptance Contract
Acceptance level: reviewed
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope
- criterion-2: Return evidence sufficient for an independent acceptance review

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Review gate: required by reviewer.

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```
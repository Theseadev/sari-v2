# Task for worker

[Read from: C:\laragon\www\sari-v2\context.md, C:\laragon\www\sari-v2\plan.md]

You are implementing features for a Hono.js + MySQL library app at C:/laragon/www/sari-v2. Your task: Create a database migration file at C:/laragon/www/sari-v2/database/migration_v3.sql that adds these tables to the sari_v2 database:

1. password_resets — for forgot password flow:
- id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
- user_id INT UNSIGNED NOT NULL (FK to users.id)
- token VARCHAR(64) NOT NULL UNIQUE
- expires_at DATETIME NOT NULL
- used TINYINT(1) DEFAULT 0
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- INDEX on user_id and token

2. bookmarks — users can save/bookmark books:
- id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
- user_id INT UNSIGNED NOT NULL (FK to users.id)
- book_id INT UNSIGNED NOT NULL (FK to books.id)
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- UNIQUE KEY on (user_id, book_id)
- INDEX on user_id and book_id

3. reading_history — track which books a user has opened:
- id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
- user_id INT UNSIGNED NOT NULL (FK to users.id)
- book_id INT UNSIGNED NOT NULL (FK to books.id)
- last_page INT UNSIGNED DEFAULT 0
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- UNIQUE KEY on (user_id, book_id)
- INDEX on user_id

Use ENGINE=InnoDB, charset utf8mb4_unicode_ci. Include USE sari_v2; at the top. Write the file directly.

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
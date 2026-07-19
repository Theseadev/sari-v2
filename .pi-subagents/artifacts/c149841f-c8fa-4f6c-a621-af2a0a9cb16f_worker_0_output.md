Implemented migration_v3.sql with all three tables.
Changed files: database/migration_v3.sql (created).
Validation: Migration applied to MySQL 8.4.3 on Laragon — all 3 tables created, all FKs/UNIQUE/INDEX confirmed via DESCRIBE and information_schema.
Open risks/questions: none.
Recommended next step: Build routes/models for password resets, bookmarks, reading history.
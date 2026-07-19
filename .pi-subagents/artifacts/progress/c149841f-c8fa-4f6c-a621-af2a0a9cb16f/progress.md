# Progress

## Status
Completed

## Tasks
- [x] Create migration_v3.sql with password_resets, bookmarks, reading_history tables
- [x] Applied migration against local MySQL — all tables created successfully
- [x] Verified schema: columns, types, defaults, FKs, indexes, unique keys

## Files Changed
- `database/migration_v3.sql` — new file

## Notes
- FKs use ON DELETE CASCADE (clean user/book deletion propagates)
- MySQL 8.4.3 on Laragon confirmed: migration runs cleanly, all constraints verified via information_schema

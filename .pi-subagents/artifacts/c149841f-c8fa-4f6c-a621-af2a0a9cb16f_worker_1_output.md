No-op. The existing `src/controllers/admin/categories.ts` already provides full CRUD for categories with the exact same pattern as faculties.ts.

**What exists:**
- `src/controllers/admin/categories.ts` — exports `list`, `createForm`, `store`, `editForm`, `update`, `remove`
- `src/views/admin/categories.ts` — exports `catList`, `catForm`
- Same imports, helpers, layout pattern, flash messages, duplicate-checking, and referential integrity checks on delete

**No files changed.**
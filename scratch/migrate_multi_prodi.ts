import { query } from "../src/config/database";

async function main() {
    console.log("=== MIGRATION: Multi-Prodi per Book ===");

    // 1. Create table book_programs if not exists
    await query(`
        CREATE TABLE IF NOT EXISTS book_programs (
            book_id INT UNSIGNED NOT NULL,
            program_id INT UNSIGNED NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (book_id, program_id),
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✅ Table book_programs ready!");

    // 2. Migrate existing single program_id into book_programs
    const existingBooks = await query<{ id: number; program_id: number | null }[]>(
        "SELECT id, program_id FROM books WHERE program_id IS NOT NULL AND program_id > 0"
    );

    for (const b of existingBooks) {
        if (b.program_id) {
            await query(
                "INSERT IGNORE INTO book_programs (book_id, program_id) VALUES (?, ?)",
                [b.id, b.program_id]
            );
        }
    }
    console.log(`✅ Migrated ${existingBooks.length} existing single-prodi mappings to book_programs!`);

    // 3. Add Multi-Prodi dummy data for books
    const books = await query<{ id: number; title: string }[]>("SELECT id, title FROM books ORDER BY id LIMIT 5");

    if (books.length >= 3) {
        // Book 1 -> both TI (11) & SI (9)
        await query("INSERT IGNORE INTO book_programs (book_id, program_id) VALUES (?, 9), (?, 11)", [books[0].id, books[0].id]);
        console.log(`✅ Book "${books[0].title}" (ID ${books[0].id}) assigned to both SI & TI!`);

        // Book 2 -> both Kebidanan (1) & Keperawatan (2)
        await query("INSERT IGNORE INTO book_programs (book_id, program_id) VALUES (?, 1), (?, 2)", [books[1].id, books[1].id]);
        console.log(`✅ Book "${books[1].title}" (ID ${books[1].id}) assigned to both Kebidanan & Keperawatan!`);

        // Book 3 -> both Sarjana Akuntansi (5) & Sarjana Manajemen (7)
        await query("INSERT IGNORE INTO book_programs (book_id, program_id) VALUES (?, 5), (?, 7)", [books[2].id, books[2].id]);
        console.log(`✅ Book "${books[2].title}" (ID ${books[2].id}) assigned to both Akuntansi & Manajemen!`);
    }

    // 4. Verify book_programs entries
    const sample = await query(`
        SELECT bp.book_id, b.title, GROUP_CONCAT(p.name SEPARATOR ', ') AS prodi_list
        FROM book_programs bp
        JOIN books b ON b.id = bp.book_id
        JOIN programs p ON p.id = bp.program_id
        GROUP BY bp.book_id, b.title
        HAVING COUNT(bp.program_id) > 1
        LIMIT 5
    `);
    console.log("📌 MULTI-PRODI BOOKS IN DB:", JSON.stringify(sample, null, 2));

    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});

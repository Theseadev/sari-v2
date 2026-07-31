import { query } from "../src/config/database";

async function main() {
    console.log("=== FIXING DB TABLE ALIAS: book_program ===");

    // Create table book_programs if not exists
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

    // Create view or table book_program as alias
    try {
        await query(`CREATE OR REPLACE VIEW book_program AS SELECT * FROM book_programs`);
        console.log("✅ View book_program created successfully!");
    } catch (e: any) {
        console.error("View create failed, creating table:", e.message);
        await query(`
            CREATE TABLE IF NOT EXISTS book_program (
                book_id INT UNSIGNED NOT NULL,
                program_id INT UNSIGNED NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (book_id, program_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    }

    process.exit(0);
}

main().catch(console.error);

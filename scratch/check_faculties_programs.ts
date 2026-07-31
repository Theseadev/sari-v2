import { query } from "../src/config/database";

async function main() {
    const faculties = await query("SELECT * FROM faculties ORDER BY id");
    console.log("FACULTIES:", JSON.stringify(faculties, null, 2));

    const programs = await query("SELECT p.*, f.name as faculty_name FROM programs p LEFT JOIN faculties f ON f.id = p.faculty_id ORDER BY p.faculty_id, p.id");
    console.log("PROGRAMS:", JSON.stringify(programs, null, 2));

    process.exit(0);
}

main().catch(console.error);

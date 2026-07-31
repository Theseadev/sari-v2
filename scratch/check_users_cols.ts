import { query } from "../src/config/database";

async function main() {
    const cols = await query("DESCRIBE users");
    console.log("USERS TABLE COLUMNS:", JSON.stringify(cols, null, 2));
    process.exit(0);
}

main().catch(console.error);

import { DB } from "../src/config/app";
import { query } from "../src/config/database";

async function test() {
    console.log("DB Config:", { host: DB.host, user: DB.user, database: DB.database, passLength: DB.password ? DB.password.length : 0 });
    try {
        const res = await query("SELECT COUNT(*) AS cnt FROM books");
        console.log("SUCCESS! Count:", res);
    } catch (err: any) {
        console.error("DB ERROR:", err.message);
    }
    process.exit(0);
}

test();

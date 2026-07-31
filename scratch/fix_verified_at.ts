import { query } from "../src/config/database";

async function main() {
    console.log("=== ADDING MISSING COLUMN: verified_at to users table ===");

    try {
        await query("ALTER TABLE users ADD COLUMN verified_at DATETIME NULL AFTER status");
        console.log("✅ Column verified_at added to users table!");
    } catch (err: any) {
        if (err.message.includes("Duplicate column name")) {
            console.log("ℹ️ Column verified_at already exists.");
        } else {
            throw err;
        }
    }

    // Set verified_at for existing users so they can log in
    await query("UPDATE users SET verified_at = created_at WHERE verified_at IS NULL");
    console.log("✅ Updated verified_at for existing users!");

    process.exit(0);
}

main().catch(console.error);

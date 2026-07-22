// src/config/database.ts - Pool koneksi MySQL (Prepared Statements)

import mysql from "mysql2/promise";
import { DB } from "./app";

export const pool = mysql.createPool(DB);

// Ponytail: any[] kompatibel mysql2 — type narrowing di caller
export async function query<T = any>(
	sql: string,
	params: any[] = [],
): Promise<T> {
	const [rows] = await pool.execute(sql, params);
	return rows as T;
}

export async function queryOne<T = any>(
	sql: string,
	params: any[] = [],
): Promise<T | null> {
	const rows = await query<T[]>(sql, params);
	return rows[0] ?? null;
}

// queryRaw — uses pool.query() instead of pool.execute() to avoid
// prepared-statement issues (e.g. LIKE binding in mysql2 v3).
// Same signature as query().
export async function queryRaw<T = any>(
	sql: string,
	params: any[] = [],
): Promise<T> {
	const [rows] = await pool.query(sql, params);
	return rows as T;
}

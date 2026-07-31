// src/config/database.ts - Pool koneksi MySQL (Prepared Statements)

import mysql from "mysql2/promise";
import { DB } from "./app";

export function getPool() {
	const currentPass = process.env.DB_PASS || "(19)Rasha*";
	if (!DB.password || DB.password !== currentPass) {
		DB.password = currentPass;
		pool = mysql.createPool(DB);
	}
	return pool;
}

export let pool = mysql.createPool({ ...DB, password: process.env.DB_PASS || "(19)Rasha*" });

// Ponytail: any[] kompatibel mysql2 — type narrowing di caller
export async function query<T = any>(
	sql: string,
	params: any[] = [],
): Promise<T> {
	try {
		const [rows] = await getPool().execute(sql, params);
		return rows as T;
	} catch (err: any) {
		if (err && err.code === "ER_ACCESS_DENIED_ERROR") {
			const envPass = process.env.DB_PASS || "(19)Rasha*";
			DB.password = envPass;
			pool = mysql.createPool(DB);
			const [rows] = await pool.execute(sql, params);
			return rows as T;
		}
		throw err;
	}
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
	try {
		const [rows] = await getPool().query(sql, params);
		return rows as T;
	} catch (err: any) {
		if (err && err.code === "ER_ACCESS_DENIED_ERROR") {
			const envPass = process.env.DB_PASS || "(19)Rasha*";
			DB.password = envPass;
			pool = mysql.createPool(DB);
			const [rows] = await pool.query(sql, params);
			return rows as T;
		}
		throw err;
	}
}

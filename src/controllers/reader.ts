// src/controllers/reader.ts — Reader endpoints (save page, etc)

import type { Context } from "hono";
import { query } from "../config/database";
import { getUser } from "../helpers";

export async function savePage(c: Context) {
	const user = getUser(c);
	if (!user) return c.body("Unauthorized", 401);

	const body = await c.req.parseBody();
	const bookId = Number(body.book_id);
	const page = Number(body.page);

	if (!bookId || !page) return c.body("Bad request", 400);

	await query(
		"INSERT INTO reading_history (user_id, book_id, last_page) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE last_page = ?, updated_at = CURRENT_TIMESTAMP",
		[user.userId, bookId, page, page],
	);

	return c.body("OK");
}

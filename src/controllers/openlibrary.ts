// src/controllers/openlibrary.ts — OpenLibrary API integration endpoints

import type { Context } from "hono";
import { searchBooks, searchByIsbn, translateToId, downloadCover } from "../services/openlibrary";

/** GET /api/openlibrary/search?q=... — search books from OpenLibrary */
export async function search(c: Context) {
	const q = c.req.query("q")?.trim();
	if (!q) return c.json({ docs: [] });
	const docs = await searchBooks(q, 12);
	return c.json({ docs });
}

/** GET /api/openlibrary/isbn/:isbn — get book data by ISBN */
export async function byIsbn(c: Context) {
	const isbn = c.req.param("isbn")?.replace(/[^0-9X]/gi, "");
	if (!isbn || isbn.length < 10)
		return c.json({ error: "ISBN tidak valid" }, 400);

	const data = await searchByIsbn(isbn);
	if (!data) return c.json({ error: "Buku tidak ditemukan" }, 404);

	// Download cover from OpenLibrary and save locally
	const coverFile = await downloadCover(isbn);
	if (coverFile) data.cover_image = coverFile;

	return c.json(data);
}

/** GET /api/openlibrary/cover?isbn=... — proxy cover image */
export async function coverProxy(c: Context) {
	const isbn = c.req.query("isbn")?.replace(/[^0-9X]/gi, "");
	if (!isbn)
		return c.redirect("https://via.placeholder.com/200x300?text=No+Cover");

	const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
	return c.redirect(url, 302);
}

/** POST /api/translate — translate text to Indonesian */
export async function translate(c: Context) {
	const body = await c.req.parseBody().catch(() => ({}));
	const text = String((body as any).text || "").trim();
	if (!text || text.length < 5)
		return c.json({ error: "Teks terlalu pendek" }, 400);
	const result = await translateToId(text);
	return c.json({ result });
}

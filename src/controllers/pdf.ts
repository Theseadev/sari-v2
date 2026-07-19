// src/controllers/pdf.ts - Proxy aman untuk file PDF

import type { Context } from "hono";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { queryOne } from "../config/database";
import { APP } from "../config/app";
import type { Book } from "../types";
import { getUser } from "./auth";
import { errorPage } from "../views/html";

export async function servePdf(c: Context) {
	const slug = c.req.param("slug");
	const user = getUser(c);

	const book = await queryOne<Book>(
		"SELECT id, title, access_type, file_path FROM books WHERE slug = ? AND status = ?",
		[slug, "active"],
	);

	if (!book) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "File PDF tidak ditemukan."),
			404,
		);
	}

	// Cek akses
	if (book.access_type === "internal") {
		if (
			!user ||
			!["mahasiswa", "admin", "super_admin", "pustakawan"].includes(user.roleName)
		) {
			return c.html(
				errorPage(
					403,
					"Akses Ditolak",
					"Buku ini hanya untuk akses internal kampus.",
				),
				403,
			);
		}
	}

	const filePath = APP.PDF_PATH + book.file_path;

	try {
		const fileStat = await stat(filePath);
		if (!fileStat.isFile()) throw new Error("not a file");

		// Stream PDF dengan header yang mencegah download
		c.res.headers.set("Content-Type", "application/pdf");
		c.res.headers.set(
			"Content-Disposition",
			`inline; filename="${encodeURIComponent(book.title)}.pdf"`,
		);
		c.res.headers.set("Content-Length", String(fileStat.size));
		c.res.headers.set(
			"Cache-Control",
			"no-store, no-cache, must-revalidate, private",
		);
		c.res.headers.set("Pragma", "no-cache");
		c.res.headers.set("Expires", "0");
		c.res.headers.set("X-Content-Type-Options", "nosniff");

		return c.newResponse(createReadStream(filePath) as any);
	} catch {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "File PDF tidak ditemukan."),
			404,
		);
	}
}

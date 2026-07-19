// src/controllers/admin/books.ts — Book CRUD

import type { Context } from "hono";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { query, queryOne } from "../../config/database";
import { APP } from "../../config/app";
import { bookList, bookForm } from "../../views/admin/books";
import { getUser } from "../auth";
import { errorPage } from "../../views/html";
import { getFlash, setFlash } from "../flash";

// ── List ──
export async function list(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const flash = getFlash(c);
	const books = await query<any[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.access_type, b.cover_image,
          b.page_count, b.views, b.created_at,
          pr.name AS program_name
   FROM books b
   LEFT JOIN programs pr ON pr.id = b.program_id
   ORDER BY b.created_at DESC`,
	);
	return c.html(
		bookList(books, { name: user.name, roleName: user.roleName }, "books"),
	);
}

// ── Create Form ──
export async function createForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const progs = await query<
		{ id: number; name: string; faculty_name: string }[]
	>(
		`SELECT p.id, p.name, f.name AS faculty_name FROM programs p JOIN faculties f ON f.id = p.faculty_id ORDER BY f.name, p.name`,
	);
	return c.html(
		bookForm({ name: user.name, roleName: user.roleName }, progs),
	);
}

// ── Store ──
export async function store(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const body = await c.req.parseBody();

	const title = String(body.title || "").trim();
	const author = String(body.author || "").trim();
	if (!title || !author) {
		setFlash(c, "Judul dan penulis wajib diisi.", "danger");
		return c.redirect("/admin/books/create");
	}

	const slug = makeSlug(title);
	const programId = Number(body.program_id) || null;

	// Handle cover upload
	let coverPath: string | null = null;
	const cover = body.cover;
	if (cover && typeof cover === "object" && "arrayBuffer" in cover) {
		const buf = Buffer.from(await cover.arrayBuffer());
		const ext = cover.name.split(".").pop() || "jpg";
		const filename = `${slug}-${Date.now()}.${ext}`;
		await mkdir(APP.COVER_PATH, { recursive: true });
		await writeFile(join(APP.COVER_PATH, filename), buf);
		coverPath = filename;
	}

	// Handle PDF upload
	let filePath: string | null = null;
	let pageCount = 0;
	const pdfFile = body.pdf_file;
	if (pdfFile && typeof pdfFile === "object" && "arrayBuffer" in pdfFile) {
		const buf = Buffer.from(await pdfFile.arrayBuffer());
		const filename = `${slug}-${Date.now()}.pdf`;
		await mkdir(APP.PDF_PATH, { recursive: true });
		await writeFile(join(APP.PDF_PATH, filename), buf);
		filePath = filename;
		pageCount = Math.max(1, Math.round(buf.length / 100_000));
	}

	if (!filePath) {
		setFlash(c, "File PDF wajib diunggah.", "danger");
		return c.redirect("/admin/books/create");
	}

	await query(
		`INSERT INTO books (category_id, program_id, uploaded_by, title, slug, author,
      publisher, publication_year, isbn, description, access_type,
      file_path, cover_image, page_count, file_size)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		[
			1, // default category_id
			programId,
			user.userId,
			title,
			slug,
			author,
			body.publisher || null,
			body.publication_year || null,
			body.isbn || null,
			body.description || null,
			body.access_type || "public",
			filePath,
			coverPath,
			pageCount,
			0,
		],
	);

	await query(
		`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
		[
			user.userId,
			"create_book",
			`Menambah buku: ${title}`,
			c.req.header("x-forwarded-for") || "local",
		],
	);

	setFlash(c, `Buku "${title}" berhasil ditambahkan.`, "success");
	return c.redirect("/admin/books");
}

// ── Edit Form ──
export async function editForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const book = await queryOne<any>("SELECT * FROM books WHERE id = ?", [id]);
	if (!book) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "Buku tidak ditemukan."),
			404,
		);
	}
	const progs = await query<
		{ id: number; name: string; faculty_name: string }[]
	>(
		`SELECT p.id, p.name, f.name AS faculty_name FROM programs p JOIN faculties f ON f.id = p.faculty_id ORDER BY f.name, p.name`,
	);
	return c.html(
		bookForm({ name: user.name, roleName: user.roleName }, progs, book),
	);
}

// ── Update ──
export async function update(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();

	const existing = await queryOne<any>("SELECT * FROM books WHERE id = ?", [
		id,
	]);
	if (!existing) {
		setFlash(c, "Buku tidak ditemukan.", "danger");
		return c.redirect("/admin/books");
	}

	const title = String(body.title || "").trim();
	const author = String(body.author || "").trim();
	if (!title || !author) {
		setFlash(c, "Judul dan penulis wajib diisi.", "danger");
		return c.redirect(`/admin/books/${id}/edit`);
	}

	// Handle cover upload (optional — keep existing if not provided)
	let coverPath = existing.cover_image;
	const cover = body.cover;
	if (cover && typeof cover === "object" && "arrayBuffer" in cover) {
		if (existing.cover_image) {
			await unlink(join(APP.COVER_PATH, existing.cover_image)).catch(
				() => {},
			);
		}
		const ext = cover.name.split(".").pop() || "jpg";
		const filename = `${existing.slug}-${Date.now()}.${ext}`;
		const buf = Buffer.from(await cover.arrayBuffer());
		await mkdir(APP.COVER_PATH, { recursive: true });
		await writeFile(join(APP.COVER_PATH, filename), buf);
		coverPath = filename;
	}

	await query(
		`UPDATE books SET title=?, author=?, publisher=?, publication_year=?, isbn=?,
      description=?, access_type=?, category_id=?, program_id=?, cover_image=?
   WHERE id=?`,
		[
			title,
			author,
			body.publisher || null,
			body.publication_year || null,
			body.isbn || null,
			body.description || null,
			body.access_type || "public",
			1, // default category_id
			Number(body.program_id) || null,
			coverPath,
			id,
		],
	);

	await query(
		`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
		[
			user.userId,
			"update_book",
			`Mengedit buku: ${title}`,
			c.req.header("x-forwarded-for") || "local",
		],
	);

	setFlash(c, `Buku "${title}" berhasil diupdate.`, "success");
	return c.redirect("/admin/books");
}

// ── Delete ──
export async function remove(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const book = await queryOne<any>("SELECT * FROM books WHERE id = ?", [id]);
	if (!book) {
		setFlash(c, "Buku tidak ditemukan.", "danger");
		return c.redirect("/admin/books");
	}

	if (book.file_path) {
		await unlink(join(APP.PDF_PATH, book.file_path)).catch(() => {});
	}
	if (book.cover_image) {
		await unlink(join(APP.COVER_PATH, book.cover_image)).catch(() => {});
	}

	await query("DELETE FROM books WHERE id = ?", [id]);

	await query(
		`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
		[
			user.userId,
			"delete_book",
			`Menghapus buku: ${book.title}`,
			c.req.header("x-forwarded-for") || "local",
		],
	);

	setFlash(c, `Buku "${book.title}" berhasil dihapus.`, "success");
	return c.redirect("/admin/books");
}

// ── Helpers ──
function makeSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 200);
}

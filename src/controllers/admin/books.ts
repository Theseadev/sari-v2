// src/controllers/admin/books.ts — Book CRUD (Many-to-Many with Programs)

import type { Context } from "hono";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import * as XLSX from "xlsx";
import { query, queryOne } from "../../config/database";
import { APP } from "../../config/app";
import { bookList, bookForm, bulkUploadForm } from "../../views/admin/books";
import { getUser } from "../../helpers";
import { errorPage } from "../../views/html";
import { getFlash, setFlash } from "../flash";

// ── List ──
const perPage = 5;

export async function list(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");
	const _flash = getFlash(c);
	const search = (c.req.query("q") || "").trim();
	const access = c.req.query("access") || "";
	const sort = c.req.query("sort") || "newest";
	const page =
		search || access ? 1 : Math.max(1, Number(c.req.query("page")) || 1);
	const limit = search || access ? 999 : perPage;
	const offset = search || access ? 0 : (page - 1) * perPage;

	let whereSql = "";
	const params: (string | number)[] = [];
	if (search) {
		whereSql += " WHERE (b.title LIKE ? OR b.author LIKE ?)";
		const term = `%${search}%`;
		params.push(term, term);
	}
	if (access === "public" || access === "internal") {
		whereSql += whereSql ? " AND" : " WHERE";
		whereSql += " b.access_type = ?";
		params.push(access);
	}

	const orderSql = sort === "oldest" ? "ASC" : "DESC";

	const total = await queryOne<{ cnt: number }>(
		`SELECT COUNT(*) AS cnt FROM books b${whereSql}`,
		params,
	);
	const totalPages =
		search || access ? 1 : Math.ceil((total?.cnt || 0) / perPage);

	const dataParams = [...params];
	const books = await query<any[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.access_type, b.cover_image,
          b.page_count, b.views, b.created_at,
          (SELECT GROUP_CONCAT(p.name SEPARATOR ', ')
           FROM book_program bp JOIN programs p ON p.id = bp.program_id
           WHERE bp.book_id = b.id) AS program_names
   FROM books b${whereSql}
   ORDER BY b.created_at ${orderSql}
   LIMIT ${limit} OFFSET ${offset}`,
		dataParams,
	);
	const isAjax = c.req.header("x-requested-with") === "XMLHttpRequest";
	return c.html(
		bookList(
			books,
			{ name: user.name, roleName: user.roleName },
			"books",
			{ page, totalPages, total: total?.cnt || 0, search, access, sort },
			isAjax,
		),
	);
}

// ── Create Form ──
export async function createForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");
	const facs = await query<{ id: number; name: string }[]>(
		"SELECT id, name FROM faculties ORDER BY name",
	);
	const progs = await query<{ id: number; name: string; faculty_id: number }[]>(
		"SELECT id, name, faculty_id FROM programs ORDER BY faculty_id, name",
	);
	return c.html(
		bookForm({ name: user.name, roleName: user.roleName }, facs, progs),
	);
}

// ── Store ──
export async function store(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");
	const body = await c.req.parseBody({ all: true });

	const title = String(body.title || "").trim();
	const author = String(body.author || "").trim();
	if (!title || !author) {
		setFlash(c, "Judul dan penulis wajib diisi.", "danger");
		return c.redirect("/admin/books/create");
	}

	const slug = makeSlug(title);

	// Parse program_ids from checkbox array
	const rawProdi = body.program_ids;
	let programIds: number[] = [];
	if (rawProdi) {
		const arr = Array.isArray(rawProdi) ? rawProdi : [rawProdi];
		programIds = arr.map(Number).filter((id) => id > 0);
	}

	// Handle cover upload (file upload OR downloaded from OpenLibrary)
	let coverPath: string | null = null;
	const cover = body.cover;
	if (
		cover &&
		typeof cover === "object" &&
		"arrayBuffer" in cover &&
		(cover as any).size > 0
	) {
		const buf = Buffer.from(await cover.arrayBuffer());
		const ext = cover.name.split(".").pop() || "jpg";
		const filename = `${slug}-${Date.now()}.${ext}`;
		await mkdir(APP.COVER_PATH, { recursive: true });
		await writeFile(join(APP.COVER_PATH, filename), buf);
		coverPath = filename;
	}
	if (!coverPath) {
		const dl = body.downloaded_cover;
		if (dl && typeof dl === "string" && dl.startsWith("ol-")) {
			const { existsSync } = await import("node:fs");
			if (existsSync(join(APP.COVER_PATH, dl))) {
				coverPath = dl;
			}
		}
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

	const result = await query<any>(
		`INSERT INTO books (uploaded_by, title, slug, author,
      publisher, publication_year, isbn, description, access_type,
      file_path, cover_image, page_count, file_size)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		[
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

	// biome-ignore lint/suspicious/noExplicitAny: mysql2 result shape
	const bookId = (result as any)?.insertId ?? 0;

	// Sync pivot table
	if (bookId > 0 && programIds.length > 0) {
		const values = programIds.map((pid) => `(${bookId},${pid})`).join(",");
		await query(
			`INSERT INTO book_program (book_id, program_id) VALUES ${values}`,
		);
	}

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
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");
	const id = Number(c.req.param("id"));
	const book = await queryOne<any>("SELECT * FROM books WHERE id = ?", [id]);
	if (!book) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "Buku tidak ditemukan."),
			404,
		);
	}
	// Get current program IDs for this book
	const currentProdi = await query<{ program_id: number }[]>(
		"SELECT program_id FROM book_program WHERE book_id = ?",
		[id],
	);
	book.program_ids = currentProdi.map((r) => r.program_id);

	const facs = await query<{ id: number; name: string }[]>(
		"SELECT id, name FROM faculties ORDER BY name",
	);
	const progs = await query<{ id: number; name: string; faculty_id: number }[]>(
		"SELECT id, name, faculty_id FROM programs ORDER BY faculty_id, name",
	);
	return c.html(
		bookForm({ name: user.name, roleName: user.roleName }, facs, progs, book),
	);
}

// ── Update ──
export async function update(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody({ all: true });

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

	// Parse program_ids from checkbox array
	const rawProdi = body.program_ids;
	let programIds: number[] = [];
	if (rawProdi) {
		const arr = Array.isArray(rawProdi) ? rawProdi : [rawProdi];
		programIds = arr.map(Number).filter((id) => id > 0);
	}

	// Handle cover upload
	let coverPath = existing.cover_image;
	const cover = body.cover;
	if (
		cover &&
		typeof cover === "object" &&
		"arrayBuffer" in cover &&
		(cover as any).size > 0
	) {
		if (existing.cover_image) {
			await unlink(join(APP.COVER_PATH, existing.cover_image)).catch(() => {});
		}
		const ext = cover.name.split(".").pop() || "jpg";
		const filename = `${existing.slug}-${Date.now()}.${ext}`;
		const buf = Buffer.from(await cover.arrayBuffer());
		await mkdir(APP.COVER_PATH, { recursive: true });
		await writeFile(join(APP.COVER_PATH, filename), buf);
		coverPath = filename;
	}
	if (!coverPath || coverPath === existing.cover_image) {
		const dl = body.downloaded_cover;
		if (dl && typeof dl === "string" && dl.startsWith("ol-")) {
			const { existsSync } = await import("node:fs");
			if (existsSync(join(APP.COVER_PATH, dl))) {
				if (existing.cover_image && existing.cover_image !== dl) {
					await unlink(join(APP.COVER_PATH, existing.cover_image)).catch(
						() => {},
					);
				}
				coverPath = dl;
			}
		}
	}

	await query(
		`UPDATE books SET title=?, author=?, publisher=?, publication_year=?, isbn=?,
      description=?, access_type=?, cover_image=?
   WHERE id=?`,
		[
			title,
			author,
			body.publisher || null,
			body.publication_year || null,
			body.isbn || null,
			body.description || null,
			body.access_type || "public",
			coverPath,
			id,
		],
	);

	// Sync pivot table: delete old, insert new
	await query("DELETE FROM book_program WHERE book_id = ?", [id]);
	if (programIds.length > 0) {
		const values = programIds.map((pid) => `(${id},${pid})`).join(",");
		await query(
			`INSERT INTO book_program (book_id, program_id) VALUES ${values}`,
		);
	}

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
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");
	const id = Number(c.req.param("id"));
	const book = await queryOne<any>("SELECT * FROM books WHERE id = ?", [id]);
	if (!book) {
		setFlash(c, "Buku tidak ditemukan.", "danger");
		return c.redirect("/admin/books");
	}

	// Cascade DELETE on book_program is handled by FK, but delete explicitly too
	await query("DELETE FROM book_program WHERE book_id = ?", [id]);

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

// ── Bulk Excel Template ──
export async function bulkTemplate(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");

	const wb = XLSX.utils.book_new();
	const data = [
		{
			Judul: "Buku Ajar Matematika",
			Penulis: "Dr. Budi Santoso",
			Sinopsis: "Buku ajar matematika untuk mahasiswa S1",
			Penerbit: "Erlangga",
			Tahun: 2024,
			ISBN: "978-602-xxx-xxx-1",
			"Program Studi": "Teknologi Informasi, Sistem Informasi",
			Akses: "public",
			"File PDF": "matematika.pdf",
			Cover: "matematika.jpg",
		},
		{
			Judul: "Tesis Analisis Data",
			Penulis: "Siti Aminah",
			Sinopsis: "Tesis analisis data statistik",
			Penerbit: "",
			Tahun: 2023,
			ISBN: "",
			"Program Studi": "Keperawatan",
			Akses: "internal",
			"File PDF": "tesis-siti.pdf",
			Cover: "",
		},
	];

	const ws = XLSX.utils.json_to_sheet(data);

	ws["!cols"] = [
		{ wch: 30 },
		{ wch: 25 },
		{ wch: 40 },
		{ wch: 20 },
		{ wch: 8 },
		{ wch: 20 },
		{ wch: 35 }, // Program Studi (bisa multi, pisahkan koma)
		{ wch: 10 },
		{ wch: 25 },
		{ wch: 20 },
	];

	XLSX.utils.book_append_sheet(wb, ws, "Buku");
	const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

	return new Response(buf, {
		headers: {
			"Content-Type":
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"Content-Disposition": 'attachment; filename="format-upload-buku.xlsx"',
		},
	});
}

// ── Bulk Upload Form ──
export async function bulkForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");

	const facs = await query<{ id: number; name: string }[]>(
		"SELECT id, name FROM faculties ORDER BY name",
	);
	const progs = await query<{ id: number; name: string; faculty_id: number }[]>(
		"SELECT id, name, faculty_id FROM programs ORDER BY faculty_id, name",
	);
	return c.html(
		bulkUploadForm({ name: user.name, roleName: user.roleName }, facs, progs),
	);
}

// ── Bulk Store ──
export async function bulkStore(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");

	const formData = await c.req.formData();

	// Parse Excel file
	const excelFile = formData.get("excel_file");
	if (
		!excelFile ||
		typeof excelFile !== "object" ||
		!("arrayBuffer" in excelFile)
	) {
		setFlash(c, "Upload file Excel (.xlsx).", "danger");
		return c.redirect("/admin/books/bulk");
	}

	const excelBuf = Buffer.from(await excelFile.arrayBuffer());
	const workbook = XLSX.read(excelBuf, { type: "buffer" });
	const sheet = workbook.Sheets[workbook.SheetNames[0]];
	const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

	if (rows.length === 0) {
		setFlash(c, "File Excel kosong.", "danger");
		return c.redirect("/admin/books/bulk");
	}

	// Index PDF files by name
	const pdfFilesRaw = formData.getAll("pdf_files");
	const pdfMap = new Map<string, File>();
	for (const f of pdfFilesRaw) {
		if (f instanceof File) pdfMap.set(f.name, f);
	}

	// Index cover files by name
	const coverFilesRaw = formData.getAll("cover_files");
	const coverMap = new Map<string, File>();
	for (const f of coverFilesRaw) {
		if (f instanceof File) coverMap.set(f.name, f);
	}

	// Fetch all programs for name lookup (case-insensitive)
	const allProgs = await query<{ id: number; name: string }[]>(
		`SELECT id, name FROM programs`,
	);
	// Build lookup map: lowercase trimmed name -> id
	const progMap = new Map<string, number>();
	for (const p of allProgs) {
		progMap.set(p.name.toLowerCase().trim(), p.id);
	}

	await mkdir(APP.PDF_PATH, { recursive: true });
	await mkdir(APP.COVER_PATH, { recursive: true });
	let successCount = 0;
	let failCount = 0;

	for (const row of rows) {
		const title = String(row["Judul"] || row["judul"] || "").trim();
		const author = String(
			row["Penulis"] || row["penulis"] || "Penulis Unknown",
		).trim();
		const description =
			String(row["Sinopsis"] || row["sinopsis"] || "").trim() || null;
		const pub = String(row["Penerbit"] || row["penerbit"] || "").trim() || null;
		const year =
			row["Tahun"] || row["tahun"]
				? Number(row["Tahun"] || row["tahun"])
				: null;
		const isbn = String(row["ISBN"] || row["isbn"] || "").trim() || null;
		const access = String(row["Akses"] || row["akses"] || "public").trim();
		const prodiRaw = String(
			row["Program Studi"] || row["program studi"] || "",
		).trim();
		const pdfName = String(
			row["File PDF"] || row["file pdf"] || row["File_PDF"] || "",
		).trim();
		const coverName = String(row["Cover"] || row["cover"] || "").trim();

		if (!title || !pdfName) {
			failCount++;
			continue;
		}

		const pdfFile = pdfMap.get(pdfName) || pdfMap.get(pdfName + ".pdf");
		if (
			!pdfFile ||
			typeof pdfFile !== "object" ||
			!("arrayBuffer" in pdfFile)
		) {
			failCount++;
			continue;
		}

		// Parse comma-separated program names
		// ponytail: ignores typos silently to keep uploads moving
		const prodiIds: number[] = [];
		if (prodiRaw) {
			const names = prodiRaw.split(",").map((s) => s.trim().toLowerCase());
			for (const n of names) {
				if (!n) continue;
				const pid = progMap.get(n);
				if (pid) prodiIds.push(pid);
			}
		}

		try {
			const slug = `${makeSlug(title)}-${Date.now()}`;

			// Save PDF
			const pdfBuf = Buffer.from(await pdfFile.arrayBuffer());
			const pdfFilename = `${slug}.pdf`;
			await writeFile(join(APP.PDF_PATH, pdfFilename), pdfBuf);

			// Save cover (optional)
			let coverPath: string | null = null;
			if (coverName) {
				const coverFile = coverMap.get(coverName);
				if (
					coverFile &&
					typeof coverFile === "object" &&
					"arrayBuffer" in coverFile
				) {
					const ext = coverName.split(".").pop() || "jpg";
					const buf = Buffer.from(await coverFile.arrayBuffer());
					const filename = `${slug}-cover.${ext}`;
					await writeFile(join(APP.COVER_PATH, filename), buf);
					coverPath = filename;
				}
			}

			const pageCount = Math.max(1, Math.round(pdfBuf.length / 100_000));

			const result = await query<any>(
				`INSERT INTO books (uploaded_by, title, slug, author,
        publisher, publication_year, isbn, description, access_type,
        file_path, cover_image, page_count, file_size)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
				[
					user.userId,
					title,
					slug,
					author,
					pub,
					year,
					isbn,
					description,
					access === "internal" ? "internal" : "public",
					pdfFilename,
					coverPath,
					pageCount,
					pdfBuf.length,
				],
			);

			// biome-ignore lint/suspicious/noExplicitAny: mysql2 result shape
			const bookId = (result as any)?.insertId ?? 0;

			// Sync pivot table
			if (bookId > 0 && prodiIds.length > 0) {
				const values = prodiIds.map((pid) => `(${bookId},${pid})`).join(",");
				await query(
					`INSERT INTO book_program (book_id, program_id) VALUES ${values}`,
				);
			}

			successCount++;
		} catch (e) {
			console.error("Insert error:", e);
			failCount++;
		}
	}

	if (successCount > 0) {
		await query(
			`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
			[
				user.userId,
				"bulk_upload",
				`Upload bulk ${successCount} buku dari Excel`,
				c.req.header("x-forwarded-for") || "local",
			],
		);
	}

	const msg =
		failCount > 0
			? `${successCount} buku berhasil, ${failCount} gagal.`
			: `${successCount} buku berhasil diupload.`;
	setFlash(c, msg, successCount > 0 ? "success" : "danger");
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

// ── API: Get programs by faculty (for AJAX on form) ──
export async function programsByFaculty(c: Context) {
	const facId = Number(c.req.param("facultyId"));
	if (!facId) return c.json([]);
	const progs = await query<{ id: number; name: string }[]>(
		"SELECT id, name FROM programs WHERE faculty_id = ? ORDER BY name",
		[facId],
	);
	return c.json(progs);
}

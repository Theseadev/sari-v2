// src/controllers/bookmarks.ts — Bookmarks & Reading History

import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { query, queryOne } from "../config/database";
import { layout } from "../views/html";
import { getUser, getFlash, setFlashRedirect, esc } from "../helpers";

// Toggle bookmark (POST)
export async function toggle(c: Context) {
	const user = getUser(c);
	if (!user) return setFlashRedirect(c, "/login", "Silakan masuk terlebih dahulu.", "danger");

	const bookId = Number(c.req.param("id"));
	if (!bookId) return c.redirect("/buku");

	const existing = await queryOne<{ id: number }>(
		"SELECT id FROM bookmarks WHERE user_id = ? AND book_id = ?",
		[user.userId, bookId],
	);

	if (existing) {
		await query("DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?", [user.userId, bookId]);
		// Log activity
		const book = await queryOne<{ title: string }>("SELECT title FROM books WHERE id = ?", [bookId]);
		const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "local";
		await query(
			"INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)",
			[user.userId, "remove_bookmark", `Hapus bookmark: ${book?.title ?? "#" + bookId}`, ip],
		);
		setCookie(c, "flash", JSON.stringify({ type: "info", message: "Bookmark dihapus." }), { httpOnly: true, path: "/", maxAge: 5 });
	} else {
		await query("INSERT INTO bookmarks (user_id, book_id) VALUES (?, ?)", [user.userId, bookId]);
		// Log activity
		const book = await queryOne<{ title: string }>("SELECT title FROM books WHERE id = ?", [bookId]);
		const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "local";
		await query(
			"INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)",
			[user.userId, "add_bookmark", `Tambah bookmark: ${book?.title ?? "#" + bookId}`, ip],
		);
		setCookie(c, "flash", JSON.stringify({ type: "success", message: "Berhasil ditambahkan ke bookmark!" }), { httpOnly: true, path: "/", maxAge: 5 });
	}

	// Redirect back to referrer or book detail
	const referer = c.req.header("referer") || "/buku";
	return c.redirect(referer);
}

// Modal content for bookmarks (AJAX)
export async function modal(c: Context) {
	const user = getUser(c);
	if (!user) return c.html("<p style='padding:20px;text-align:center;color:var(--text-muted)'>Silakan masuk terlebih dahulu.</p>");

	const books = await query<{ id: number; title: string; slug: string; author: string; cover_image: string | null; access_type: string }[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.cover_image, b.access_type
		 FROM bookmarks bm JOIN books b ON b.id = bm.book_id
		 WHERE bm.user_id = ? AND b.status = 'active'
		 ORDER BY bm.created_at DESC
		 LIMIT 200`,
		[user.userId],
	);

	if (books.length === 0) {
		return c.html(`<div style="text-align:center;padding:40px 20px">
			<div style="font-size:2.5rem;margin-bottom:12px">🔖</div>
			<h3 style="font-family:var(--font-heading);margin-bottom:8px;color:var(--text-heading)">Belum ada bookmark</h3>
			<p style="color:var(--text-muted);font-size:0.88rem">Bookmark buku favorit dari detail buku.</p>
		</div>`);
	}

	const cards = books.map((b) => `
		<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-light)">
			<div style="width:45px;height:60px;border-radius:6px;overflow:hidden;background:var(--bg-warm);flex-shrink:0;display:flex;align-items:center;justify-content:center">
				${b.cover_image ? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="" style="width:100%;height:100%;object-fit:cover">` : `<span style="color:var(--text-dim)">📖</span>`}
			</div>
			<div style="flex:1;min-width:0">
				<div style="font-weight:600;font-size:0.85rem;color:var(--text-heading);white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><a href="/buku/${esc(b.slug)}" style="color:inherit;text-decoration:none">${esc(b.title)}</a></div>
				<div style="font-size:0.78rem;color:var(--text-muted);font-style:italic">${esc(b.author)}</div>
			</div>
			<form method="POST" action="/bookmark/${b.id}/toggle" style="margin:0;flex-shrink:0">
				<button type="submit" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.75rem;font-weight:600">Hapus</button>
			</form>
		</div>`).join("");

	return c.html(`<div style="max-height:400px;overflow-y:auto">${cards}</div>`);
}

// List bookmarks (GET /bookmark)
export async function list(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const flash = getFlash(c);
	const search = (c.req.query("q") || "").trim();

	let whereExtra = "";
	const params: (string | number)[] = [user.userId];
	if (search) {
		whereExtra = " AND (b.title LIKE ? OR b.author LIKE ?)";
		const term = `%${search}%`;
		params.push(term, term);
	}

	const books = await query<{ id: number; title: string; slug: string; author: string; cover_image: string | null; access_type: string; created_at: string }[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.cover_image, b.access_type, bm.created_at
		 FROM bookmarks bm JOIN books b ON b.id = bm.book_id
		 WHERE bm.user_id = ? AND b.status = 'active'${whereExtra}
		 ORDER BY bm.created_at DESC
		 LIMIT 200`,
		params,
	);

	let bookCards = "";
	if (books.length === 0) {
		bookCards = `
			<div class="empty-state">
				<div class="empty-icon">🔖</div>
				<h3>${search ? "Buku tidak ditemukan" : "Belum ada bookmark"}</h3>
				<p>${search ? "Coba kata kunci lain." : "Simpan buku favoritmu dengan menekan tombol bookmark di halaman katalog."}</p>
				${search ? `<a href="/bookmark" class="btn btn-primary" style="margin-top:16px">Reset Pencarian</a>` : `<a href="/buku" class="btn btn-primary" style="margin-top:16px">Jelajahi Katalog →</a>`}
			</div>`;
	} else {
		bookCards = books.map((b) => `
			<div class="book-card" data-book-slug="${esc(b.slug)}">
				<div class="cover-wrap">
					${b.cover_image ? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="${esc(b.title)}" loading="lazy">` : `<div class="cover-placeholder">📖</div>`}
					<span class="access-badge ${b.access_type}">${b.access_type === "internal" ? "Internal" : "Publik"}</span>
					<form method="POST" action="/bookmark/${b.id}/toggle" style="position:absolute;top:10px;left:10px;margin:0;z-index:2">
						<button type="submit" class="btn-bookmark-remove" title="Hapus bookmark">✕</button>
					</form>
				</div>
				<div class="info">
					<h3><a href="/buku/${esc(b.slug)}">${esc(b.title)}</a></h3>
					<div class="author">${esc(b.author)}</div>
					<div class="meta">
						<span class="meta-stat">
							<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
							${new Date(b.created_at).toLocaleDateString("id-ID")}
						</span>
						<form method="POST" action="/bookmark/${b.id}/toggle" style="margin:0">
							<button type="submit" class="btn-remove-sm">Hapus</button>
						</form>
					</div>
				</div>
			</div>`).join("");
	}

	const searchForm = `
		<form method="GET" action="/bookmark" style="display:flex;gap:8px;margin-bottom:24px">
			<input type="text" name="q" placeholder="Cari judul atau penulis..." value="${esc(search)}" style="flex:1;padding:10px 16px;border:1px solid var(--border);border-radius:8px;font-size:0.9rem;background:var(--bg-card);color:var(--text);outline:none">
			<button type="submit" class="btn btn-primary" style="padding:10px 20px;border:none;border-radius:8px;font-weight:600;cursor:pointer">Cari</button>
			${search ? `<a href="/bookmark" class="btn btn-outline" style="display:inline-flex;align-items:center;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.85rem">Reset</a>` : ""}
		</form>`;

	const html = layout(
		"Bookmark Saya",
		`<section class="section" style="margin-top:56px">
			<div class="container">
				<div class="page-hero-sm">
					<h1>🔖 Bookmark Saya</h1>
					<p>${books.length} buku tersimpan</p>
				</div>
				${searchForm}
				<div class="book-grid">${bookCards}</div>
			</div>
		</section>`,
		user,
		flash,
	);
	return c.html(html);
}

// Reading history modal (AJAX)
export async function historyModal(c: Context) {
	const user = getUser(c);
	if (!user) return c.html("<p style='padding:20px;text-align:center;color:var(--text-muted)'>Silakan masuk terlebih dahulu.</p>");

	const books = await query<{ id: number; title: string; slug: string; author: string; cover_image: string | null; access_type: string; last_page: number; updated_at: string }[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.cover_image, b.access_type, rh.last_page, rh.last_page, rh.updated_at
		 FROM reading_history rh JOIN books b ON b.id = rh.book_id
		 WHERE rh.user_id = ? AND b.status = 'active'
		 ORDER BY rh.updated_at DESC LIMIT 50`,
		[user.userId],
	);

	if (books.length === 0) {
		return c.html(`<div style="text-align:center;padding:40px 20px">
			<div style="font-size:2.5rem;margin-bottom:12px">📖</div>
			<h3 style="font-family:var(--font-heading);margin-bottom:8px;color:var(--text-heading)">Belum ada riwayat</h3>
			<p style="color:var(--text-muted);font-size:0.88rem">Mulai baca buku dan riwayatmu akan muncul di sini.</p>
		</div>`);
	}

	const cards = books.map((b) => `
		<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-light)">
			<div style="width:45px;height:60px;border-radius:6px;overflow:hidden;background:var(--bg-warm);flex-shrink:0;display:flex;align-items:center;justify-content:center">
				${b.cover_image ? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="" style="width:100%;height:100%;object-fit:cover">` : `<span style="color:var(--text-dim)">📖</span>`}
			</div>
			<div style="flex:1;min-width:0">
				<div style="font-weight:600;font-size:0.85rem;color:var(--text-heading);white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><a href="/buku/${esc(b.slug)}" style="color:inherit;text-decoration:none">${esc(b.title)}</a></div>
				<div style="font-size:0.78rem;color:var(--text-muted);font-style:italic">${esc(b.author)}</div>
				<div style="font-size:0.72rem;color:var(--text-dim);margin-top:2px">Hal. ${b.last_page} · ${new Date(b.updated_at).toLocaleDateString("id-ID")}</div>
			</div>
		</div>`).join("");

	return c.html(`<div style="max-height:400px;overflow-y:auto">${cards}</div>`);
}

// Reading history (GET /riwayat)
export async function history(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const flash = getFlash(c);
	const search = (c.req.query("q") || "").trim();

	let whereExtra = "";
	const params: (string | number)[] = [user.userId];
	if (search) {
		whereExtra = " AND (b.title LIKE ? OR b.author LIKE ?)";
		const term = `%${search}%`;
		params.push(term, term);
	}

	const books = await query<{ id: number; title: string; slug: string; author: string; cover_image: string | null; access_type: string; last_page: number; updated_at: string }[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.cover_image, b.access_type, rh.last_page, rh.updated_at
		 FROM reading_history rh JOIN books b ON b.id = rh.book_id
		 WHERE rh.user_id = ? AND b.status = 'active'${whereExtra}
		 ORDER BY rh.updated_at DESC LIMIT 50`,
		params,
	);

	let bookCards = "";
	if (books.length === 0) {
		bookCards = `
			<div class="empty-state">
				<div class="empty-icon">📖</div>
				<h3>${search ? "Buku tidak ditemukan" : "Belum ada riwayat"}</h3>
				<p>${search ? "Coba kata kunci lain." : "Mulai baca buku dan riwayatmu akan muncul di sini."}</p>
				${search ? `<a href="/riwayat" class="btn btn-primary" style="margin-top:16px">Reset Pencarian</a>` : `<a href="/buku" class="btn btn-primary" style="margin-top:16px">Jelajahi Katalog →</a>`}
			</div>`;
	} else {
		bookCards = books.map((b) => `
			<div class="book-card" data-book-slug="${esc(b.slug)}">
				<div class="cover-wrap">
					${b.cover_image ? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="${esc(b.title)}" loading="lazy">` : `<div class="cover-placeholder">📖</div>`}
					<span class="access-badge ${b.access_type}">${b.access_type === "internal" ? "Internal" : "Publik"}</span>
				</div>
				<div class="info">
					<h3><a href="/buku/${esc(b.slug)}">${esc(b.title)}</a></h3>
					<div class="author">${esc(b.author)}</div>
					<div class="meta">
						<span class="meta-stat">
							<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
							Hal. ${b.last_page}
						</span>
						<span class="meta-stat">
							<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
							${new Date(b.updated_at).toLocaleDateString("id-ID")}
						</span>
					</div>
				</div>
			</div>`).join("");
	}

	const searchForm = `
		<form method="GET" action="/riwayat" style="display:flex;gap:8px;margin-bottom:24px">
			<input type="text" name="q" placeholder="Cari judul atau penulis..." value="${esc(search)}" style="flex:1;padding:10px 16px;border:1px solid var(--border);border-radius:8px;font-size:0.9rem;background:var(--bg-card);color:var(--text);outline:none">
			<button type="submit" class="btn btn-primary" style="padding:10px 20px;border:none;border-radius:8px;font-weight:600;cursor:pointer">Cari</button>
			${search ? `<a href="/riwayat" class="btn btn-outline" style="display:inline-flex;align-items:center;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.85rem">Reset</a>` : ""}
		</form>`;

	const html = layout(
		"Riwayat Baca",
		`<section class="section" style="margin-top:56px">
			<div class="container">
				<div class="page-hero-sm">
					<h1>📖 Riwayat Baca</h1>
					<p>${books.length} buku pernah dibaca</p>
				</div>
				${searchForm}
				<div class="book-grid">${bookCards}</div>
			</div>
		</section>`,
		user,
		flash,
	);
	return c.html(html);
}

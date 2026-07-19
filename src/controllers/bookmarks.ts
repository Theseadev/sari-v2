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
		 ORDER BY bm.created_at DESC`,
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

	const books = await query<{ id: number; title: string; slug: string; author: string; cover_image: string | null; access_type: string; created_at: string }[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.cover_image, b.access_type, bm.created_at
		 FROM bookmarks bm JOIN books b ON b.id = bm.book_id
		 WHERE bm.user_id = ? AND b.status = 'active'
		 ORDER BY bm.created_at DESC`,
		[user.userId],
	);

	let bookCards = "";
	if (books.length === 0) {
		bookCards = `
			<div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center">
				<div style="width:80px;height:80px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;margin-bottom:20px;color:var(--primary);font-size:2rem">🔖</div>
				<h3 style="font-family:var(--font-heading);font-size:1.3rem;color:var(--text-heading);margin-bottom:8px;font-weight:400">Belum ada bookmark</h3>
				<p style="color:var(--text-muted);max-width:320px;line-height:1.7">Simpan buku favoritmu dengan menekan tombol bookmark di halaman katalog.</p>
				<a href="/buku" class="btn btn-primary" style="margin-top:16px">Jelajahi Katalog</a>
			</div>`;
	} else {
		bookCards = books.map((b) => `
			<div class="book-card" data-book-slug="${esc(b.slug)}">
				<div class="cover-wrap">
					${b.cover_image ? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="${esc(b.title)}" loading="lazy">` : `<div class="book-placeholder">📖</div>`}
					<span class="access-badge ${b.access_type}">${b.access_type}</span>
				</div>
				<div class="info">
					<h3><a href="/buku/${esc(b.slug)}">${esc(b.title)}</a></h3>
					<div class="author">${esc(b.author)}</div>
					<div style="display:flex;gap:8px;margin-top:8px">
						<form method="POST" action="/bookmark/${b.id}/toggle" style="margin:0">
							<button type="submit" class="btn btn-sm" style="color:var(--danger)">✕ Hapus</button>
						</form>
					</div>
				</div>
			</div>`).join("");
	}

	const html = layout(
		"Bookmark Saya",
		`<section class="section" style="margin-top:64px">
			<div class="container">
				<div class="section-title">
					<span>🔖 Bookmark Saya</span>
					<span class="count">${books.length} buku</span>
				</div>
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

	const books = await query<{ id: number; title: string; slug: string; author: string; cover_image: string | null; access_type: string; last_page: number; updated_at: string }[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.cover_image, b.access_type, rh.last_page, rh.updated_at
		 FROM reading_history rh JOIN books b ON b.id = rh.book_id
		 WHERE rh.user_id = ? AND b.status = 'active'
		 ORDER BY rh.updated_at DESC LIMIT 50`,
		[user.userId],
	);

	let bookCards = "";
	if (books.length === 0) {
		bookCards = `
			<div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center">
				<div style="width:80px;height:80px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;margin-bottom:20px;color:var(--primary);font-size:2rem">📖</div>
				<h3 style="font-family:var(--font-heading);font-size:1.3rem;color:var(--text-heading);margin-bottom:8px;font-weight:400">Belum ada riwayat</h3>
				<p style="color:var(--text-muted);max-width:320px;line-height:1.7">Mulai baca buku dan riwayatmu akan muncul di sini.</p>
				<a href="/buku" class="btn btn-primary" style="margin-top:16px">Jelajahi Katalog</a>
			</div>`;
	} else {
		bookCards = books.map((b) => `
			<div class="book-card" data-book-slug="${esc(b.slug)}">
				<div class="cover-wrap">
					${b.cover_image ? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="${esc(b.title)}" loading="lazy">` : `<div class="book-placeholder">📖</div>`}
					<span class="access-badge ${b.access_type}">${b.access_type}</span>
				</div>
				<div class="info">
					<h3><a href="/buku/${esc(b.slug)}">${esc(b.title)}</a></h3>
					<div class="author">${esc(b.author)}</div>
					<div style="font-size:0.72rem;color:var(--text-dim);margin-top:6px">Terakhir dilihat: ${new Date(b.updated_at).toLocaleDateString("id-ID")}</div>
				</div>
			</div>`).join("");
	}

	const html = layout(
		"Riwayat Baca",
		`<section class="section" style="margin-top:64px">
			<div class="container">
				<div class="section-title">
					<span>📖 Riwayat Baca</span>
					<span class="count">${books.length} buku</span>
				</div>
				<div class="book-grid">${bookCards}</div>
			</div>
		</section>`,
		user,
		flash,
	);
	return c.html(html);
}

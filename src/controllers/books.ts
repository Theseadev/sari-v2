// src/controllers/books.ts - Katalog, detail, flip-book reader

import type { Context } from "hono";
import { query, queryOne } from "../config/database";
import type { Book, Faculty, Program } from "../types";
import { esc } from "../helpers";
import { layout, errorPage } from "../views/html";
import { getUser, getFlash } from "../helpers";

const perPage = 24;

export async function catalog(c: Context) {
	const user = getUser(c);
	const search = c.req.query("q")?.trim() || "";
	const facultyId = Number(c.req.query("faculty")) || 0;
	const programId = Number(c.req.query("program")) || 0;
	const page = Math.max(1, Number(c.req.query("page")) || 1);
	const isPrivileged =
		user &&
		["mahasiswa", "admin", "super_admin", "pustakawan"].includes(user.roleName);
	const flash = getFlash(c);

	let where = "b.status = 'active'";
	const params: unknown[] = [];
	if (!isPrivileged) where += " AND b.access_type = 'public'";
	if (search) {
		// Ponytail: FULLTEXT index 5x lebih cepat dari LIKE
		where +=
			" AND MATCH (b.title, b.author, b.description) AGAINST (? IN BOOLEAN MODE)";
		params.push(search.replace(/[\-+*~"()<>"]/g, " ").trim() + "*");
	}
	if (programId > 0) {
		where += " AND b.program_id = ?";
		params.push(programId);
	} else if (facultyId > 0) {
		where += " AND pr.faculty_id = ?";
		params.push(facultyId);
	}

	const total = await queryOne<{ cnt: number }>(
		`SELECT COUNT(*) AS cnt FROM books b LEFT JOIN programs pr ON pr.id = b.program_id LEFT JOIN faculties f ON f.id = pr.faculty_id WHERE ${where}`,
		params,
	);
	const totalPages = Math.ceil((total?.cnt || 0) / perPage);

	const books = await query<Book[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.access_type,
            b.cover_image, b.page_count, b.views,
            pr.name AS program_name,
            f.name AS faculty_name
     FROM books b
     LEFT JOIN programs pr ON pr.id = b.program_id
     LEFT JOIN faculties f ON f.id = pr.faculty_id
     WHERE ${where} ORDER BY b.created_at DESC LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`,
		params,
	);

	const faculties = await query<Faculty[]>(
		"SELECT id, name, slug FROM faculties ORDER BY name",
	);
	const programs =
		facultyId > 0
			? await query<Program[]>(
					"SELECT id, faculty_id, name, slug FROM programs WHERE faculty_id = ? ORDER BY name",
					[facultyId],
				)
			: await query<Program[]>(
					"SELECT id, faculty_id, name, slug FROM programs ORDER BY name",
				);

	let bookCards = "";
	if (books.length === 0) {
		bookCards = `
			<div class="empty-state" style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center">
				<div class="empty-icon" style="width:80px;height:80px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;margin-bottom:20px;color:var(--primary);font-size:2rem">📚</div>
				<h3 style="font-family:var(--font-heading);font-size:1.3rem;color:var(--text-heading);margin-bottom:8px;font-weight:400">Belum ada koleksi</h3>
				<p style="color:var(--text-muted);max-width:320px;line-height:1.7">Koleksi buku untuk filter ini masih kosong. Coba ubah filter fakultas/prodi atau kata kunci pencarian.</p>
			</div>
		`;
	} else {
		for (const b of books) {
			const cover = b.cover_image
				? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="${esc(b.title)}" loading="lazy">`
				: '<div class="cover-placeholder">—</div>';
			const badge =
				b.access_type === "internal"
					? '<span class="access-badge internal">INTERNAL</span>'
					: '<span class="access-badge public">PUBLIC</span>';

			const prodi = b.program_name
				? "<span>" + esc(b.program_name) + "</span>"
				: "";
			bookCards += `
        <div class="book-card" data-book-slug="${esc(b.slug)}" data-book-title="${esc(b.title)}">
          <div class="cover-wrap">
            ${cover}
            ${badge}
          </div>
          <div class="info">
            <h3>${esc(b.title)}</h3>
            <p class="author">${esc(b.author)}</p>
            <div class="meta">
              ${prodi ? `<span class="meta-badge">${prodi}</span>` : ""}
              <span class="meta-stat"><span class="stat-icon">📄</span>${b.page_count} hlm · 👁 ${b.views}</span>
            </div>
          </div>
        </div>`;
		}
	}

	// Faculty dropdown
	let facItems = `<li data-val="0" class="${facultyId === 0 ? "selected" : ""}">Semua Fakultas</li>`;
	for (const f of faculties) {
		facItems += `<li data-val="${f.id}" class="${f.id === facultyId ? "selected" : ""}">${esc(f.name)}</li>`;
	}

	let progItems = `<li data-val="0" class="${programId === 0 ? "selected" : ""}">Semua Prodi</li>`;
	for (const p of programs) {
		progItems += `<li data-val="${p.id}" class="${p.id === programId ? "selected" : ""}">${esc(p.name)}</li>`;
	}

	function dropdown(
		name: string,
		label: string,
		selected: number,
		items: string,
	): string {
		const selectedLabel = selected === 0 ? label : "";
		return `<div class="dd-wrap" data-name="${name}">
      <input type="hidden" name="${name}" value="${selected}">
      <button type="button" class="dd-trigger"><span class="dd-text" data-placeholder="${label}">${selectedLabel || ""}</span><svg class="dd-arrow" width="16" height="16" viewBox="0 0 12 12"><path fill="currentColor" d="M6 8L1 3h10z"/></svg></button>
      <ul class="dd-list">${items}</ul>
    </div>`;
	}

	// Pagination HTML
	let paginationHtml = "";
	if (totalPages > 1) {
		const qs = new URLSearchParams();
		if (search) qs.set("q", search);
		if (facultyId) qs.set("faculty", String(facultyId));
		if (programId) qs.set("program", String(programId));
		const baseQs = qs.toString();
		const pageLink = (p: number) =>
			`/buku${baseQs ? "?" + baseQs + "&" : "?"}page=${p}`;

		paginationHtml = `
			<nav class="pagination" aria-label="Halaman">
				${page > 1 ? `<a href="${pageLink(page - 1)}" class="btn btn-sm btn-outline">← Sebelumnya</a>` : ""}
				<span class="page-info">Halaman ${page} dari ${totalPages}</span>
				${page < totalPages ? `<a href="${pageLink(page + 1)}" class="btn btn-sm btn-outline">Selanjutnya →</a>` : ""}
			</nav>`;
	}

	const body = `
		<section class="hero">
			<div class="container">
				<div class="hero-badge">Perpustakaan Digital Kampus</div>
				<h1>Temukan & Baca${search ? ` ${esc(search)}` : " Koleksi Digital"}<br>Berdasarkan Fakultas & Prodi</h1>
				<p>Koleksi buku digital, skripsi, jurnal, dan referensi ilmiah<br>Universitas Sari Mulia Banjarmasin</p>
				<form method="GET" action="/buku" class="filter-form">
					<div class="search-box">
						<input type="text" name="q" placeholder="Cari judul, penulis, atau kata kunci..." value="${esc(search)}">
						<button type="submit">Cari</button>
					</div>
					<div class="filter-row">
						${dropdown("faculty", "Semua Fakultas", facultyId, facItems)}
							
						${dropdown("program", "Semua Prodi", programId, progItems)}
					</div>
				</form>
			</div>
		</section>
		<section class="section">
			<div class="container">
				<div class="section-title">
					<span>${search ? `Hasil untuk "${esc(search)}"` : "Semua Koleksi"}</span>
					<span class="count">${books.length} dari ${total?.cnt || 0} buku</span>
				</div>
				<div class="book-grid">${bookCards}</div>
				${paginationHtml}
			</div>
		</section>`;

	return c.html(layout("Katalog Buku", body, user, flash));
}

export async function detail(c: Context) {
	const user = getUser(c);
	const slug = c.req.param("slug");
	const search = c.req.query("q")?.trim() || "";
	const facultyId = Number(c.req.query("faculty")) || 0;
	const programId = Number(c.req.query("program")) || 0;
	const isPrivileged =
		user &&
		["mahasiswa", "admin", "super_admin", "pustakawan"].includes(user.roleName);

	// Build same WHERE as catalog
	let where = "b.status = 'active'";
	const params: unknown[] = [];
	if (!isPrivileged) where += " AND b.access_type = 'public'";
	if (search) {
		where +=
			" AND MATCH (b.title, b.author, b.description) AGAINST (? IN BOOLEAN MODE)";
		params.push(search.replace(/[\-+*~"()<>]/g, " ").trim() + "*");
	}
	if (programId > 0) {
		where += " AND b.program_id = ?";
		params.push(programId);
	} else if (facultyId > 0) {
		where += " AND pr.faculty_id = ?";
		params.push(facultyId);
	}

	// Get current book + prev/next slugs in same filtered order
	const current = await queryOne<Book>(
		`SELECT b.id, b.slug, b.title, b.author, b.access_type,
	            b.cover_image, b.page_count, b.views,
	            b.publisher, b.publication_year, b.isbn, b.description,
	            b.program_id, b.created_at,
	            pr.name AS program_name, f.name AS faculty_name
	     FROM books b
	     LEFT JOIN programs pr ON pr.id = b.program_id
	     LEFT JOIN faculties f ON f.id = pr.faculty_id
	     WHERE ${where} AND b.slug = ?
	     ORDER BY b.created_at DESC LIMIT 1`,
		[...params, slug],
	);

	if (!current) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "Buku tidak ditemukan.", user),
			404,
		);
	}

	if (
		current.access_type === "internal" &&
		(!user ||
			!["mahasiswa", "admin", "super_admin", "pustakawan"].includes(
				user.roleName,
			))
	) {
		return c.html(
			errorPage(
				403,
				"Akses Ditolak",
				"Buku ini hanya untuk akses internal kampus.",
				user,
			),
			403,
		);
	}

	// Check last page (for resume reading)
	let lastPage = 0;
	if (user) {
		const rh = await queryOne<{ last_page: number }>(
			"SELECT last_page FROM reading_history WHERE user_id = ? AND book_id = ?",
			[user.userId, current.id],
		);
		if (rh && rh.last_page > 0) lastPage = rh.last_page;
	}

	// Check if bookmarked
	let isBookmarked = false;
	if (user) {
		const bm = await queryOne<{ id: number }>(
			"SELECT id FROM bookmarks WHERE user_id = ? AND book_id = ?",
			[user.userId, current.id],
		);
		isBookmarked = !!bm;
	}

	// Record reading history
	if (user) {
		await query(
			"INSERT INTO reading_history (user_id, book_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP",
			[user.userId, current.id],
		);
	}

	// Prev/next slugs - use simpler WHERE without joins
	const whereSimple =
		"status = 'active'" +
		(isPrivileged ? "" : " AND access_type = 'public'") +
		(search
			? " AND MATCH (title, author, description) AGAINST (? IN BOOLEAN MODE)"
			: "") +
		(programId > 0
			? " AND program_id = ?"
			: facultyId > 0
				? " AND program_id IN (SELECT id FROM programs WHERE faculty_id = ?)"
				: "");

	const simpleParams: unknown[] = [];
	if (!isPrivileged) {
	}
	if (search)
		simpleParams.push(search.replace(/[\-+*~"()<>]/g, " ").trim() + "*");
	if (programId > 0) simpleParams.push(programId);
	else if (facultyId > 0) simpleParams.push(facultyId);

	const prev = await queryOne<{ slug: string }>(
		`SELECT slug FROM books WHERE ${whereSimple} AND created_at > ? ORDER BY created_at ASC LIMIT 1`,
		[...simpleParams, current.created_at],
	);
	const next = await queryOne<{ slug: string }>(
		`SELECT slug FROM books WHERE ${whereSimple} AND created_at < ? ORDER BY created_at DESC LIMIT 1`,
		[...simpleParams, current.created_at],
	);

	await query("UPDATE books SET views = views + 1 WHERE id = ?", [current.id]);

	const coverHtml = current.cover_image
		? `<img src="/uploads/covers/${esc(current.cover_image)}" alt="${esc(current.title)}">`
		: '<div style="aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;font-size:4rem;background:var(--gray-100);color:var(--gray-300)">—</div>';

	const desc = current.description
		? `<div class="description"><h3>Sinopsis</h3><p>${esc(current.description).replace(/\n/g, "<br>")}</p></div>`
		: "";

	const facProdi = current.faculty_name
		? `<span><strong>Fakultas/Prodi</strong><br>${esc(current.faculty_name)}${current.program_name ? " — " + esc(current.program_name) : ""}</span>`
		: "";

	// Modal-only response
	const modalBody = `
    <div class="modal-overlay show" id="bookModal" role="dialog" aria-modal="true" aria-labelledby="bookModalTitle"
         data-prev="${prev?.slug || ""}" data-next="${next?.slug || ""}"
         data-q="${esc(search)}" data-faculty="${facultyId}" data-program="${programId}">
      <div class="modal-card modal-lg">
        <button class="modal-close" id="closeBookModal" aria-label="Tutup">&times;</button>
        <div class="modal-body">
          <div class="book-modal-grid">
            <div class="book-modal-cover">${coverHtml}</div>
            <div class="book-modal-info">
              <div class="modal-nav">
                ${prev ? `<button class="btn btn-sm btn-outline" data-nav="prev" data-slug="${prev.slug}">← Sebelumnya</button>` : ""}
                ${next ? `<button class="btn btn-sm btn-outline" data-nav="next" data-slug="${next.slug}">Selanjutnya →</button>` : ""}
              </div>
              <h2 id="bookModalTitle">${esc(current.title)}</h2>
              <p class="author">${esc(current.author)}</p>
              <div class="meta-grid">
                ${facProdi}
                ${current.publisher ? `<span><strong>Penerbit</strong><br>${esc(current.publisher)}</span>` : ""}
                ${current.publication_year ? `<span><strong>Tahun</strong><br>${current.publication_year}</span>` : ""}
                ${current.isbn ? `<span><strong>ISBN</strong><br>${esc(current.isbn)}</span>` : ""}
                <span><strong>Halaman</strong><br>${current.page_count || "—"}  ·  <strong>Dilihat</strong><br>${current.views}x</span>
                <span><strong>Akses</strong><br>${current.access_type === "internal" ? "Internal Kampus" : "Publik"}</span>
              </div>
              ${desc}
              <div class="modal-actions">
                <a href="/baca/${esc(current.slug)}" class="btn btn-primary btn-lg">Baca Online</a>
                ${lastPage > 0 ? `<a href="/baca/${esc(current.slug)}#page=${lastPage}" class="btn btn-outline btn-lg">📖 Lanjut ke hal.${lastPage}</a>` : ""}
                ${user ? `<form method="POST" action="/bookmark/${current.id}/toggle" style="margin:0"><button type="submit" class="btn btn-lg ${isBookmarked ? "btn-danger" : "btn-outline"}">${isBookmarked ? "✕ Hapus Bookmark" : "🔖 Bookmark"}</button></form>` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

	return c.html(modalBody);
}

// Full page detail view (for SEO / direct access)
export async function detailPage(c: Context) {
	const user = getUser(c);
	const slug = c.req.param("slug");
	const isPrivileged =
		user &&
		["mahasiswa", "admin", "super_admin", "pustakawan"].includes(user.roleName);

	let where = "b.status = 'active'";
	const params: unknown[] = [];
	if (!isPrivileged) where += " AND b.access_type = 'public'";

	const current = await queryOne<Book>(
		`SELECT b.id, b.slug, b.title, b.author, b.access_type,
	           b.cover_image, b.page_count, b.views,
	           b.publisher, b.publication_year, b.isbn, b.description,
	           pr.name AS program_name, f.name AS faculty_name
	    FROM books b
	    LEFT JOIN programs pr ON pr.id = b.program_id
	    LEFT JOIN faculties f ON f.id = pr.faculty_id
	    WHERE ${where} AND b.slug = ?
	    ORDER BY b.created_at DESC LIMIT 1`,
		[...params, slug],
	);

	if (!current) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "Buku tidak ditemukan.", user),
			404,
		);
	}

	if (
		current.access_type === "internal" &&
		(!user ||
			!["mahasiswa", "admin", "super_admin", "pustakawan"].includes(
				user.roleName,
			))
	) {
		return c.html(
			errorPage(
				403,
				"Akses Ditolak",
				"Buku ini hanya untuk akses internal kampus.",
				user,
			),
			403,
		);
	}

	await query("UPDATE books SET views = views + 1 WHERE id = ?", [current.id]);

	const seo = {
		description: current.description
			? current.description.slice(0, 160)
			: `Baca ${current.title} oleh ${current.author} di Perpustakaan Digital SARI.`,
		ogImage: current.cover_image
			? `/uploads/covers/${current.cover_image}`
			: "/assets/images/og-default.jpg",
		ogType: "book",
	};

	const coverHtml = current.cover_image
		? `<img src="/uploads/covers/${esc(current.cover_image)}" alt="${esc(current.title)}" class="book-detail-cover">`
		: '<div class="book-detail-cover placeholder">—</div>';

	const desc = current.description
		? `<div class="description"><h3>Sinopsis</h3><p>${esc(current.description).replace(/\n/g, "<br>")}</p></div>`
		: "";

	const facProdi = current.faculty_name
		? `<span><strong>Fakultas/Prodi</strong><br>${esc(current.faculty_name)}${current.program_name ? " — " + esc(current.program_name) : ""}</span>`
		: "";

	const body = `
	<section class="book-detail">
	  <div class="container">
	    <nav class="breadcrumb" aria-label="Breadcrumb">
	      <a href="/">Beranda</a> <span>/</span>
	      <a href="/buku">Katalog</a> <span>/</span>
	      <span>${esc(current.title)}</span>
	    </nav>
	    <div class="book-detail-info" style="text-align:center;max-width:640px;margin:0 auto 32px">
	      ${coverHtml}
	      <h1 style="margin-top:20px">${esc(current.title)}</h1>
	      <p class="author">${esc(current.author)}</p>
	      <div class="meta-grid" style="justify-content:center">
	        ${facProdi}
	        ${current.publisher ? `<span><strong>Penerbit</strong><br>${esc(current.publisher)}</span>` : ""}
	        ${current.publication_year ? `<span><strong>Tahun</strong><br>${current.publication_year}</span>` : ""}
	        ${current.isbn ? `<span><strong>ISBN</strong><br>${esc(current.isbn)}</span>` : ""}
	        <span><strong>Halaman</strong><br>${current.page_count || "—"}  ·  <strong>Dilihat</strong><br>${current.views}x</span>
	        <span><strong>Akses</strong><br>${current.access_type === "internal" ? "Internal Kampus" : "Publik"}</span>
	      </div>
	      ${desc}
	      <div class="modal-actions" style="justify-content:center">
	        <a href="/baca/${esc(current.slug)}" class="btn btn-primary btn-lg">Baca Online</a>
	      </div>
	    </div>
	  </div>
	</section>`;

	return c.html(
		layout(`${esc(current.title)} | Katalog`, body, user, null, seo),
	);
}

// ── HTML5 Flip Book Reader ──
export async function reader(c: Context) {
	const user = getUser(c);
	const slug = c.req.param("slug");

	const book = await queryOne<Book>(
		"SELECT id, title, slug, access_type, file_path, page_count FROM books WHERE slug = ? AND status = ?",
		[slug, "active"],
	);

	if (!book) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "Buku tidak ditemukan.", user),
			404,
		);
	}

	if (
		book.access_type === "internal" &&
		(!user ||
			!["mahasiswa", "admin", "super_admin", "pustakawan"].includes(
				user.roleName,
			))
	) {
		return c.html(
			errorPage(
				403,
				"Akses Ditolak",
				"Buku ini hanya untuk akses internal kampus.",
				user,
			),
			403,
		);
	}

	return c.html(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Baca - ${esc(book.title)}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";</script>
<style>
:root{--bg-page:#f5f0e8;--shadow:rgba(0,0,0,.35)}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#2a2d32;font-family:Nunito,sans-serif;overflow:hidden;height:100dvh;user-select:none}
#toolbar{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(30,32,34,.95);padding:0 16px;display:flex;align-items:center;gap:10px;color:#fff;font-size:13px;height:44px;backdrop-filter:blur(6px)}
#toolbar button{background:rgba(255,255,255,.08);color:#fff;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:12px;transition:.15s}
#toolbar button:hover{background:#2250fc}
#toolbar button:disabled{opacity:.3;cursor:default}
#toolbar button:disabled:hover{background:rgba(255,255,255,.08)}
#toolbar .spacer{flex:1}
#toolbar a{color:rgba(255,255,255,.5);text-decoration:none;font-size:12px}
#toolbar a:hover{color:#fff}
#page-info{min-width:100px;text-align:center;font-size:12px;color:rgba(255,255,255,.7)}
#toolbar .title{font-weight:600;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:rgba(255,255,255,.85)}
#reader-wrapper{position:fixed;top:44px;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3a3d42 0%,#2a2d32 100%)}
#book{position:relative;display:flex;perspective:2000px}
.page-slot{position:relative;overflow:hidden;cursor:pointer}
.page-slot canvas{display:block}
#page-left{border-radius:4px 0 0 4px}
#page-right{border-radius:0 4px 4px 0}
/* Spine shadow */
#book::after{content:'';position:absolute;top:0;bottom:0;left:50%;width:24px;transform:translateX(-50%);background:linear-gradient(90deg,rgba(0,0,0,.08) 0%,rgba(0,0,0,.02) 30%,rgba(0,0,0,.02) 70%,rgba(0,0,0,.08) 100%);pointer-events:none;z-index:10}
/* Flipping page */
#flip-container{position:absolute;top:0;left:50%;width:50%;height:100%;z-index:20;pointer-events:none;perspective:2000px}
#flip-page{position:absolute;top:0;left:0;width:100%;height:100%;transform-origin:left center;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.22,.61,.36,1);backface-visibility:hidden;border-radius:0 4px 4px 0;overflow:hidden;box-shadow:-4px 0 12px rgba(0,0,0,.15)}
#flip-page.flipping{transform:rotateY(-180deg)}
#flip-page canvas{display:block}
/* Flip the other way (prev page) */
#flip-container-prev{position:absolute;top:0;right:50%;width:50%;height:100%;z-index:20;pointer-events:none;perspective:2000px}
#flip-page-prev{position:absolute;top:0;right:0;width:100%;height:100%;transform-origin:right center;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.22,.61,.36,1);backface-visibility:hidden;border-radius:4px 0 0 4px;overflow:hidden;box-shadow:4px 0 12px rgba(0,0,0,.15)}
#flip-page-prev.flipping{transform:rotateY(180deg)}
#flip-page-prev canvas{display:block}
/* Loading */
#loading-overlay{position:fixed;top:44px;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(42,45,50,.98);z-index:50;transition:opacity .5s}
#loading-overlay.hidden{opacity:0;pointer-events:none}
.spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.08);border-top-color:#2250fc;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
#loading-text{color:rgba(255,255,255,.5);margin-top:14px;font-size:14px}
/* Page gutter hint */
.page-slot::after{content:'';position:absolute;top:0;bottom:0;width:18px;pointer-events:none;opacity:0;transition:opacity .3s}
#page-left::after{right:0;background:linear-gradient(90deg,transparent,rgba(0,0,0,.06))}
#page-right::after{left:0;background:linear-gradient(270deg,transparent,rgba(0,0,0,.06))}
.page-slot:hover::after{opacity:1}
</style>
</head>
<body>
<div id="toolbar">
  <button id="btn-prev" onclick="prevPage()">◀</button>
  <span id="page-info">—</span>
  <button id="btn-next" onclick="nextPage()">▶</button>
  <button id="btn-zoomin" onclick="zoomIn()" title="Perbesar">➕</button>
  <button id="btn-zoomout" onclick="zoomOut()" title="Perkecil">➖</button>
  <span class="spacer"></span>
  <span class="title">${esc(book.title)}</span>
  <span class="spacer"></span>
  <a href="/buku">✕ Tutup</a>
</div>
<div id="reader-wrapper">
  <div id="book">
    <div id="page-left" class="page-slot"></div>
    <div id="page-right" class="page-slot"></div>
    <div id="flip-container"><div id="flip-page"></div></div>
    <div id="flip-container-prev"><div id="flip-page-prev"></div></div>
  </div>
</div>
<div id="loading-overlay">
  <div style="text-align:center">
    <div class="spinner"></div>
    <div id="loading-text">Memuat buku...</div>
  </div>
</div>
<script>
const URL="/pdf/${esc(book.slug)}";
const BOOK_ID=${book.id};
let PDF=null,page=1,TOTAL=0;
let flipping=false, isMobile=window.innerWidth<768;
const PL=document.getElementById("page-left"),PR=document.getElementById("page-right");
const FC=document.getElementById("flip-container"),FP=document.getElementById("flip-page");
const FCP=document.getElementById("flip-container-prev"),FPP=document.getElementById("flip-page-prev");

/* Hash support: Lompat ke halaman dari URL #page=X */
const m=location.hash.match(/page=(\d+)/);
if(m) page=Math.max(1,parseInt(m[1]));

function calcScale(){
  if(isMobile) return Math.min((window.innerWidth-40)/612, (window.innerHeight-56)/792, 2);
  return Math.min((window.innerWidth-80)/2/612, (window.innerHeight-56)/792, 1.8);
}

let scale=calcScale();

function savePage(pg){
  if(!BOOK_ID) return;
  const d=new FormData();d.set('book_id',BOOK_ID);d.set('page',pg);
  navigator.sendBeacon('/baca/save-page',d);
}

function renderToCanvas(container,num){
  if(num<1||num>TOTAL){container.innerHTML='';return null}
  const c=document.createElement('canvas');
  container.innerHTML='';container.appendChild(c);
  const dpr=window.devicePixelRatio||1;
  const w=Math.round(612*scale),h=Math.round(792*scale);
  c.style.width=w+'px';c.style.height=h+'px';
  c.width=w*dpr;c.height=h*dpr;
  const ctx=c.getContext('2d');ctx.scale(dpr,dpr);
  PDF.getPage(num).then(p=>p.render({canvasContext:ctx,viewport:p.getViewport({scale:scale})}).promise);
  return c;
}

function renderSpread(){
  if(isMobile){
    renderToCanvas(PL,page);PR.innerHTML='';
  }else{
    const left=page%2===0?page-1:page;
    renderToCanvas(PL,left);renderToCanvas(PR,left+1);
  }
  document.getElementById('page-info').textContent=page+'/'+TOTAL;
  document.getElementById('btn-prev').disabled=page<=1;
  document.getElementById('btn-next').disabled=page>=TOTAL;
  FC.style.display='none';FCP.style.display='none';
  FP.classList.remove('flipping');FPP.classList.remove('flipping');
  savePage(page);
}

function nextPage(){
  if(flipping||page>=TOTAL) return;
  flipping=true;
  const next=page+1;
  if(isMobile){
    page=next;renderSpread();flipping=false;return;
  }
  FC.style.display='';
  FC.style.left=PR.offsetLeft+'px';
  FC.style.width=PR.offsetWidth+'px';
  FC.style.height=PR.offsetHeight+'px';
  renderToCanvas(FP,next);
  FP.classList.add('flipping');
  setTimeout(()=>{page=next;renderSpread();flipping=false},580);
}

function prevPage(){
  if(flipping||page<=1) return;
  flipping=true;
  const prev=page-1;
  if(isMobile){
    page=prev;renderSpread();flipping=false;return;
  }
  FCP.style.display='';
  FCP.style.right=(PL.parentElement.offsetWidth-PL.offsetLeft-PL.offsetWidth)+'px';
  FCP.style.width=PL.offsetWidth+'px';
  FCP.style.height=PL.offsetHeight+'px';
  renderToCanvas(FPP,prev);
  FPP.classList.add('flipping');
  setTimeout(()=>{page=prev;renderSpread();flipping=false},580);
}

function zoomIn(){scale=Math.min(scale+0.2,3);renderSpread()}
function zoomOut(){scale=Math.max(scale-0.2,0.4);renderSpread()}

PL.addEventListener('click',e=>{
  const r=PL.getBoundingClientRect(),x=e.clientX-r.left;
  if(x<r.width*0.4) prevPage();else if(x>r.width*0.6) nextPage()
});
PR.addEventListener('click',e=>{
  const r=PR.getBoundingClientRect(),x=e.clientX-r.left;
  if(x<r.width*0.4) prevPage();else if(x>r.width*0.6) nextPage()
});

window.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();nextPage()}
  if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();prevPage()}
  if(e.key==='Home'){e.preventDefault();page=1;renderSpread()}
  if(e.key==='End'){e.preventDefault();page=TOTAL;renderSpread()}
});
window.addEventListener('resize',()=>{
  isMobile=window.innerWidth<768;
  scale=calcScale();renderSpread()
});

pdfjsLib.getDocument(URL).promise.then(p=>{
  PDF=p;TOTAL=Math.min(p.numPages,500);
  renderSpread();
  document.getElementById('loading-overlay').classList.add('hidden');
}).catch(()=>{
  document.getElementById('loading-text').textContent='Gagal memuat PDF. Coba lagi.';
});
</script>
</body>
</html>`);
}

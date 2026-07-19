// src/controllers/books.ts - Katalog, detail, flip-book reader

import type { Context } from "hono";
import { query, queryOne } from "../config/database";
import type { Book, Faculty, Program } from "../types";
import { esc } from "../helpers";
import { layout, errorPage } from "../views/html";
import { getUser, getFlash } from "../helpers";

export async function catalog(c: Context) {
	const user = getUser(c);
	const search = c.req.query("q")?.trim() || "";
	const facultyId = Number(c.req.query("faculty")) || 0;
	const programId = Number(c.req.query("program")) || 0;
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

	const books = await query<Book[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.access_type,
            b.cover_image, b.page_count, b.views,
            pr.name AS program_name,
            f.name AS faculty_name
     FROM books b
     LEFT JOIN programs pr ON pr.id = b.program_id
     LEFT JOIN faculties f ON f.id = pr.faculty_id
     WHERE ${where} ORDER BY b.created_at DESC LIMIT 24`,
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
			const viewsBadge =
				'<span class="views-badge"><span class="view-icon">👁</span>' +
				b.views +
				"</span>";
			const prodi = b.program_name
				? "<span>" + esc(b.program_name) + "</span>"
				: "";
			bookCards += `
        <div class="book-card" data-book-slug="${esc(b.slug)}" data-book-title="${esc(b.title)}">
          <div class="cover-wrap">
            ${cover}
            ${badge}
            ${viewsBadge}
          </div>
          <div class="info">
            <h3>${esc(b.title)}</h3>
            <p class="author">${esc(b.author)}</p>
            <div class="meta">
              ${prodi ? `<span class="meta-badge">${prodi}</span>` : ""}
              <span class="meta-stat"><span class="stat-icon">📄</span>${b.page_count} hlm</span>
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
					<span class="count">${books.length} buku</span>
				</div>
				<div class="book-grid">${bookCards}</div>
			</div>
		</section>`;

	return c.html(layout("Katalog Buku", body, user, flash));
}

export async function detail(c: Context) {
	const user = getUser(c);
	const slug = c.req.param("slug");
	const flash = getFlash(c);
	const isModal = c.req.query("modal") === "1";

	const book = await queryOne<Book>(
		`SELECT b.*, u.name AS uploader_name,
            pr.name AS program_name, f.name AS faculty_name
     FROM books b
     LEFT JOIN programs pr ON pr.id = b.program_id
     LEFT JOIN faculties f ON f.id = pr.faculty_id
     JOIN users u ON u.id = b.uploaded_by
     WHERE b.slug = ? AND b.status = ?`,
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

	await query("UPDATE books SET views = views + 1 WHERE id = ?", [book.id]);

	const coverHtml = book.cover_image
		? `<img src="/uploads/covers/${esc(book.cover_image)}" alt="${esc(book.title)}">`
		: '<div style="aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;font-size:4rem;background:var(--gray-100);color:var(--gray-300)">—</div>';

	const desc = book.description
		? `<div class="description"><h3>Deskripsi</h3><p>${esc(book.description).replace(/\n/g, "<br>")}</p></div>`
		: "";

	const facProdi = book.faculty_name
		? `<span><strong>Fakultas/Prodi</strong><br>${esc(book.faculty_name)}${book.program_name ? " — " + esc(book.program_name) : ""}</span>`
		: "";

	const modalBody = `
    <div class="modal-overlay show" id="bookModal" role="dialog" aria-modal="true" aria-labelledby="bookModalTitle">
      <div class="modal-card modal-lg">
        <button class="modal-close" id="closeBookModal" aria-label="Tutup">&times;</button>
        <div class="modal-body">
          <div class="book-modal-grid">
            <div class="book-modal-cover">${coverHtml}</div>
            <div class="book-modal-info">
              <h2 id="bookModalTitle">${esc(book.title)}</h2>
              <p class="author">${esc(book.author)}</p>
              <div class="meta-grid">
                ${facProdi}
                ${book.publisher ? `<span><strong>Penerbit</strong><br>${esc(book.publisher)}</span>` : ""}
                ${book.publication_year ? `<span><strong>Tahun</strong><br>${book.publication_year}</span>` : ""}
                ${book.isbn ? `<span><strong>ISBN</strong><br>${esc(book.isbn)}</span>` : ""}
                ${book.page_count ? `<span><strong>Halaman</strong><br>${book.page_count}</span>` : ""}
                <span><strong>Akses</strong><br>${book.access_type === "internal" ? "Internal Kampus" : "Publik"}</span>
                <span><strong>Dilihat</strong><br>${book.views}x</span>
              </div>
              ${desc}
              <div class="modal-actions">
                <a href="/baca/${esc(book.slug)}" class="btn btn-primary btn-lg">Baca Online</a>
                <a href="/buku/${esc(book.slug)}" class="btn btn-outline btn-lg">Lihat Halaman Lengkap</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

	if (isModal) {
		return c.html(modalBody);
	}

	const body = `
    <div class="detail-section">
      <div class="container">
        <div class="breadcrumb"><a href="/buku">Katalog</a> <span>/</span> <span>${esc(book.title)}</span></div>
        <div class="book-detail">
          <div class="cover">${coverHtml}</div>
          <div class="info">
            <h1>${esc(book.title)}</h1>
            <p class="author">${esc(book.author)}</p>
            <div class="meta-grid">
              ${facProdi}
              ${book.publisher ? `<span><strong>Penerbit</strong><br>${esc(book.publisher)}</span>` : ""}
              ${book.publication_year ? `<span><strong>Tahun</strong><br>${book.publication_year}</span>` : ""}
              ${book.isbn ? `<span><strong>ISBN</strong><br>${esc(book.isbn)}</span>` : ""}
              ${book.page_count ? `<span><strong>Halaman</strong><br>${book.page_count}</span>` : ""}
              <span><strong>Akses</strong><br>${book.access_type === "internal" ? "Internal Kampus" : "Publik"}</span>
              <span><strong>Dilihat</strong><br>${book.views}x</span>
            </div>
            ${desc}
            <a href="/baca/${esc(book.slug)}" class="btn btn-primary btn-lg">Baca Online</a>
          </div>
        </div>
      </div>
    </div>`;

	return c.html(layout(book.title, body, user, flash));
}

// ── Flip-Book Reader (cepat) ──
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
*{margin:0;padding:0;box-sizing:border-box}
body{background:#2a2d32;font-family:Nunito,sans-serif;overflow:hidden;height:100dvh}
#toolbar{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(30,32,34,.95);padding:0 16px;display:flex;align-items:center;gap:10px;color:#fff;font-size:13px;user-select:none;height:44px;backdrop-filter:blur(6px)}
#toolbar button{background:rgba(255,255,255,0.08);color:#fff;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:12px;transition:.15s}
#toolbar button:hover{background:#2250fc}
#toolbar .spacer{flex:1}
#toolbar a{color:rgba(255,255,255,0.5);text-decoration:none;font-size:12px}
#toolbar a:hover{color:#fff}
#page-info{min-width:90px;text-align:center;font-size:12px;color:rgba(255,255,255,0.6)}
#toolbar .title{font-weight:600;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
#reader-wrapper{position:fixed;top:44px;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:#3a3d42}
#canvas-wrap{position:relative;display:flex;gap:0;box-shadow:0 4px 30px rgba(0,0,0,.4);border-radius:2px;overflow:hidden}
#canvas-wrap canvas{cursor:pointer;display:block;background:#fff}
#canvas-left{border-right:1px solid rgba(0,0,0,.08)}
#loading-overlay{position:fixed;top:44px;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(42,45,50,.98);z-index:50;transition:opacity .4s}
#loading-overlay.hidden{opacity:0;pointer-events:none}
.spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.08);border-top-color:#2250fc;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
#loading-text{color:rgba(255,255,255,.5);margin-top:14px;font-size:13px}
</style>
</head>
<body>
<div id="toolbar">
  <button onclick="prevPage()">◀</button>
  <span id="page-info">—</span>
  <button onclick="nextPage()">▶</button>
  <span class="spacer"></span>
  <span class="title">${esc(book.title)}</span>
  <span class="spacer"></span>
  <a href="/buku/${esc(book.slug)}">✕ Tutup</a>
</div>
<div id="reader-wrapper">
  <div id="canvas-wrap">
    <canvas id="canvas-left"></canvas>
    <canvas id="canvas-right"></canvas>
  </div>
</div>
<div id="loading-overlay">
  <div style="text-align:center">
    <div class="spinner"></div>
    <div id="loading-text">Memuat buku...</div>
  </div>
</div>
<script>
document.addEventListener("contextmenu",e=>e.preventDefault());
document.addEventListener("keydown",e=>{
  if((e.ctrlKey&&(e.key==="s"||e.key==="p"))||e.key==="F12")e.preventDefault();
});
const TOTAL=${Math.min(book.page_count || 30, 100)};
const URL="/pdf/${esc(book.slug)}";
let PDF=null,page=1;
const CL=document.getElementById("canvas-left"),CR=document.getElementById("canvas-right");
const CXL=CL.getContext("2d"),CXR=CR.getContext("2d");
function render(num,canvas,ctx){
  return PDF.getPage(num).then(p=>{
    const vp=p.getViewport({scale:1});
    const dpr=window.devicePixelRatio||1;
    const h=Math.min(vp.height,window.innerHeight-56);
    const sc=h/vp.height;
    const vp2=p.getViewport({scale:sc});
    canvas.width=vp2.width*dpr;canvas.height=vp2.height*dpr;
    canvas.style.width=vp2.width+"px";canvas.style.height=vp2.height+"px";
    ctx.scale(dpr,dpr);
    return p.render({canvasContext:ctx,viewport:vp2}).promise;
  });
}
function renderSpread(){
  const left=page%2===0?page:page-1;
  const right=page%2===0?page+1:page;
  if(left>=1) render(left,CL,CXL).catch(()=>{});
  if(right<=TOTAL) render(right,CR,CXR).catch(()=>{});
  document.getElementById("page-info").textContent=page+"/"+TOTAL;
}
function nextPage(){if(page<TOTAL){page++;renderSpread()}}
function prevPage(){if(page>1){page--;renderSpread()}}
CL.onclick=prevPage;CR.onclick=nextPage;
window.addEventListener("keydown",e=>{
  if(e.key==="ArrowRight"||e.key==="ArrowDown")nextPage();
  if(e.key==="ArrowLeft"||e.key==="ArrowUp")prevPage();
  if(e.key==="Home"){page=1;renderSpread()}
  if(e.key==="End"){page=TOTAL;renderSpread()}
});
pdfjsLib.getDocument(URL).promise.then(p=>{PDF=p;TOTAL=Math.min(p.numPages,100);document.getElementById("loading-overlay").classList.add("hidden");renderSpread();});
</script>
</body>
</html>`);
}

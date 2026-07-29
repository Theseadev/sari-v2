// src/views/admin/books.ts — Book CRUD views

import { esc } from "../../helpers";
import { adminLayout, inputField, selectField, textareaField } from "./helpers";

type BookRow = {
	id: number;
	title: string;
	slug: string;
	author: string;
	access_type: string;
	program_name: string | null;
	cover_image: string | null;
	page_count: number;
	views: number;
	created_at: string;
};
type Prog = { id: number; name: string; faculty_name: string };

export function bookList(
	books: BookRow[],
	user: { name: string; roleName: string },
	currentPage?: string,
	pagination?: {
		page: number;
		totalPages: number;
		total: number;
		search?: string;
		access?: string;
		sort?: string;
	},
	isAjax?: boolean,
): string {
	let rows = "";
	if (books.length === 0) {
		rows =
			'<tr><td colspan="6" class="text-muted text-center" style="padding:32px">Belum ada buku.</td></tr>';
	} else {
		for (const b of books) {
			const cover = b.cover_image
				? `<div style="width:48px;height:64px;border-radius:6px;overflow:hidden;background:var(--bg-warm);flex-shrink:0"><img src="/uploads/covers/${esc(b.cover_image)}" alt="" style="width:100%;height:100%;object-fit:cover"></div>`
				: `<div style="width:48px;height:64px;border-radius:6px;background:var(--bg-warm);display:flex;align-items:center;justify-content:center;color:var(--text-dim);flex-shrink:0">📖</div>`;
			rows += `<tr>
        <td>${cover}</td>
        <td><strong>${esc(b.title)}</strong><br><small class="text-muted">${esc(b.author)}</small></td>
        <td><span class="badge-sm ${b.access_type}">${b.access_type === "internal" ? "Internal" : "Publik"}</span></td>
        <td>${b.views}</td>
        <td><small>${new Date(b.created_at).toLocaleDateString("id-ID")}</small></td>
        <td class="nowrap">
          <a href="/admin/books/${b.id}/edit" class="btn-sm">Edit</a>
          <form method="POST" action="/admin/books/${b.id}/delete" style="display:inline">
            <button type="submit" class="btn-sm" style="background:#fef2f2;color:#b91c1c">Hapus</button>
          </form>
        </td>
      </tr>`;
		}
	}

	const search = pagination?.search || "";
	const access = pagination?.access || "";
	const sort = pagination?.sort || "newest";

	const searchParam = new URLSearchParams();
	if (search) searchParam.set("q", search);
	if (access) searchParam.set("access", access);
	if (sort && sort !== "newest") searchParam.set("sort", sort);
	const qs = searchParam.toString();
	const searchQs = qs ? `&${qs}` : "";

	let paginationHtml = "";
	if (pagination && pagination.totalPages > 1) {
		const p = pagination;
		const pageLink = (n: number) => `/admin/books?page=${n}${searchQs}`;

		// Build page numbers with ellipsis
		const pages: (number | "...")[] = [];
		const maxVisible = 5;
		if (p.totalPages <= maxVisible + 2) {
			for (let i = 1; i <= p.totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			let start = Math.max(2, p.page - 1);
			let end = Math.min(p.totalPages - 1, p.page + 1);
			if (p.page <= 3) {
				end = Math.min(4, p.totalPages - 1);
			} else if (p.page >= p.totalPages - 2) {
				start = Math.max(p.totalPages - 3, 2);
			}
			if (start > 2) pages.push("...");
			for (let i = start; i <= end; i++) pages.push(i);
			if (end < p.totalPages - 1) pages.push("...");
			pages.push(p.totalPages);
		}

		let pageNums = "";
		for (const pg of pages) {
			if (pg === "...") {
				pageNums += `<span class="admin-page-dots">…</span>`;
			} else {
				const cls = pg === p.page ? " admin-page-active" : "";
				pageNums += `<a href="${pageLink(pg)}" class="admin-page-num${cls}">${pg}</a>`;
			}
		}

		paginationHtml = `
  <div class="admin-pagination">
    <span class="admin-page-info">${p.total} buku · Hal ${p.page}/${p.totalPages}</span>
    <div class="admin-page-btns">
      <a href="${pageLink(p.page - 1)}" class="admin-page-num${p.page <= 1 ? " disabled" : ""}">&laquo;</a>
      ${pageNums}
      <a href="${pageLink(p.page + 1)}" class="admin-page-num${p.page >= p.totalPages ? " disabled" : ""}">&raquo;</a>
    </div>
  </div>`;
	}

	const body = `
<style>
  .filter-bar{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
  .filter-bar input[type=text]{flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:0.85rem;background:var(--bg-card);color:var(--text);outline:none;transition:border-color .2s}
  .filter-bar input[type=text]:focus{border-color:var(--primary)}
  .dd{position:relative}
  .dd-btn{display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:0.85rem;background:var(--bg-card);color:var(--text);cursor:pointer;white-space:nowrap;transition:all .2s;user-select:none}
  .dd-btn:hover{border-color:var(--primary);background:var(--primary-light)}
  .dd.open .dd-btn{border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-light)}
  .dd-menu{position:absolute;top:calc(100% + 4px);left:0;min-width:100%;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:50;opacity:0;visibility:hidden;transform:translateY(-4px);transition:all .15s}
  .dd.open .dd-menu{opacity:1;visibility:visible;transform:translateY(0)}
  .dd-opt{display:flex;align-items:center;gap:8px;padding:8px 14px;font-size:0.85rem;color:var(--text);cursor:pointer;transition:background .1s}
  .dd-opt:first-child{border-radius:8px 8px 0 0}
  .dd-opt:last-child{border-radius:0 0 8px 8px}
  .dd-opt:hover{background:var(--primary-light)}
  .dd-opt.active{color:var(--primary);font-weight:600}
</style>
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola Buku</h2>
  <div style="display:flex;gap:8px">
    <a href="/admin/books/create" class="btn btn-primary btn-sm">+ Tambah Buku</a>
    <a href="/admin/books/bulk" class="btn btn-outline btn-sm">📤 Upload Bulk</a>
  </div>
</div>
<div class="filter-bar">
  <input type="text" id="bookSearch" placeholder="Cari judul atau penulis..." value="${esc(search)}">
  <div class="dd" id="ddAccess">
    <button type="button" class="dd-btn" id="ddAccessBtn">
      <span id="ddAccessText">${access === "public" ? "Publik" : access === "internal" ? "Internal" : "Semua Akses"}</span>
    </button>
    <div class="dd-menu">
      <div class="dd-opt${!access ? " active" : ""}" data-val="">Semua Akses</div>
      <div class="dd-opt${access === "public" ? " active" : ""}" data-val="public">Publik</div>
      <div class="dd-opt${access === "internal" ? " active" : ""}" data-val="internal">Internal</div>
    </div>
    <input type="hidden" id="bookAccess" value="${esc(access)}">
  </div>
  <div class="dd" id="ddSort">
    <button type="button" class="dd-btn" id="ddSortBtn">
      <span id="ddSortText">${sort === "oldest" ? "Terlama" : "Terbaru"}</span>
    </button>
    <div class="dd-menu">
      <div class="dd-opt${sort !== "oldest" ? " active" : ""}" data-val="newest">Terbaru</div>
      <div class="dd-opt${sort === "oldest" ? " active" : ""}" data-val="oldest">Terlama</div>
    </div>
    <input type="hidden" id="bookSort" value="${esc(sort)}">
  </div>
  ${search || access ? `<a href="/admin/books" class="btn btn-outline btn-sm">✕ Reset</a>` : ""}
</div>
<div class="admin-card">
  <table class="table">
    <thead><tr><th style="width:50px"></th><th>Judul</th><th>Akses</th><th>Dilihat</th><th>Tanggal</th><th>Aksi</th></tr></thead>
    <tbody id="bookTableBody">${rows}</tbody>
  </table>
  ${paginationHtml}
</div>
<script>
(function(){
  var search=document.getElementById('bookSearch'),
      accessInput=document.getElementById('bookAccess'),
      sortInput=document.getElementById('bookSort'),
      timer,tbody=document.getElementById('bookTableBody'),
      card=document.querySelector('.admin-card');

  // Toggle dropdown
  document.querySelectorAll('.dd').forEach(function(dd){
    dd.querySelector('.dd-btn').addEventListener('click',function(e){
      e.stopPropagation();
      document.querySelectorAll('.dd').forEach(function(d){if(d!==dd)d.classList.remove('open')});
      dd.classList.toggle('open');
    });
    dd.querySelectorAll('.dd-opt').forEach(function(opt){
      opt.addEventListener('click',function(){
        var val=opt.getAttribute('data-val');
        var hidden=dd.querySelector('input[type=hidden]');
        hidden.value=val;
        dd.querySelectorAll('.dd-opt').forEach(function(o){o.classList.remove('active')});
        opt.classList.add('active');
        var btnText=dd.querySelector('.dd-btn span');
        btnText.textContent=opt.textContent.trim();
        dd.classList.remove('open');
        doFetch();
      });
    });
  });
  document.addEventListener('click',function(){document.querySelectorAll('.dd').forEach(function(d){d.classList.remove('open')})});

  function doFetch(){
    clearTimeout(timer);
    timer=setTimeout(function(){
      var q=search.value.trim(),
          a=accessInput.value,
          s=sortInput.value,
          p=new URLSearchParams();
      if(q)p.set('q',q);
      if(a)p.set('access',a);
      if(s&&s!=='newest')p.set('sort',s);
      var qs=p.toString(),
          url='/admin/books'+(qs?'?'+qs:'');
      fetch(url,{headers:{'X-Requested-With':'XMLHttpRequest'}}).then(function(r){return r.text();}).then(function(html){
        var d=document.createElement('div');d.innerHTML=html;
        var nt=d.querySelector('#bookTableBody');
        var np=d.querySelector('.admin-pagination');
        if(nt&&tbody)tbody.innerHTML=nt.innerHTML;
        var oldp=card&&card.querySelector('.admin-pagination');
        if(np){if(oldp)oldp.outerHTML=np.outerHTML;else if(card)card.insertAdjacentHTML('beforeend',np.outerHTML);}
        else if(oldp)oldp.remove();
        history.replaceState(null,'',url);
      });
    },150);
  }
  search.addEventListener('input',doFetch);
  window.addEventListener('popstate',function(){location.reload();});
})();
</script>`;

	if (isAjax) return body;
	return adminLayout("Kelola Buku", body, user, currentPage);
}

export function bookForm(
	user: { name: string; roleName: string },
	progs: Prog[],
	book?: {
		id?: number;
		title?: string;
		slug?: string;
		author?: string;
		publisher?: string;
		publication_year?: number;
		isbn?: string;
		description?: string;
		access_type?: string;
		category_id?: number;
		program_id?: number | null;
		cover_image?: string | string | null;
		page_count?: number;
	} | null,
): string {
	const isEdit = !!book?.id;
	const action = isEdit
		? `/admin/books/${book?.id}/update`
		: "/admin/books/create";
	const title = isEdit ? "Edit Buku" : "Tambah Buku";

	const progOpts = progs.map((p) => ({
		value: p.id,
		label: `${p.faculty_name} — ${p.name}`,
	}));

	const coverPreview =
		isEdit && book?.cover_image
			? `<div style="margin-bottom:12px"><img id="coverPreview" src="/uploads/covers/${esc(String(book.cover_image))}" style="max-height:120px;border-radius:8px;border:1px solid var(--border)"></div>`
			: "";

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">${isEdit ? "Edit Buku" : "Tambah Buku"}</h2>
  <a href="/admin/books" class="btn btn-outline btn-sm">← Kembali</a>
</div>
<div class="admin-card" style="padding:24px;max-width:960px">
  <form method="POST" action="${action}" enctype="multipart/form-data">
    ${inputField("Judul", "title", book?.title ?? "", { required: true, placeholder: "Judul buku" })}
    ${inputField("Penulis", "author", book?.author ?? "", { required: true, placeholder: "Nama penulis" })}
    <div>
      ${textareaField("Sinopsis", "description", book?.description ?? "", { rows: 3 })}
    </div>

    ${selectField("Program Studi", "program_id", progOpts, book?.program_id ?? "")}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${inputField("Penerbit", "publisher", book?.publisher ?? "")}
      ${inputField("Tahun", "publication_year", book?.publication_year ? String(book.publication_year) : "", { type: "number" })}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="form-group" style="position:relative">
        <label for="isbn">ISBN</label>
        <div style="position:relative">
          <input type="text" id="isbn" name="isbn" class="form-control" value="${esc(String(book?.isbn ?? ""))}" placeholder="ISBN untuk auto-fill" style="padding-right:44px">
          <button type="button" id="olAutofill" class="btn btn-sm" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--bg);color:var(--text-dim);border:1px solid var(--border-light);border-radius:8px;padding:6px 8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s" onmouseover="this.style.background='var(--primary-light)';this.style.color='var(--primary)';this.style.borderColor='var(--primary)'" onmouseout="this.style.background='var(--bg)';this.style.color='var(--text-dim)';this.style.borderColor='var(--border-light)'" title="Auto-fill dari OpenLibrary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
        <div id="olStatus" style="font-size:0.78rem;margin-top:6px;color:var(--text-dim)"></div>
      </div>
      ${selectField(
				"Akses",
				"access_type",
				[
					{ value: "public", label: "Publik" },
					{ value: "internal", label: "Internal" },
				],
				book?.access_type ?? "public",
				{ required: true },
			)}
    </div>

    <div class="form-group">
      <label for="cover">Sampul Buku${isEdit ? " (kosongkan jika tidak ubah)" : ""}</label>
      ${coverPreview}
      <input type="file" id="cover" name="cover" class="form-control" accept="image/*">
      <input type="hidden" name="downloaded_cover" id="downloadedCover" value="">
    </div>

    ${!isEdit ? '<div class="form-group"><label for="pdf_file">File PDF *</label><input type="file" id="pdf_file" name="pdf_file" class="form-control" accept=".pdf" required></div>' : ""}

    <div style="display:flex;gap:12px;margin-top:20px">
      <button type="submit" class="btn btn-primary">${isEdit ? "Simpan Perubahan" : "Upload Buku"}</button>
      <a href="/admin/books" class="btn btn-outline">Batal</a>
    </div>
  </form>
</div>

<script>
document.getElementById('olAutofill')?.addEventListener('click', async function() {
	const isbn = document.getElementById('isbn')?.value?.replace(/[^0-9X]/gi, '');
	if (!isbn || isbn.length < 10) {
		document.getElementById('olStatus').textContent = '⚠️ Masukkan ISBN valid (min. 10 digit)';
		return;
	}
	const status = document.getElementById('olStatus');
	status.textContent = '⏳ Mencari data buku...';
	status.style.color = 'var(--text-dim)';
	try {
		const res = await fetch('/api/openlibrary/isbn/' + isbn);
		if (!res.ok) { status.textContent = '❌ Buku tidak ditemukan di OpenLibrary'; status.style.color = 'var(--danger)'; return; }
		const data = await res.json();
		document.getElementById('title').value = data.title || '';
		document.getElementById('author').value = data.author || '';
		document.getElementById('publisher').value = data.publisher || '';
		document.getElementById('publication_year').value = data.publication_year || '';
		document.getElementById('description').value = data.description || '';
		let statusMsg = '✅ Auto-fill berhasil!';
		if (data.cover_image) {
			document.getElementById('downloadedCover').value = data.cover_image;
			let preview = document.getElementById('coverPreview');
			if (!preview) {
				const coverGroup = document.querySelector('.form-group:has(#cover)') || document.getElementById('cover')?.closest('.form-group');
				if (coverGroup) {
					const div = document.createElement('div');
					div.style.cssText = 'margin-bottom:12px';
					div.innerHTML = '<img id="coverPreview" src="/uploads/covers/' + data.cover_image + '" style="max-height:120px;border-radius:8px;border:1px solid var(--border)">';
					coverGroup.insertBefore(div, document.getElementById('cover'));
				}
			} else {
				preview.src = '/uploads/covers/' + data.cover_image;
			}
			statusMsg += ' Cover terdownload!';
		} else {
			statusMsg += ' <a href="/api/openlibrary/cover?isbn=' + isbn + '" target="_blank" style="color:var(--primary)">Lihat cover</a>';
		}
		status.innerHTML = statusMsg;
		status.style.color = '#059669';
	} catch (e) {
		status.textContent = '❌ Gagal menghubungi OpenLibrary';
		status.style.color = 'var(--danger)';
	}
});

</script>`;

	return adminLayout(title, body, user);
}

// ── Bulk Upload Form ──
export function bulkUploadForm(
	user: { name: string; roleName: string },
	progs: Prog[],
): string {
	const progOpts = progs.map((p) => ({
		value: p.id,
		label: `${p.faculty_name} — ${p.name}`,
	}));

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Upload Bulk dari Excel</h2>
  <div style="display:flex;gap:8px">
    <a href="/admin/books/bulk/template" class="btn btn-outline btn-sm" download>📥 Download Format Excel</a>
    <a href="/admin/books" class="btn btn-outline btn-sm">← Kembali</a>
  </div>
</div>
<div class="admin-card" style="padding:24px;max-width:960px">
  <div style="background:var(--primary-light);border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:0.85rem;color:var(--primary);line-height:1.6">
    <strong>📌 Format Excel (.xlsx):</strong>
    <table style="width:100%;margin-top:8px;font-size:0.8rem;border-collapse:collapse">
      <thead><tr style="border-bottom:1px solid var(--primary);opacity:0.7">
        <th style="padding:4px 8px;text-align:left">Judul</th>
        <th style="padding:4px 8px;text-align:left">Penulis</th>
        <th style="padding:4px 8px;text-align:left">Sinopsis</th>
        <th style="padding:4px 8px;text-align:left">Penerbit</th>
        <th style="padding:4px 8px;text-align:left">Tahun</th>
        <th style="padding:4px 8px;text-align:left">ISBN</th>
        <th style="padding:4px 8px;text-align:left">Program Studi</th>
        <th style="padding:4px 8px;text-align:left">Akses</th>
        <th style="padding:4px 8px;text-align:left">File PDF</th>
        <th style="padding:4px 8px;text-align:left">Cover</th>
      </tr></thead>
      <tbody><tr>
        <td style="padding:4px 8px">Judul Buku</td>
        <td style="padding:4px 8px">Nama Penulis</td>
        <td style="padding:4px 8px">Sinopsis...</td>
        <td style="padding:4px 8px">Penerbit</td>
        <td style="padding:4px 8px">2024</td>
        <td style="padding:4px 8px">978-602-xxx</td>
        <td style="padding:4px 8px">Teknik Informatika</td>
        <td style="padding:4px 8px">public/internal</td>
        <td style="padding:4px 8px">nama-file.pdf</td>
        <td style="padding:4px 8px">cover.jpg</td>
      </tr></tbody>
    </table>
    <div style="margin-top:8px">
      <strong>File PDF:</strong> Nama file harus sesuai dengan isi kolom "File PDF"<br>
      <strong>Cover:</strong> Nama file cover harus sesuai dengan isi kolom "Cover" (opsional)<br>
      <strong>Akses:</strong> public atau internal
    </div>
  </div>

  <form method="POST" action="/admin/books/bulk-store" enctype="multipart/form-data">
    <div class="form-group">
      <label for="excel_file">File Excel (.xlsx) *</label>
      <input type="file" id="excel_file" name="excel_file" class="form-control" accept=".xlsx,.xls" required>
    </div>

    <div class="form-group">
      <label for="pdf_files">File PDF (upload semua sekaligus) *</label>
      <input type="file" id="pdf_files" name="pdf_files" class="form-control" accept=".pdf" multiple required style="padding:10px">
      <small class="text-muted">Semua file PDF yang ada di Excel, pilih sekaligus</small>
    </div>

    <div class="form-group">
      <label for="cover_files">File Cover (opsional)</label>
      <input type="file" id="cover_files" name="cover_files" class="form-control" accept="image/*" multiple style="padding:10px">
      <small class="text-muted">Nama file cover harus sesuai di kolom Excel</small>
    </div>

    <div style="display:flex;gap:12px;margin-top:20px">
      <button type="submit" class="btn btn-primary">📤 Upload Semua</button>
      <a href="/admin/books" class="btn btn-outline">Batal</a>
    </div>
  </form>
</div>`;

	return adminLayout("Upload Bulk", body, user);
}

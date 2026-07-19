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

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola Buku</h2>
  <div style="display:flex;gap:8px">
    <a href="/admin/books/create" class="btn btn-primary btn-sm">+ Tambah Buku</a>
    <a href="/admin/books/bulk" class="btn btn-outline btn-sm">📤 Upload Bulk</a>
  </div>
</div>
<div class="admin-card">
  <table class="table">
    <thead><tr><th style="width:50px"></th><th>Judul</th><th>Akses</th><th>Dilihat</th><th>Tanggal</th><th>Aksi</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;

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
			? `<div style="margin-bottom:12px"><img src="/uploads/covers/${esc(String(book.cover_image))}" style="max-height:120px;border-radius:8px;border:1px solid var(--border)"></div>`
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
    ${textareaField("Sinopsis", "description", book?.description ?? "", { rows: 3 })}

    ${selectField("Program Studi", "program_id", progOpts, book?.program_id ?? "")}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${inputField("Penerbit", "publisher", book?.publisher ?? "")}
      ${inputField("Tahun", "publication_year", book?.publication_year ? String(book.publication_year) : "", { type: "number" })}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${inputField("ISBN", "isbn", book?.isbn ?? "")}
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
    </div>

    ${!isEdit ? '<div class="form-group"><label for="pdf_file">File PDF *</label><input type="file" id="pdf_file" name="pdf_file" class="form-control" accept=".pdf" required></div>' : ""}

    <div style="display:flex;gap:12px;margin-top:20px">
      <button type="submit" class="btn btn-primary">${isEdit ? "Simpan Perubahan" : "Upload Buku"}</button>
      <a href="/admin/books" class="btn btn-outline">Batal</a>
    </div>
  </form>
</div>`;

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

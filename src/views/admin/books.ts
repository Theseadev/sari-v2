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
				? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="" style="width:36px;height:48px;object-fit:cover;border-radius:4px">`
				: "—";
			rows += `<tr>
        <td>${cover}</td>
        <td><strong>${esc(b.title)}</strong><br><small class="text-muted">${esc(b.author)}</small></td>
        <td><span class="badge-sm ${b.access_type}">${b.access_type === "internal" ? "Internal" : "Publik"}</span></td>
        <td>${b.views}</td>
        <td><small>${b.created_at?.slice(0, 10) ?? ""}</small></td>
        <td class="nowrap">
          <a href="/admin/books/${b.id}/edit" class="btn-sm">Edit</a>
          <form method="POST" action="/admin/books/${b.id}/delete" style="display:inline" onsubmit="return confirm('Hapus buku ini?')">
            <button type="submit" class="btn-sm" style="background:#fef2f2;color:#b91c1c">Hapus</button>
          </form>
        </td>
      </tr>`;
		}
	}

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola Buku</h2>
  <a href="/admin/books/create" class="btn btn-primary btn-sm">+ Tambah Buku</a>
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
<div class="admin-card" style="padding:24px;max-width:720px">
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

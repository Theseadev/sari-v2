// src/views/admin/categories.ts — Category CRUD views

import { esc } from "../../helpers";
import { adminLayout, inputField, textareaField } from "./helpers";

type CatRow = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	book_count?: number;
	created_at: string;
};

export function catList(
	cats: CatRow[],
	user: { name: string; roleName: string },
	currentPage?: string,
): string {
	let rows = "";
	if (cats.length === 0) {
		rows =
			'<tr><td colspan="5" class="text-muted text-center" style="padding:32px">Belum ada kategori.</td></tr>';
	} else {
		for (const c of cats) {
			rows += `<tr>
        <td>${c.id}</td>
        <td><strong>${esc(c.name)}</strong><br><small class="text-muted">/${esc(c.slug)}</small></td>
        <td>${esc(c.description ?? "—")}</td>
        <td>${c.book_count ?? 0}</td>
        <td class="nowrap">
          <a href="/admin/categories/${c.id}/edit" class="btn-sm">Edit</a>
          <form method="POST" action="/admin/categories/${c.id}/delete" style="display:inline">
            <button type="submit" class="btn-sm" style="background:#fef2f2;color:#b91c1c">Hapus</button>
          </form>
        </td>
      </tr>`;
		}
	}

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola Kategori</h2>
  <a href="/admin/categories/create" class="btn btn-primary btn-sm">+ Tambah</a>
</div>
<div class="admin-card">
  <div class="table-wrap">
  <table class="table">
    <thead><tr><th>ID</th><th>Nama</th><th>Deskripsi</th><th>Jml Buku</th><th>Aksi</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  </div>
</div>`;

	return adminLayout("Kelola Kategori", body, user, currentPage);
}

export function catForm(
	user: { name: string; roleName: string },
	item?: {
		id?: number;
		name?: string;
		slug?: string;
		description?: string | null;
	} | null,
): string {
	const isEdit = !!item?.id;
	const action = isEdit
		? `/admin/categories/${item?.id}/update`
		: "/admin/categories/create";

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">${isEdit ? "Edit Kategori" : "Tambah Kategori"}</h2>
  <a href="/admin/categories" class="btn btn-outline btn-sm">← Kembali</a>
</div>
<div class="admin-card" style="padding:24px;max-width:520px">
  <form method="POST" action="${action}">
    ${inputField("Nama", "name", item?.name ?? "", { required: true })}
    ${inputField("Slug", "slug", item?.slug ?? "", { placeholder: "otomatis dari nama" })}
    ${textareaField("Deskripsi", "description", item?.description ?? "", { rows: 3 })}
    <div style="display:flex;gap:12px;margin-top:20px">
      <button type="submit" class="btn btn-primary">${isEdit ? "Simpan" : "Tambah"}</button>
      <a href="/admin/categories" class="btn btn-outline">Batal</a>
    </div>
  </form>
</div>`;

	return adminLayout(isEdit ? "Edit Kategori" : "Tambah Kategori", body, user);
}

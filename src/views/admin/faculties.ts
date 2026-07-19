// src/views/admin/faculties.ts — Faculty CRUD views

import { esc } from "../../helpers";
import { adminLayout, inputField, textareaField } from "./helpers";

type FacRow = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	program_count?: number;
	created_at: string;
};

export function facList(
	facs: FacRow[],
	user: { name: string; roleName: string },
	currentPage?: string,
): string {
	let rows = "";
	if (facs.length === 0) {
		rows =
			'<tr><td colspan="5" class="text-muted text-center" style="padding:32px">Belum ada fakultas.</td></tr>';
	} else {
		for (const f of facs) {
			rows += `<tr>
        <td>${f.id}</td>
        <td><strong>${esc(f.name)}</strong><br><small class="text-muted">/${esc(f.slug)}</small></td>
        <td>${esc(f.description ?? "—")}</td>
        <td>${f.program_count ?? 0}</td>
        <td class="nowrap">
          <a href="/admin/faculties/${f.id}/edit" class="btn-sm">Edit</a>
          <form method="POST" action="/admin/faculties/${f.id}/delete" style="display:inline" onsubmit="return confirm('Hapus fakultas ini? Program studi terkait juga akan terpengaruh.')">
            <button type="submit" class="btn-sm" style="background:#fef2f2;color:#b91c1c">Hapus</button>
          </form>
        </td>
      </tr>`;
		}
	}

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola Fakultas</h2>
  <a href="/admin/faculties/create" class="btn btn-primary btn-sm">+ Tambah</a>
</div>
<div class="admin-card">
  <table class="table">
    <thead><tr><th>ID</th><th>Nama</th><th>Deskripsi</th><th>Jml Prodi</th><th>Aksi</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;

	return adminLayout("Kelola Fakultas", body, user, currentPage);
}

export function facForm(
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
		? `/admin/faculties/${item?.id}/update`
		: "/admin/faculties/create";

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">${isEdit ? "Edit Fakultas" : "Tambah Fakultas"}</h2>
  <a href="/admin/faculties" class="btn btn-outline btn-sm">← Kembali</a>
</div>
<div class="admin-card" style="padding:24px;max-width:520px">
  <form method="POST" action="${action}">
    ${inputField("Nama", "name", item?.name ?? "", { required: true })}
    ${inputField("Slug", "slug", item?.slug ?? "", { placeholder: "otomatis dari nama" })}
    ${textareaField("Deskripsi", "description", item?.description ?? "", { rows: 3 })}
    <div style="display:flex;gap:12px;margin-top:20px">
      <button type="submit" class="btn btn-primary">${isEdit ? "Simpan" : "Tambah"}</button>
      <a href="/admin/faculties" class="btn btn-outline">Batal</a>
    </div>
  </form>
</div>`;

	return adminLayout(isEdit ? "Edit Fakultas" : "Tambah Fakultas", body, user);
}

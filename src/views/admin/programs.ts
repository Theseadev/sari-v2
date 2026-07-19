// src/views/admin/programs.ts — Program CRUD views

import { esc } from "../../helpers";
import { adminLayout, inputField, selectField } from "./helpers";

type ProgRow = {
	id: number;
	name: string;
	slug: string;
	faculty_name: string;
	faculty_id: number;
	created_at: string;
};
type Fac = { id: number; name: string };

export function progList(
	progs: ProgRow[],
	user: { name: string; roleName: string },
	currentPage?: string,
): string {
	let rows = "";
	if (progs.length === 0) {
		rows =
			'<tr><td colspan="5" class="text-muted text-center" style="padding:32px">Belum ada program studi.</td></tr>';
	} else {
		for (const p of progs) {
			rows += `<tr>
        <td>${p.id}</td>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${esc(p.faculty_name)}</td>
        <td><small class="text-muted">/${esc(p.slug)}</small></td>
        <td class="nowrap">
          <a href="/admin/programs/${p.id}/edit" class="btn-sm">Edit</a>
          <form method="POST" action="/admin/programs/${p.id}/delete" style="display:inline" onsubmit="return confirm('Hapus program studi ini?')">
            <button type="submit" class="btn-sm" style="background:#fef2f2;color:#b91c1c">Hapus</button>
          </form>
        </td>
      </tr>`;
		}
	}

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola Program Studi</h2>
  <a href="/admin/programs/create" class="btn btn-primary btn-sm">+ Tambah</a>
</div>
<div class="admin-card">
  <table class="table">
    <thead><tr><th>ID</th><th>Nama</th><th>Fakultas</th><th>Slug</th><th>Aksi</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;

	return adminLayout("Kelola Program Studi", body, user, currentPage);
}

export function progForm(
	user: { name: string; roleName: string },
	facs: Fac[],
	item?: {
		id?: number;
		name?: string;
		slug?: string;
		faculty_id?: number;
	} | null,
): string {
	const isEdit = !!item?.id;
	const action = isEdit
		? `/admin/programs/${item?.id}/update`
		: "/admin/programs/create";

	const facOpts = facs.map((f) => ({ value: f.id, label: f.name }));

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">${isEdit ? "Edit Program Studi" : "Tambah Program Studi"}</h2>
  <a href="/admin/programs" class="btn btn-outline btn-sm">← Kembali</a>
</div>
<div class="admin-card" style="padding:24px;max-width:520px">
  <form method="POST" action="${action}">
    ${inputField("Nama", "name", item?.name ?? "", { required: true })}
    ${inputField("Slug", "slug", item?.slug ?? "", { placeholder: "otomatis dari nama" })}
    ${selectField("Fakultas", "faculty_id", facOpts, item?.faculty_id ?? facs[0]?.id ?? 1, { required: true })}
    <div style="display:flex;gap:12px;margin-top:20px">
      <button type="submit" class="btn btn-primary">${isEdit ? "Simpan" : "Tambah"}</button>
      <a href="/admin/programs" class="btn btn-outline">Batal</a>
    </div>
  </form>
</div>`;

	return adminLayout(
		isEdit ? "Edit Program Studi" : "Tambah Program Studi",
		body,
		user,
	);
}

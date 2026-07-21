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
	pagination?: { page: number; totalPages: number; total: number },
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
          <form method="POST" action="/admin/programs/${p.id}/delete" style="display:inline">
            <button type="submit" class="btn-sm" style="background:#fef2f2;color:#b91c1c">Hapus</button>
          </form>
        </td>
      </tr>`;
		}
	}

	let paginationHtml = "";
	if (pagination && pagination.totalPages > 1) {
		const p = pagination;
		const pageLink = (n: number) => `/admin/programs?page=${n}`;
		const pages: (number | "...")[] = [];
		if (p.totalPages <= 7) {
			for (let i = 1; i <= p.totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			let start = Math.max(2, p.page - 1);
			let end = Math.min(p.totalPages - 1, p.page + 1);
			if (p.page <= 3) end = Math.min(4, p.totalPages - 1);
			else if (p.page >= p.totalPages - 2)
				start = Math.max(p.totalPages - 3, 2);
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
    <span class="admin-page-info">${p.total} prodi · Hal ${p.page}/${p.totalPages}</span>
    <div class="admin-page-btns">
      <a href="${pageLink(p.page - 1)}" class="admin-page-num${p.page <= 1 ? " disabled" : ""}">&laquo;</a>
      ${pageNums}
      <a href="${pageLink(p.page + 1)}" class="admin-page-num${p.page >= p.totalPages ? " disabled" : ""}">&raquo;</a>
    </div>
  </div>`;
	}

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola Program Studi</h2>
  <a href="/admin/programs/create" class="btn btn-primary btn-sm">+ Tambah</a>
</div>
<div class="admin-card">
  <div class="table-wrap">
  <table class="table">
    <thead><tr><th>ID</th><th>Nama</th><th>Fakultas</th><th>Slug</th><th>Aksi</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  </div>
  ${paginationHtml}
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

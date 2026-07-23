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
	pagination?: {
		page: number;
		totalPages: number;
		total: number;
		search?: string;
	},
	isAjax?: boolean,
): string {
	let rows = "";
	if (progs.length === 0) {
		rows =
			'<tr><td colspan="4" class="text-muted text-center" style="padding:32px">Belum ada program studi.</td></tr>';
	} else {
		for (const p of progs) {
			rows += `<tr>
        
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

	const search = pagination?.search || "";
	const searchParam = search ? `&q=${encodeURIComponent(search)}` : "";

	let paginationHtml = "";
	if (pagination && pagination.totalPages > 1) {
		const p = pagination;
		const pageLink = (n: number) => `/admin/programs?page=${n}${searchParam}`;
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

	const searchBox = `
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <input type="text" id="prodiSearch" placeholder="Cari nama atau fakultas..." value="${esc(search)}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;background:var(--bg-card);color:var(--text);outline:none">
    ${search ? `<a href="/admin/programs" class="btn btn-outline btn-sm">Reset</a>` : ""}
  </div>`;

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola Program Studi</h2>
  <a href="/admin/programs/create" class="btn btn-primary btn-sm">+ Tambah</a>
</div>
${searchBox}
<div class="admin-card">
  <div class="table-wrap">
  <table class="table">
    <thead><tr><th>Nama</th><th>Fakultas</th><th>Slug</th><th>Aksi</th></tr></thead>
    <tbody id="prodiTableBody">${rows}</tbody>
  </table>
  </div>
  ${paginationHtml}
</div>
<script>
(function(){
  var inp=document.getElementById('prodiSearch'),timer;
  if(!inp)return;
  var tbody=document.getElementById('prodiTableBody'),card=document.querySelector('.admin-card');
  inp.addEventListener('input',function(){
    clearTimeout(timer);
    timer=setTimeout(function(){
      var v=inp.value.trim();
      var url=v===''?'/admin/programs':'/admin/programs?q='+encodeURIComponent(v);
      fetch(url,{headers:{'X-Requested-With':'XMLHttpRequest'}}).then(function(r){return r.text();}).then(function(html){
        var d=document.createElement('div');d.innerHTML=html;
        var nt=d.querySelector('#prodiTableBody');
        var np=d.querySelector('.admin-pagination');
        if(nt&&tbody)tbody.innerHTML=nt.innerHTML;
        var oldp=card&&card.querySelector('.admin-pagination');
        if(np){if(oldp)oldp.outerHTML=np.outerHTML;else if(card)card.insertAdjacentHTML('beforeend',np.outerHTML);}
        else if(oldp)oldp.remove();
        history.replaceState({q:v},'',url);
      });
    },150);
  });
  window.addEventListener('popstate',function(){location.reload();});
})();
</script>`;

	if (isAjax) return body;
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

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
	search?: string,
	isAjax?: boolean,
): string {
	let rows = "";
	if (facs.length === 0) {
		rows =
			'<tr><td colspan="4" class="text-muted text-center" style="padding:32px">Belum ada fakultas.</td></tr>';
	} else {
		for (const f of facs) {
			rows += `<tr>
        <td><strong>${esc(f.name)}</strong><br><small class="text-muted">/${esc(f.slug)}</small></td>
        <td>${esc(f.description ?? "—")}</td>
        <td>${f.program_count ?? 0}</td>
        <td class="nowrap">
          <a href="/admin/faculties/${f.id}/edit" class="btn-sm">Edit</a>
          <form method="POST" action="/admin/faculties/${f.id}/delete" style="display:inline">
            <button type="submit" class="btn-sm" style="background:#fef2f2;color:#b91c1c">Hapus</button>
          </form>
        </td>
      </tr>`;
		}
	}

	const searchBox = `
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <input type="text" id="facSearch" placeholder="Cari nama atau deskripsi..." value="${esc(search || "")}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;background:var(--bg-card);color:var(--text);outline:none">
    ${search ? `<a href="/admin/faculties" class="btn btn-outline btn-sm">Reset</a>` : ""}
  </div>`;

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola Fakultas</h2>
  <a href="/admin/faculties/create" class="btn btn-primary btn-sm">+ Tambah</a>
</div>
${searchBox}
<div class="admin-card">
  <div class="table-wrap">
  <table class="table">
    <thead><tr><th>Nama</th><th>Deskripsi</th><th>Jml Prodi</th><th>Aksi</th></tr></thead>
    <tbody id="facTableBody">${rows}</tbody>
  </table>
  </div>
</div>
<script>
(function(){
  var inp=document.getElementById('facSearch'),timer;
  if(!inp)return;
  var tbody=document.getElementById('facTableBody'),card=document.querySelector('.admin-card');
  inp.addEventListener('input',function(){
    clearTimeout(timer);
    timer=setTimeout(function(){
      var v=inp.value.trim();
      var url=v===''?'/admin/faculties':'/admin/faculties?q='+encodeURIComponent(v);
      fetch(url,{headers:{'X-Requested-With':'XMLHttpRequest'}}).then(function(r){return r.text();}).then(function(html){
        var d=document.createElement('div');d.innerHTML=html;
        var nt=d.querySelector('#facTableBody');
        if(nt&&tbody)tbody.innerHTML=nt.innerHTML;
        history.replaceState({q:v},'',url);
      });
    },150);
  });
  window.addEventListener('popstate',function(){location.reload();});
})();
</script>`;

	if (isAjax) return body;
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

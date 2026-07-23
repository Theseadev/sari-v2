// src/views/admin/users.ts — User CRUD views

import { esc } from "../../helpers";
import { adminLayout, inputField, selectField } from "./helpers";

type UserRow = {
	id: number;
	username: string;
	name: string;
	email: string;
	nim_nip: string | null;
	status: string;
	role_name: string;
	last_login: string | null;
	created_at: string;
};
type Role = { id: number; name: string };

export function userList(
	users: UserRow[],
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
	if (users.length === 0) {
		rows =
			'<tr><td colspan="6" class="text-muted text-center" style="padding:32px">Belum ada user.</td></tr>';
	} else {
		for (const u of users) {
			const statusBadge =
				u.status === "active"
					? '<span class="badge-sm public">Aktif</span>'
					: '<span class="badge-sm internal">Nonaktif</span>';
			rows += `<tr>
        
        <td><strong>${esc(u.name)}</strong><br><small class="text-muted">@${esc(u.username)}</small></td>
        <td>${esc(u.email)}</td>
        <td><span class="badge-sm ${u.role_name === "super_admin" ? "internal" : "public"}">${esc(u.role_name)}</span></td>
        <td>${statusBadge}</td>
        <td><small>${u.last_login ? new Date(u.last_login).toLocaleDateString("id-ID") : "—"}</small></td>
        <td class="nowrap">
          <a href="/admin/users/${u.id}/edit" class="btn-sm">Edit</a>
          ${u.role_name !== "super_admin" ? `<form method="POST" action="/admin/users/${u.id}/delete" style="display:inline"><button type="submit" class="btn-sm" style="background:#fef2f2;color:#b91c1c">Hapus</button></form>` : ""}
        </td>
      </tr>`;
		}
	}

	const search = pagination?.search || "";
	const searchParam = search ? `&q=${encodeURIComponent(search)}` : "";

	let paginationHtml = "";
	if (pagination && pagination.totalPages > 1) {
		const p = pagination;
		const pageLink = (n: number) => `/admin/users?page=${n}${searchParam}`;
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
    <span class="admin-page-info">${p.total} user · Hal ${p.page}/${p.totalPages}</span>
    <div class="admin-page-btns">
      <a href="${pageLink(p.page - 1)}" class="admin-page-num${p.page <= 1 ? " disabled" : ""}">&laquo;</a>
      ${pageNums}
      <a href="${pageLink(p.page + 1)}" class="admin-page-num${p.page >= p.totalPages ? " disabled" : ""}">&raquo;</a>
    </div>
  </div>`;
	}

	const searchBox = `
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <input type="text" id="userSearch" placeholder="Cari nama, username, email, atau NIM/NIP..." value="${esc(search)}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;background:var(--bg-card);color:var(--text);outline:none">
    ${search ? `<a href="/admin/users" class="btn btn-outline btn-sm">Reset</a>` : ""}
  </div>`;

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola User</h2>
  <a href="/admin/users/create" class="btn btn-primary btn-sm">+ Tambah User</a>
</div>
${searchBox}
<div class="admin-card">
  <div class="table-wrap">
  <table class="table">
    <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Login Terakhir</th><th>Aksi</th></tr></thead>
    <tbody id="userTableBody">${rows}</tbody>
  </table>
  </div>
  ${paginationHtml}
</div>
<script>
(function(){
  var inp=document.getElementById('userSearch'),timer;
  if(!inp)return;
  var tbody=document.getElementById('userTableBody'),card=document.querySelector('.admin-card');
  inp.addEventListener('input',function(){
    clearTimeout(timer);
    timer=setTimeout(function(){
      var v=inp.value.trim();
      var url=v===''?'/admin/users':'/admin/users?q='+encodeURIComponent(v);
      fetch(url,{headers:{'X-Requested-With':'XMLHttpRequest'}}).then(function(r){return r.text();}).then(function(html){
        var d=document.createElement('div');d.innerHTML=html;
        var nt=d.querySelector('#userTableBody');
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
	return adminLayout("Kelola User", body, user, currentPage);
}

export function userForm(
	user: { name: string; roleName: string },
	roles: Role[],
	editUser?: {
		id?: number;
		username?: string;
		name?: string;
		email?: string;
		nim_nip?: string | null;
		role_id?: number;
		status?: string;
	} | null,
): string {
	const isEdit = !!editUser?.id;
	const action = isEdit
		? `/admin/users/${editUser?.id}/update`
		: "/admin/users/create";
	const title = isEdit ? "Edit User" : "Tambah User";

	const roleOpts = roles.map((r) => ({ value: r.id, label: r.name }));
	const statusOpts = [
		{ value: "active", label: "Aktif" },
		{ value: "inactive", label: "Nonaktif" },
	];

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">${isEdit ? "Edit User" : "Tambah User"}</h2>
  <a href="/admin/users" class="btn btn-outline btn-sm">← Kembali</a>
</div>
<div class="admin-card" style="padding:24px;max-width:560px">
  <form method="POST" action="${action}">
    ${inputField("Username", "username", editUser?.username ?? "", { required: true })}
    ${inputField("Nama Lengkap", "name", editUser?.name ?? "", { required: true })}
    ${inputField("Email", "email", editUser?.email ?? "", { type: "email", required: true })}
    ${inputField("NIM/NIP", "nim_nip", editUser?.nim_nip ?? "")}
    ${selectField("Role", "role_id", roleOpts, editUser?.role_id ?? 3, { required: true })}
    ${selectField("Status", "status", statusOpts, editUser?.status ?? "active", { required: true })}
    ${!isEdit ? '<div class="form-group"><label for="password">Password *</label><input type="password" id="password" name="password" class="form-control" required minlength="6"></div>' : '<div class="form-group"><label for="password">Password (kosongkan jika tidak ubah)</label><input type="password" id="password" name="password" class="form-control" minlength="6"></div>'}
    <div style="display:flex;gap:12px;margin-top:20px">
      <button type="submit" class="btn btn-primary">${isEdit ? "Simpan Perubahan" : "Tambah User"}</button>
      <a href="/admin/users" class="btn btn-outline">Batal</a>
    </div>
  </form>
</div>`;

	return adminLayout(title, body, user);
}

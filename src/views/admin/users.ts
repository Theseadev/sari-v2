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
): string {
	let rows = "";
	if (users.length === 0) {
		rows =
			'<tr><td colspan="7" class="text-muted text-center" style="padding:32px">Belum ada user.</td></tr>';
	} else {
		for (const u of users) {
			const statusBadge =
				u.status === "active"
					? '<span class="badge-sm public">Aktif</span>'
					: '<span class="badge-sm internal">Nonaktif</span>';
			rows += `<tr>
        <td>${u.id}</td>
        <td><strong>${esc(u.name)}</strong><br><small class="text-muted">@${esc(u.username)}</small></td>
        <td>${esc(u.email)}</td>
        <td><span class="badge-sm ${u.role_name === "super_admin" ? "internal" : "public"}">${esc(u.role_name)}</span></td>
        <td>${statusBadge}</td>
        <td><small>${u.last_login ? new Date(u.last_login).toLocaleDateString("id-ID") : "—"}</small></td>
        <td class="nowrap">
          <a href="/admin/users/${u.id}/edit" class="btn-sm">Edit</a>
          ${u.role_name !== "super_admin" ? `<form method="POST" action="/admin/users/${u.id}/delete" style="display:inline" onsubmit="return confirm('Hapus user ini?')"><button type="submit" class="btn-sm" style="background:#fef2f2;color:#b91c1c">Hapus</button></form>` : ""}
        </td>
      </tr>`;
		}
	}

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Kelola User</h2>
  <a href="/admin/users/create" class="btn btn-primary btn-sm">+ Tambah User</a>
</div>
<div class="admin-card">
  <table class="table">
    <thead><tr><th>ID</th><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Login Terakhir</th><th>Aksi</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;

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

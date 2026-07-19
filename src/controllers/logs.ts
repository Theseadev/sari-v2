// src/controllers/logs.ts - Log aktivitas (Super Admin only)

import type { Context } from "hono";
import { query } from "../config/database";
import type { ActivityLog } from "../types";
import { esc } from "../helpers";
import { adminLayout } from "../views/admin/helpers";
import { getUser, getFlash } from "../helpers";

export async function logs(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (user.roleName !== "super_admin") return c.redirect("/admin");
	const _flash = getFlash(c);

	const rows = await query<ActivityLog[]>(
		`SELECT al.*, u.name AS user_name
     FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC LIMIT 100`,
	);

	let tableRows = "";
	for (const row of rows) {
		tableRows += `<tr>
      <td>${row.id}</td>
      <td>${esc(row.user_name ?? "-")}</td>
      <td>${esc(row.action)}</td>
      <td>${esc(row.description ?? "")}</td>
      <td>${esc(row.ip_address ?? "-")}</td>
      <td>${row.created_at}</td>
    </tr>`;
	}

	const body = `
  <div class="admin-page">
    <div class="container">
      <div class="breadcrumb"><a href="/admin">Dashboard</a> <span>/</span> <span>Log Aktivitas</span></div>
      <h1 style="font-size:1.5rem;margin-bottom:20px">Log Aktivitas</h1>
      <div class="recent-logs">
        <table class="table">
          <thead><tr><th>ID</th><th>User</th><th>Aksi</th><th>Deskripsi</th><th>IP</th><th>Waktu</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <a href="/admin" class="btn btn-outline mt-2">← Kembali</a>
    </div>
  </div>`;

	return c.html(
		adminLayout(
			"Log Aktivitas",
			body,
			{ name: user.name, roleName: user.roleName },
			"logs",
		),
	);
}

// src/controllers/logs.ts - Log aktivitas (Super Admin only)

import type { Context } from "hono";
import { query, queryOne } from "../config/database";
import type { ActivityLog } from "../types";
import { esc } from "../helpers";
import { adminLayout } from "../views/admin/helpers";
import { getUser, getFlash } from "../helpers";

export async function logs(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (user.roleName !== "super_admin") return c.redirect("/admin");
	const _flash = getFlash(c);
	const perPage = 5;
	const page = Math.max(1, Number(c.req.query("page")) || 1);
	const offset = (page - 1) * perPage;

	const total = await queryOne<{ cnt: number }>(
		"SELECT COUNT(*) AS cnt FROM activity_logs",
	);
	const totalPages = Math.ceil((total?.cnt || 0) / perPage);

	const rows = await query<ActivityLog[]>(
		`SELECT al.*, u.name AS user_name
     FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT ${perPage} OFFSET ${offset}`,
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

	// Pagination
	let paginationHtml = "";
	if (totalPages > 1) {
		const pageLink = (n: number) => `/admin/logs?page=${n}`;
		const pages: (number | "...")[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			let start = Math.max(2, page - 1);
			let end = Math.min(totalPages - 1, page + 1);
			if (page <= 3) end = Math.min(4, totalPages - 1);
			else if (page >= totalPages - 2) start = Math.max(totalPages - 3, 2);
			if (start > 2) pages.push("...");
			for (let i = start; i <= end; i++) pages.push(i);
			if (end < totalPages - 1) pages.push("...");
			pages.push(totalPages);
		}
		let pageNums = "";
		for (const pg of pages) {
			if (pg === "...") {
				pageNums += `<span class="admin-page-dots">…</span>`;
			} else {
				const cls = pg === page ? " admin-page-active" : "";
				pageNums += `<a href="${pageLink(pg)}" class="admin-page-num${cls}">${pg}</a>`;
			}
		}
		paginationHtml = `
  <div class="admin-pagination">
    <span class="admin-page-info">${total?.cnt || 0} log · Hal ${page}/${totalPages}</span>
    <div class="admin-page-btns">
      <a href="${pageLink(page - 1)}" class="admin-page-num${page <= 1 ? " disabled" : ""}">&laquo;</a>
      ${pageNums}
      <a href="${pageLink(page + 1)}" class="admin-page-num${page >= totalPages ? " disabled" : ""}">&raquo;</a>
    </div>
  </div>`;
	}

	const body = `
  <div class="admin-page">
    <div class="container">
      <div class="breadcrumb"><a href="/admin">Dashboard</a> <span>/</span> <span>Log Aktivitas</span></div>
      <h1 style="font-size:1.5rem;margin-bottom:20px">Log Aktivitas</h1>
      <div class="recent-logs admin-card">
        <table class="table">
          <thead><tr><th>ID</th><th>User</th><th>Aksi</th><th>Deskripsi</th><th>IP</th><th>Waktu</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        ${paginationHtml}
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

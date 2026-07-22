// src/controllers/logs.ts - Log aktivitas (Super Admin only)

import type { Context } from "hono";
import { queryRaw } from "../config/database";
import { esc, getFlash, getUser } from "../helpers";
import type { ActivityLog } from "../types";
import { adminLayout } from "../views/admin/helpers";

export async function logs(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (user.roleName !== "super_admin") return c.redirect("/admin");
	const _flash = getFlash(c);
	const perPage = 5;
	const page = Math.max(1, Number(c.req.query("page")) || 1);
	const search = (c.req.query("q") || "").trim();
	const offset = (page - 1) * perPage;

	// Build WHERE clause + params for each query (separate arrays to avoid
	// mysql2 prepared-statement cache issues with shared mutable params)
	let whereClause = "";
	const countParams: (string | number)[] = [];
	const dataParams: (string | number)[] = [];
	if (search) {
		whereClause = ` WHERE u.name LIKE ? OR al.action LIKE ? OR al.description LIKE ? OR al.ip_address LIKE ?`;
		const term = `%${search}%`;
		countParams.push(term, term, term, term);
		dataParams.push(term, term, term, term);
	}

	// Total count (queryRaw avoids prepared-statement + LIKE issues in mysql2 v3)
	const countRows = await queryRaw<{ cnt: number }[]>(
		`SELECT COUNT(*) AS cnt FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id${whereClause}`,
		countParams,
	);
	const total = countRows[0]?.cnt ?? 0;
	const totalPages = Math.ceil(total / perPage);

	// Fetch rows
	dataParams.push(perPage, offset);
	const rows = await queryRaw<ActivityLog[]>(
		`SELECT al.*, u.name AS user_name
     FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id${whereClause}
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`,
		dataParams,
	);

	let tableRows = "";
	for (const row of rows) {
		tableRows += `<tr>
      
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
		const qs = (n: number) =>
			search ? `?q=${encodeURIComponent(search)}&page=${n}` : `?page=${n}`;
		const pageLink = (n: number) => `/admin/logs${qs(n)}`;
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
    <span class="admin-page-info">${total} log · Hal ${page}/${totalPages}</span>
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
      <form method="GET" style="margin-bottom:20px;display:flex;gap:8px">
        <input type="text" name="q" placeholder="Cari user, aksi, deskripsi, IP..." value="${esc(search)}" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;min-width:300px;background:var(--bg);color:var(--text)">
        <button type="submit" class="btn btn-primary btn-sm">Cari</button>
        ${search ? `<a href="/admin/logs" class="btn btn-outline btn-sm">Reset</a>` : ""}
      </form>
      <div class="recent-logs admin-card">
        <table class="table">
          <thead><tr><th>User</th><th>Aksi</th><th>Deskripsi</th><th>IP</th><th>Waktu</th></tr></thead>
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

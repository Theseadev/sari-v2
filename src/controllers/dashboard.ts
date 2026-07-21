// src/controllers/dashboard.ts - Admin dashboard

import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { query, queryOne } from "../config/database";
import type { Stats, ActivityLog, Book } from "../types";
import { esc } from "../helpers";
import { adminLayout } from "../views/admin/helpers";
import { getUser, getFlash } from "../helpers";

export async function dashboard(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/buku");
	const flash = getFlash(c);

	const [bookCount] = await query<any[]>("SELECT COUNT(*) AS c FROM books");
	const [userCount] = await query<any[]>(
		"SELECT COUNT(*) AS c FROM users WHERE status = 'active'",
	);
	const [pubCount] = await query<any[]>(
		"SELECT COUNT(*) AS c FROM books WHERE access_type = 'public'",
	);
	const [intCount] = await query<any[]>(
		"SELECT COUNT(*) AS c FROM books WHERE access_type = 'internal'",
	);
	const [viewCount] = await query<any[]>(
		"SELECT COALESCE(SUM(views),0) AS c FROM books",
	);

	const stats = {
		total_books: Number(bookCount.c),
		total_users: Number(userCount.c),
		total_public: Number(pubCount.c),
		total_internal: Number(intCount.c),
		total_views: Number(viewCount.c),
	};

	// Logs
	const perPageLogs = 5;
	const logsPage = Math.max(1, Number(c.req.query("logs_page")) || 1);
	const logsOffset = (logsPage - 1) * perPageLogs;

	const logsTotal = await queryOne<{ cnt: number }>(
		"SELECT COUNT(*) AS cnt FROM activity_logs",
	);
	const logsTotalPages = Math.ceil((logsTotal?.cnt || 0) / perPageLogs);

	const logs = await query<ActivityLog[]>(
		`SELECT al.*, u.name AS user_name
		 FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id
		 ORDER BY al.created_at DESC
		 LIMIT ${perPageLogs} OFFSET ${logsOffset}`,
	);

	// Buku terbaru
	const perPageBooks = 5;
	const booksPage = Math.max(1, Number(c.req.query("books_page")) || 1);
	const booksOffset = (booksPage - 1) * perPageBooks;

	const booksTotal = await queryOne<{ cnt: number }>(
		"SELECT COUNT(*) AS cnt FROM books",
	);
	const booksTotalPages = Math.ceil((booksTotal?.cnt || 0) / perPageBooks);

	const recentBooks = await query<Book[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.access_type, b.cover_image, b.views, b.created_at
		 FROM books b
		 ORDER BY b.created_at DESC
		 LIMIT ${perPageBooks} OFFSET ${booksOffset}`,
	);

	// ── Render Stats ──
	const icons = {
		books: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
		public: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
		internal: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
		users: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
		views: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
	};
	const statCards = [
		{ label: "Total Buku", value: stats.total_books, icon: icons.books },
		{ label: "Publik", value: stats.total_public, icon: icons.public },
		{ label: "Internal", value: stats.total_internal, icon: icons.internal },
		{ label: "User Aktif", value: stats.total_users, icon: icons.users },
		{
			label: "Total Dibaca",
			value: stats.total_views.toLocaleString("id-ID"),
			icon: icons.views,
		},
	]
		.map(
			(s) => `<div class="stat-item">
		<span class="stat-icon">${s.icon}</span>
		<div class="stat-body">
			<span class="stat-num">${s.value}</span>
			<span class="stat-lbl">${s.label}</span>
		</div>
	</div>`,
		)
		.join("");

	// ── Render Logs ──
	let logRows = "";
	if (logs.length === 0) {
		logRows =
			'<tr><td colspan="4" class="text-muted text-center" style="padding:24px">Belum ada aktivitas</td></tr>';
	} else {
		for (const log of logs) {
			const actionBadge = getActionBadge(log.action);
			logRows += `<tr>
				<td><span class="log-user">${esc(log.user_name ?? "—")}</span></td>
				<td>${actionBadge}</td>
				<td class="log-desc">${esc(log.description ?? "")}</td>
				<td class="log-time">${timeAgo(log.created_at)}</td>
			</tr>`;
		}
	}

	// ── Render Recent Books ──
	let recentRows = "";
	for (const b of recentBooks) {
		const cover = b.cover_image
			? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="">`
			: "—";
		recentRows += `<tr>
			<td><div class="recent-cover">${cover}</div></td>
			<td><a href="/buku/${esc(b.slug)}" class="recent-title">${esc(b.title)}</a>
				<div class="recent-author">${esc(b.author)}</div></td>
			<td><span class="badge-sm ${b.access_type}">${b.access_type === "internal" ? "Internal" : "Publik"}</span></td>
			<td class="log-time">${timeAgo(b.created_at)}</td>
		</tr>`;
	}

	// ── Build page ──
	const body = `
	<div class="admin-page">
		<div class="container">

			<!-- Header -->
			<div class="admin-header">
				<div class="admin-avatar">${esc(user.name.charAt(0).toUpperCase())}</div>
				<div>
					<h1>Selamat datang, ${esc(user.name.split(" ")[0])}</h1>
					<p style="color:var(--text-muted);font-size:0.85rem;margin-top:2px">
						${user.roleName === "super_admin" ? "Super Admin" : "Pustakawan"} · ${stats.total_books} buku terkelola
					</p>
				</div>
			</div>

			<!-- Stats Bar -->
			<div class="stats-bar">${statCards}</div>

			<div class="admin-dash-grid">
				<!-- Recent Activity -->
				<div class="dash-section">
					<div class="dash-section-header">
						<h2>Aktivitas Terkini</h2>
						<span class="dash-section-count">${logsTotal?.cnt || 0} total</span>
					</div>
					<div class="dash-table-wrap">
					<table class="dash-table">
						<thead><tr><th>User</th><th>Aksi</th><th>Keterangan</th><th>Waktu</th></tr></thead>
						<tbody>${logRows}</tbody>
					</table>
					</div>
					${
						logsTotalPages > 1
							? `
					<div class="admin-pagination">
						<span class="admin-page-info">Hal ${logsPage}/${logsTotalPages}</span>
						<div class="admin-page-btns">
							<a href="?logs_page=${logsPage - 1}" class="admin-page-num${logsPage <= 1 ? " disabled" : ""}">&laquo;</a>
							<a href="?logs_page=${logsPage + 1}" class="admin-page-num${logsPage >= logsTotalPages ? " disabled" : ""}">&raquo;</a>
						</div>
					</div>`
							: ""
					}
				</div>

				<!-- Recent Books -->
				<div class="dash-section">
					<div class="dash-section-header">
						<h2>Buku Terbaru</h2>
						<a href="/buku" class="dash-link">Lihat Semua →</a>
					</div>
					<div class="dash-table-wrap">
					<table class="dash-table">
						<thead><tr><th style="width:44px"></th><th>Judul</th><th>Akses</th><th>Ditambahkan</th></tr></thead>
						<tbody>${recentRows}</tbody>
					</table>
					</div>
					${
						booksTotalPages > 1
							? `
					<div class="admin-pagination">
						<span class="admin-page-info">Hal ${booksPage}/${booksTotalPages}</span>
						<div class="admin-page-btns">
							<a href="?books_page=${booksPage - 1}" class="admin-page-num${booksPage <= 1 ? " disabled" : ""}">&laquo;</a>
							<a href="?books_page=${booksPage + 1}" class="admin-page-num${booksPage >= booksTotalPages ? " disabled" : ""}">&raquo;</a>
						</div>
					</div>`
							: ""
					}
				</div>
			</div>

		</div>
	</div>`;

	return c.html(
		adminLayout(
			"Dashboard Admin",
			body,
			{ name: user.name, roleName: user.roleName },
			"dashboard",
		),
	);
}

/* ── Helpers ── */

function getActionBadge(action: string): string {
	const map: Record<string, string> = {
		login: "badge-login",
		logout: "badge-logout",
		create_book: "badge-create",
		update_book: "badge-update",
		delete_book: "badge-delete",
	};
	const cls = map[action] || "badge-default";
	const label = action.replace(/_/g, " ");
	return `<span class="action-badge ${cls}">${label}</span>`;
}

function timeAgo(dateStr: string): string {
	const now = Date.now();
	const d = new Date(dateStr).getTime();
	const diff = Math.floor((now - d) / 1000);
	if (diff < 60) return "baru saja";
	if (diff < 3600) return `${Math.floor(diff / 60)}m`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
	if (diff < 2592000) return `${Math.floor(diff / 86400)}h`;
	return dateStr.slice(0, 10);
}

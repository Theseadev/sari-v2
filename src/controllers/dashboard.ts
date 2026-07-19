// src/controllers/dashboard.ts - Admin dashboard

import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { query } from "../config/database";
import type { Stats, ActivityLog, Book } from "../types";
import { esc } from "../helpers";
import { adminLayout } from "../views/admin/helpers";
import { getUser } from "./auth";

export async function dashboard(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
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
		total_books: bookCount.c,
		total_users: userCount.c,
		total_public: pubCount.c,
		total_internal: intCount.c,
		total_views: viewCount.c,
	};

	// Logs
	const logs = await query<ActivityLog[]>(
		`SELECT al.*, u.name AS user_name
		 FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id
		 ORDER BY al.created_at DESC LIMIT 8`,
	);

	// Buku terbaru
	const recentBooks = await query<Book[]>(
		`SELECT b.id, b.title, b.slug, b.author, b.access_type, b.cover_image, b.views, b.created_at
		 FROM books b
		 ORDER BY b.created_at DESC LIMIT 5`,
	);

	// ── Render Stats ──
	const statCards = [
		{
			label: "Total Buku",
			value: stats.total_books,
			color: "#2250fc",
		},
		{
			label: "Publik",
			value: stats.total_public,
			color: "#059669",
		},
		{
			label: "Internal",
			value: stats.total_internal,
			color: "#d97706",
		},
		{
			label: "User Aktif",
			value: stats.total_users,
			color: "#7c3aed",
		},
		{
			label: "Total Dibaca",
			value: stats.total_views,
			color: "#0891b2",
		},
	]
		.map(
			(s) => `<div class="stat-card" style="border-left:3px solid ${s.color}">
		<div><span class="stat-number">${s.value}</span><span class="stat-label">${s.label}</span></div>
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
					<p class="text-muted" style="font-size:0.85rem">
						${user.roleName === "super_admin" ? "Super Admin" : "Pustakawan"} ·
						${stats.total_books} buku terkelola
					</p>
				</div>
			</div>

			<!-- Stats -->
			<div class="stats-grid">${statCards}</div>

			<div class="admin-grid-2">
				<!-- Recent Activity -->
				<div class="admin-card">
					<div class="card-header">
						<h2>Aktivitas Terkini</h2>
					</div>
					<table class="table">
						<thead><tr><th>User</th><th>Aksi</th><th>Keterangan</th><th>Waktu</th></tr></thead>
						<tbody>${logRows}</tbody>
					</table>
				</div>

				<!-- Recent Books -->
				<div class="admin-card">
					<div class="card-header">
						<h2>Buku Terbaru</h2>
						<a href="/buku" class="btn-sm">Lihat Semua →</a>
					</div>
					<table class="table">
						<thead><tr><th style="width:44px"></th><th>Judul</th><th>Akses</th><th>Ditambahkan</th></tr></thead>
						<tbody>${recentRows}</tbody>
					</table>
				</div>
			</div>

		</div>
	</div>`;

	return c.html(adminLayout("Dashboard Admin", body, { name: user.name, roleName: user.roleName }, "dashboard"));
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

function getFlash(c: Context): any {
	const raw = getCookie(c, "flash");
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

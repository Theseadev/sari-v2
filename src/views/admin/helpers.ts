// src/views/admin/helpers.ts — Shared admin HTML helpers

import { esc } from "../../helpers";

export function adminLayout(
	title: string,
	body: string,
	user: { name: string; roleName: string },
	currentPage?: string,
): string {
	return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)} - SARI Admin</title>
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
<header class="admin-header-bar">
  <div class="ahb-left">
    <a href="/admin" class="ahb-logo">
      <span class="ahb-logo-icon">S</span>
      <span class="ahb-logo-text">SARI</span>
      <span class="ahb-logo-sub">Admin Panel</span>
    </a>
  </div>
  <div class="ahb-center">
    <div class="ahb-search">
      <svg class="ahb-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" placeholder="Cari buku, user, kategori..." class="ahb-search-input">
    </div>
  </div>
  <div class="ahb-right">
    <button class="ahb-icon-btn" title="Notifikasi">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span class="ahb-badge">3</span>
    </button>
    <a href="/" class="ahb-icon-btn" title="Lihat Situs">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    </a>
    <div class="ahb-divider"></div>
    <div class="ahb-profile">
      <div class="ahb-avatar">${esc(user.name.charAt(0).toUpperCase())}</div>
      <div class="ahb-profile-info">
        <span class="ahb-profile-name">${esc(user.name)}</span>
        <span class="ahb-profile-role">${user.roleName === "super_admin" ? "Super Admin" : "Pustakawan"}</span>
      </div>
    </div>
    <a href="/logout" class="ahb-logout">Logout</a>
  </div>
</header>

<div class="admin-body">
  ${sidebar(user, currentPage)}
  <main class="admin-main">
    <div class="admin-content">
      ${body}
    </div>
  </main>
</div>
</body>
</html>`;
}

function sidebar(
	user: { name: string; roleName: string },
	currentPage?: string,
): string {
	const navItems = [
		{ href: "/admin", label: "Dashboard", id: "dashboard" },
		{ href: "/admin/books", label: "Buku", id: "books" },
		{ href: "/admin/faculties", label: "Fakultas", id: "faculties" },
		{ href: "/admin/programs", label: "Prodi", id: "programs" },
		{ href: "/admin/users", label: "User", id: "users" },
		{ href: "/admin/logs", label: "Log Aktivitas", id: "logs" },
	];

	let links = "";
	for (const item of navItems) {
		const active = currentPage === item.id ? " active" : "";
		if (item.id === "logs" && user.roleName !== "super_admin") continue;
		links += `<a href="${item.href}" class="sb-link${active}">
      <span class="sb-label">${item.label}</span>
    </a>`;
	}

	return `
<aside class="sidebar">
  <nav class="sb-nav">
    ${links}
  </nav>
  <div class="sb-footer">
    <a href="/" class="sb-link">
      <span class="sb-label">← Kembali ke Situs</span>
    </a>
  </div>
</aside>`;
}

export function inputField(
	label: string,
	name: string,
	value: string,
	opts?: {
		type?: string;
		required?: boolean;
		placeholder?: string;
		readonly?: boolean;
	},
): string {
	const type = opts?.type ?? "text";
	const req = opts?.required ? " required" : "";
	const ph = opts?.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : "";
	const ro = opts?.readonly ? " readonly" : "";
	return `
<div class="form-group">
  <label for="${name}">${esc(label)}</label>
  <input type="${type}" id="${name}" name="${name}" class="form-control" value="${esc(value)}"${req}${ph}${ro}>
</div>`;
}

export function textareaField(
	label: string,
	name: string,
	value: string,
	opts?: { required?: boolean; rows?: number; placeholder?: string },
): string {
	const req = opts?.required ? " required" : "";
	const rows = opts?.rows ?? 4;
	const ph = opts?.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : "";
	return `
<div class="form-group">
  <label for="${name}">${esc(label)}</label>
  <textarea id="${name}" name="${name}" class="form-control" rows="${rows}"${req}${ph}>${esc(value)}</textarea>
</div>`;
}

export function selectField(
	label: string,
	name: string,
	options: { value: string | number; label: string }[],
	selected: string | number,
	opts?: { required?: boolean },
): string {
	const req = opts?.required ? " required" : "";
	let optsHtml = `<option value="">— Pilih —</option>`;
	for (const o of options) {
		const sel = String(o.value) === String(selected) ? " selected" : "";
		optsHtml += `<option value="${o.value}"${sel}>${esc(o.label)}</option>`;
	}
	return `
<div class="form-group">
  <label for="${name}">${esc(label)}</label>
  <select id="${name}" name="${name}" class="form-control"${req}>${optsHtml}</select>
</div>`;
}

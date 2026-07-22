// src/views/admin/jobie-helpers.ts — Jobie Admin Layout Helpers (Modern Deep Purple Sidebar)

import { esc } from "../../helpers";
import { csrfToken } from "../html";

export function jobieAdminLayout(
	title: string,
	body: string,
	user: { name: string; email: string; role: string; avatar?: string },
	currentPage?: string,
): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)} - Jobie Admin</title>
<link rel="stylesheet" href="/assets/css/jobie-admin.css">
<meta name="csrf-token" content="${esc(csrfToken())}">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
<div class="jobie-layout">
  <aside class="jobie-sidebar" role="navigation" aria-label="Jobie Admin Navigation">
    <div class="js-brand">
      <a href="/jobie-admin" class="js-logo" aria-label="Jobie Admin Home">
        <svg class="js-logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span class="js-logo-text">Jobie</span>
      </a>
    </div>

    <nav class="js-nav" aria-label="Main navigation">
      <ul class="js-nav-list" role="list">
        ${navItem(
					"/jobie-admin",
					"Dashboard",
					"dashboard",
					currentPage,
					`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        `,
				)}
        ${navItem(
					"/jobie-admin/jobs",
					"Search Job",
					"search-job",
					currentPage,
					`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        `,
				)}
        ${navItem(
					"/jobie-admin/applications",
					"Applications",
					"applications",
					currentPage,
					`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        `,
				)}
        ${navItem(
					"/jobie-admin/messages",
					"Message",
					"messages",
					currentPage,
					`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        `,
				)}
        ${navItem(
					"/jobie-admin/statistics",
					"Statistics",
					"statistics",
					currentPage,
					`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        `,
				)}
        ${navItem(
					"/jobie-admin/news",
					"News",
					"news",
					currentPage,
					`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/><polyline points="14 14 10 18 6 14"/><line x1="14" y1="10" x2="14" y2="4"/></svg>
        `,
				)}
      </ul>
    </nav>

    <footer class="js-footer" role="contentinfo">
      <p class="js-copyright">&copy; ${new Date().getFullYear()} Jobie. All rights reserved.</p>
      <p class="js-version">v1.0.0</p>
    </footer>
  </aside>

  <main class="jobie-main" role="main">
    <div class="jobie-bg-blur" aria-hidden="true">
      <div class="jobie-bokeh" aria-hidden="true">
        <span class="bokeh b1"></span>
        <span class="bokeh b2"></span>
        <span class="bokeh b3"></span>
        <span class="bokeh b4"></span>
        <span class="bokeh b5"></span>
        <span class="bokeh b6"></span>
        <span class="bokeh b7"></span>
        <span class="bokeh b8"></span>
      </div>
    </div>

    <header class="jobie-topbar" role="banner">
      <div class="jt-left">
        <h1 class="jt-title">${esc(title)}</h1>
      </div>
      <div class="jt-right">
        <button class="jt-btn jt-theme" id="themeToggle" aria-label="Toggle theme" title="Toggle theme">
          <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button class="jt-btn jt-notif" aria-label="Notifications" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span class="jt-badge">3</span>
        </button>
        <div class="jt-divider" aria-hidden="true"></div>
        <div class="jt-profile" role="menu" aria-label="User menu">
          <div class="jt-avatar" aria-hidden="true">${esc(user.name?.charAt(0).toUpperCase() || "J")}</div>
          <div class="jt-profile-info">
            <span class="jt-profile-name">${esc(user.name)}</span>
            <span class="jt-profile-role">${esc(user.role)}</span>
          </div>
        </div>
        <a href="/logout" class="jt-btn jt-logout" aria-label="Sign out">Logout</a>
      </div>
    </header>

    <div class="jobie-content">
      ${body}
    </div>
  </main>
</div>

<script src="/assets/js/jobie-admin.js"></script>
</body>
</html>`;
}

function navItem(
	href: string,
	label: string,
	id: string,
	currentPage?: string,
	icon?: string,
): string {
	const active = currentPage === id ? " js-nav-item--active" : "";
	return `
<li class="js-nav-item${active}" role="none">
  <a href="${esc(href)}" class="js-nav-link" role="menuitem">
    <span class="js-nav-icon" aria-hidden="true">${icon}</span>
    <span class="js-nav-label">${esc(label)}</span>
  </a>
</li>`;
}

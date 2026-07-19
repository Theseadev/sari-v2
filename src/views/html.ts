// src/views/html.ts - Layout HTML ala BUDI Kemendikbud

import { APP, esc } from "../helpers";
import type { JwtPayload } from "../types";
import { createHmac } from "node:crypto";

export function layout(
	title: string,
	body: string,
	user: JwtPayload | null,
	flash?: { type: string; message: string } | null,
	seo?: { description?: string; ogImage?: string; ogType?: string },
): string {
	const navRight = user
		? `
    <li class="user-dropdown-wrap">
      <a href="#" class="badge ${user.roleName} user-dropdown-trigger">${esc(user.name)} <span style="font-size:0.6rem;margin-left:2px">▾</span></a>
      <div class="user-dropdown">
        <a href="/profil">Profil</a>
        <a href="/bookmark">Bookmark</a>
        <a href="/riwayat">Riwayat</a>
        ${["admin", "super_admin", "pustakawan"].includes(user.roleName) ? '<a href="/admin">Dashboard</a>' : ""}
        <a href="/logout" class="dd-logout">Logout</a>
      </div>
    </li>`
		: `<li><a href="#" id="openAuth">Masuk / Daftar</a></li>`;

	const flashHtml = flash?.message
		? `<meta name="flash-type" content="${esc(flash.type)}"><meta name="flash-msg" content="${esc(flash.message)}">`
		: "";

	const description =
		seo?.description ||
		"Perpustakaan Digital Universitas Sari Mulia Banjarmasin. Akses koleksi buku, skripsi, jurnal, dan referensi ilmiah kapan saja.";
	const ogImage = seo?.ogImage || "/assets/images/og-default.jpg";
	const ogType = seo?.ogType || "website";

	return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:type" content="${esc(ogType)}">
<meta property="og:site_name" content="${esc(APP.NAME)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<link rel="stylesheet" href="/assets/css/style.css">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<meta name="csrf-token" content="${esc(csrfToken())}">
</head>
<body>

<header class="header" id="header">
  <div class="header-inner">
    <div id="logo">
      <a href="/" style="display:flex;align-items:center;gap:8px">
        <span style="font-weight:800;color:var(--primary);font-size:1.2rem">S</span>
        <span>SARI</span>
      </a>
    </div>
    <ul class="header-menu">
      <li><a href="/buku">Katalog</a></li>
      ${navRight}
    </ul>
  </div>
</header>

${flashHtml}

<main>${body}</main>

${
	!user
		? `
<div id="authModal" class="modal-overlay">
  <div class="modal-card modal-sm">
    <button class="modal-close" id="closeAuthModal">&times;</button>
    <div class="auth-tabs">
      <button type="button" class="auth-tab active" data-tab="login">Masuk</button>
      <button type="button" class="auth-tab" data-tab="register">Daftar</button>
    </div>
    <div class="auth-panels">
      <div class="auth-panel active" id="panel-login">
        <h2>Masuk Perpustakaan Digital</h2>
        <form method="POST" action="/login">
          <input type="hidden" name="csrf_token" value="${esc(csrfToken())}">
          <div class="form-group">
            <label for="modal-email">Email</label>
            <input type="email" id="modal-email" name="email" class="form-control" required autocomplete="email" placeholder="email@unisma.ac.id">
          </div>
          <div class="form-group">
            <label for="modal-password">Password</label>
            <input type="password" id="modal-password" name="password" class="form-control" required autocomplete="current-password">
          </div>
          <input type="hidden" name="redirect" value="/buku">
          <button type="submit" class="btn btn-primary btn-block">Masuk</button>
        </form>
        <p class="text-center mt-2 text-muted"><a href="/lupa-password">Lupa Password?</a></p>
        <p class="text-center mt-2 text-muted"><a href="/buku">Jelajahi Katalog Publik →</a></p>
      </div>
      <div class="auth-panel" id="panel-register">
        <h2>Daftar Akun Tamu</h2>
        <form method="POST" action="/register">
          <div class="form-row-2">
            <div class="form-group">
              <label for="modal-name">Nama Lengkap</label>
              <input type="text" id="modal-name" name="name" class="form-control" required autocomplete="name" placeholder="Nama lengkap">
            </div>
            <div class="form-group">
              <label for="modal-email-reg">Email</label>
              <input type="email" id="modal-email-reg" name="email" class="form-control" required autocomplete="email" placeholder="email@unisma.ac.id">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label for="modal-password-reg">Password</label>
              <input type="password" id="modal-password-reg" name="password" class="form-control" required autocomplete="new-password" minlength="6" placeholder="Minimal 6 karakter">
            </div>
            <div class="form-group">
              <label for="modal-password_confirm">Konfirmasi Password</label>
              <input type="password" id="modal-password_confirm" name="password_confirm" class="form-control" required autocomplete="new-password" placeholder="Ulangi password">
            </div>
          </div>
          <input type="hidden" name="csrf_token" value="${esc(csrfToken())}">
          <button type="submit" class="btn btn-primary btn-block">Daftar</button>
        </form>
        <p class="text-center mt-2 text-muted"><a href="#" data-switch="login">Sudah punya akun? Masuk →</a></p>
      </div>
    </div>
  </div>
</div>`
		: ""
}

<footer class="footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <div class="logo">SARI</div>
        <p>Perpustakaan Digital Universitas Sari Mulia Banjarmasin. Akses koleksi buku, skripsi, jurnal, dan referensi ilmiah kapan saja.</p>
      </div>
      <div class="footer-links">
        <div class="footer-col">
          <h4>Navigasi</h4>
          <a href="/buku">Katalog Buku</a>
        </div>
        <div class="footer-col">
          <h4>Universitas</h4>
          <a href="#">Sari Mulia Banjarmasin</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} SARI — ${APP.NAME}</p>
      <p>Universitas Sari Mulia Banjarmasin</p>
    </div>
  </div>
</footer>

<script src="/assets/js/app.js"></script>
</body>
</html>`;
}

function csrfToken(): string {
	// Ponytail: simple HMAC-based token for CSRF (stateless, no session storage needed)
	const secret =
		process.env.CSRF_SECRET || "sari-csrf-dev-change-in-production";
	const timestamp = Math.floor(Date.now() / 3600000).toString(); // 1-hour windows
	return createHmac("sha256", secret)
		.update(timestamp)
		.digest("hex")
		.slice(0, 32);
}

export function verifyCsrfToken(token: string): boolean {
	const secret =
		process.env.CSRF_SECRET || "sari-csrf-dev-change-in-production";
	const now = Math.floor(Date.now() / 3600000);
	for (let i = 0; i < 2; i++) {
		const expected = createHmac("sha256", secret)
			.update((now - i).toString())
			.digest("hex")
			.slice(0, 32);
		if (token === expected) return true;
	}
	return false;
}

export function errorPage(
	code: number,
	title: string,
	msg: string,
	user?: JwtPayload | null,
): string {
	return layout(
		`${code} - ${APP.NAME}`,
		`<div class="error-page"><h1>${code}</h1><h2>${esc(title)}</h2><p>${esc(msg)}</p><a href="/" class="btn btn-primary">Kembali ke Beranda</a></div>`,
		user ?? null,
	);
}
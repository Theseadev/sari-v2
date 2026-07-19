// src/views/html.ts - Layout HTML ala BUDI Kemendikbud

import { APP, esc } from "../helpers";
import type { JwtPayload } from "../types";

export function layout(
	title: string,
	body: string,
	user: JwtPayload | null,
	flash?: { type: string; message: string } | null,
): string {
	const navRight = user
		? `
    <li><span class="badge ${user.roleName}">${esc(user.name)}</span></li>
    ${["admin", "super_admin", "pustakawan"].includes(user.roleName) ? '<li><a href="/admin">Dashboard</a></li>' : ""}
    <li><a href="/logout">Logout</a></li>`
		: '<li><a href="#" id="openLogin">Login</a></li>';

	const flashHtml = flash?.message
		? `<div class="container" style="margin-top:88px;margin-bottom:-24px"><div class="alert alert-${esc(flash.type)}">${esc(flash.message)}</div></div>`
		: "";

	return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/assets/css/style.css">
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

${!user ? `
<div id="loginModal" class="modal-overlay">
  <div class="modal-card">
    <button class="modal-close" id="closeModal">&times;</button>
    <h2>Login Perpustakaan Digital</h2>
    <form method="POST" action="/login">
      <div class="form-group">
        <label for="modal-email">Email</label>
        <input type="email" id="modal-email" name="email" class="form-control" required autocomplete="email" placeholder="email@uin-antasari.ac.id">
      </div>
      <div class="form-group">
        <label for="modal-password">Password</label>
        <input type="password" id="modal-password" name="password" class="form-control" required autocomplete="current-password">
      </div>
      <input type="hidden" name="redirect" value="/buku">
      <button type="submit" class="btn btn-primary btn-block">Login</button>
    </form>
    <p class="text-center mt-2 text-muted"><a href="/buku">Jelajahi Katalog Publik →</a></p>
  </div>
</div>` : ""}

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
          <a href="/login">Login</a>
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

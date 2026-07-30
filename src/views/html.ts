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
		? `${["admin", "super_admin", "pustakawan"].includes(user.roleName) ? '<li><a href="/admin">Dashboard</a></li>' : ""}
    <li class="user-dropdown-wrap">
      <a href="#" class="badge ${user.roleName} user-dropdown-trigger">${esc(user.name)} <span style="font-size:0.6rem;margin-left:2px">▾</span></a>
      <div class="user-dropdown">
        <a href="#" id="openProfil">Profil</a>
        <a href="#" id="openBookmarks">Bookmark</a>
        <a href="#" id="openRiwayat">Riwayat</a>
        ${user.roleName === "tamu" ? '<a href="#" id="openPassword">Ganti Password</a>' : ""}
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
<link rel="stylesheet" href="/assets/css/style.css?v=10">
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
      <li><button type="button" class="theme-toggle" id="themeToggle" title="Ganti tema">☀</button></li>
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
  <div class="am-card">
    <button class="am-close" id="closeAuthModal" aria-label="Tutup">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>

    <div class="am-header">
      <div class="am-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <h2 class="am-title">Selamat Datang</h2>
      <p class="am-sub">Masuk untuk mengakses koleksi lengkap</p>
    </div>

    <div class="am-tabs">
      <button type="button" class="am-tab active" data-tab="login">Masuk</button>
      <button type="button" class="am-tab" data-tab="register">Daftar</button>
      <span class="am-tab-indicator"></span>
    </div>

    <div class="am-body">
      <div class="am-panel active" id="panel-login">
        <form method="POST" action="/login">
          <input type="hidden" name="csrf_token" value="${esc(csrfToken())}">
          <div class="am-field">
            <label for="modal-email">Email</label>
            <div class="am-input-wrap">
              <span class="am-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
              <input type="email" id="modal-email" name="email" class="am-input" required autocomplete="email" placeholder="nama@universitas.ac.id">
            </div>
          </div>
          <div class="am-field">
            <label for="modal-password">Password</label>
            <div class="am-input-wrap">
              <span class="am-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
              <input type="password" id="modal-password" name="password" class="am-input" required autocomplete="current-password" placeholder="Masukkan password">
              <button type="button" class="am-pw-toggle" data-target="modal-password" aria-label="Tampilkan Password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-open"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-closed" style="display:none"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              </button>
            </div>
          </div>
          <input type="hidden" name="redirect" value="/buku">
          <button type="submit" class="am-submit">Masuk</button>
          <p class="am-forgot"><a href="#" id="openForgotPassword">Lupa Password?</a></p>
        </form>
        <p class="am-alt"><a href="/buku">Jelajahi Katalog Publik →</a></p>
      </div>

      <div class="am-panel" id="panel-forgot">
        <div class="am-forgot-body" id="forgotBody">
          <a href="#" class="am-forgot-back" id="backToLogin">← Kembali</a>
          <div class="am-forgot-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 class="am-forgot-title">Lupa Password?</h3>
          <p class="am-forgot-desc">Masukkan email terdaftar, kami kirim link reset password.</p>
          <form id="forgotForm">
            <div class="am-field">
              <label for="forgot-email">Email</label>
              <div class="am-input-wrap">
                <span class="am-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
                <input type="email" id="forgot-email" name="email" class="am-input" required placeholder="nama@universitas.ac.id">
              </div>
            </div>
            <button type="submit" class="am-submit" id="forgotSubmit">
              <span class="spinner"></span>
              <span class="btn-text">Kirim Link Reset</span>
            </button>
          </form>
        </div>
        <div class="am-forgot-success" id="forgotSuccess" style="display:none">
          <div class="am-forgot-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h3 class="am-forgot-title" style="color:var(--success)">Email Terkirim!</h3>
          <p class="am-forgot-desc">Cek inbox atau spam, kami udah kirim link reset password.</p>
          <a href="#" class="am-forgot-back" id="backToLoginAfter" style="display:inline-block;margin-top:16px">← Kembali ke Masuk</a>
        </div>
      </div>

      <div class="am-panel" id="panel-reset">
        <div class="am-panel-header">
          <h3>Buat Password Baru</h3>
        </div>
        <form id="resetForm">
          <input type="hidden" name="token" id="reset-token-input">
          <div class="am-field">
            <label for="reset-password">Password Baru</label>
            <div class="am-input-wrap">
              <span class="am-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
              <input type="password" id="reset-password" name="password" class="am-input" required minlength="6" placeholder="Minimal 6 karakter">
              <button type="button" class="am-pw-toggle" data-target="reset-password" aria-label="Tampilkan Password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-open"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-closed" style="display:none"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              </button>
            </div>
          </div>
          <div class="am-field">
            <label for="reset-password_confirm">Konfirmasi Password</label>
            <div class="am-input-wrap">
              <span class="am-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg></span>
              <input type="password" id="reset-password_confirm" name="password_confirm" class="am-input" required placeholder="Ulangi password">
              <button type="button" class="am-pw-toggle" data-target="reset-password_confirm" aria-label="Tampilkan Password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-open"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-closed" style="display:none"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              </button>
            </div>
          </div>
          <button type="submit" class="am-submit">Ganti Password</button>
        </form>
        <div id="resetError" style="display:none;text-align:center;padding:12px 0;color:var(--danger);font-size:0.85rem"></div>
      </div>

      <div class="am-panel" id="panel-register">
        <form method="POST" action="/register">
          <input type="hidden" name="csrf_token" value="${esc(csrfToken())}">
          <div class="am-row">
            <div class="am-field">
              <label for="modal-name">Nama</label>
              <div class="am-input-wrap">
                <span class="am-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                <input type="text" id="modal-name" name="name" class="am-input" required autocomplete="name" placeholder="Nama lengkap">
              </div>
            </div>
            <div class="am-field">
              <label for="modal-email-reg">Email</label>
              <div class="am-input-wrap">
                <span class="am-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
                <input type="email" id="modal-email-reg" name="email" class="am-input" required autocomplete="email" placeholder="nama@univ.ac.id">
              </div>
            </div>
          </div>
          <div class="am-row">
            <div class="am-field">
              <label for="modal-password-reg">Password</label>
              <div class="am-input-wrap">
                <span class="am-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input type="password" id="modal-password-reg" name="password" class="am-input" required autocomplete="new-password" minlength="6" placeholder="Minimal 6 karakter">
                <button type="button" class="am-pw-toggle" data-target="modal-password-reg" aria-label="Tampilkan Password">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-open"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-closed" style="display:none"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                </button>
              </div>
            </div>
            <div class="am-field">
              <label for="modal-password_confirm">Ulangi Password</label>
              <div class="am-input-wrap">
                <span class="am-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg></span>
                <input type="password" id="modal-password_confirm" name="password_confirm" class="am-input" required autocomplete="new-password" placeholder="Ulangi password">
                <button type="button" class="am-pw-toggle" data-target="modal-password_confirm" aria-label="Tampilkan Password">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-open"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-closed" style="display:none"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                </button>
              </div>
            </div>
          </div>
          <button type="submit" class="am-submit">Daftar</button>
        </form>
        <p class="am-alt"><a href="#" data-switch="login">Sudah punya akun? Masuk →</a></p>
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

<div id="bookmarkModal" class="modal-overlay">
  <div class="modal-card modal-sm">
    <button class="modal-close" id="closeBookmarkModal" aria-label="Tutup"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    <h2 style="font-family:var(--font-heading);margin-bottom:16px">🔖 Bookmark Saya</h2>
    <div id="bookmarkModalContent" style="min-height:120px;display:flex;align-items:center;justify-content:center;color:var(--text-muted)">Memuat...</div>
  </div>
</div>

<div id="riwayatModal" class="modal-overlay">
  <div class="modal-card modal-sm">
    <button class="modal-close" id="closeRiwayatModal" aria-label="Tutup"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    <h2 style="font-family:var(--font-heading);margin-bottom:16px">📖 Riwayat Baca</h2>
    <div id="riwayatModalContent" style="min-height:120px;display:flex;align-items:center;justify-content:center;color:var(--text-muted)">Memuat...</div>
  </div>
</div>

<div id="profilModal" class="modal-overlay">
  <div class="modal-card modal-sm">
    <button class="modal-close" id="closeProfilModal" aria-label="Tutup"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    <h2 style="font-family:var(--font-heading);margin-bottom:16px">👤 Profil Saya</h2>
    <div id="profilModalContent" style="min-height:120px;display:flex;align-items:center;justify-content:center;color:var(--text-muted)">Memuat...</div>
  </div>
</div>

<div id="passwordModal" class="modal-overlay">
  <div class="modal-card modal-sm">
    <button class="modal-close" id="closePasswordModal" aria-label="Tutup"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    <h2 style="font-family:var(--font-heading);margin-bottom:16px">🔒 Ganti Password</h2>
    <div id="passwordModalContent" style="min-height:120px;display:flex;align-items:center;justify-content:center;color:var(--text-muted)">Memuat...</div>
  </div>
</div>

<script src="/assets/js/app.js?v=11"></script>
</body>
</html>`;
}

/**
 * Light-mode layout for /sariadmin (admin login) — no navbar, no theme toggle, light background.
 */
export function sariadminLayout(
	title: string,
	body: string,
	flash?: { type: string; message: string } | null,
): string {
	const flashHtml = flash?.message
		? `<meta name="flash-type" content="${esc(flash.type)}"><meta name="flash-msg" content="${esc(flash.message)}">`
		: "";

	const description =
		"Admin Login - Perpustakaan Digital Universitas Sari Mulia Banjarmasin";
	const ogImage = "/assets/images/og-default.jpg";

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
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(APP.NAME)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<link rel="stylesheet" href="/assets/css/style.css?v=10">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<meta name="csrf-token" content="${esc(csrfToken())}">
<style>
/* Force light mode for sariadmin */
:root {
	--bg: #f5f7fa;
	--bg-card: #ffffff;
	--bg-elevated: #f0f4f8;
	--bg-warm: #e6edf4;
	--border: #c8d6e0;
	--border-light: #dce6ee;
	--text: #2c3e4f;
	--text-muted: #647585;
	--text-dim: #94a4b5;
	--text-heading: #1a2a38;
	--primary: #7ba7c9;
	--primary-dark: #5d8dae;
	--primary-light: #e8f0f7;
	--primary-glow: rgba(123, 167, 201, 0.12);
	--success: #5a8f7a;
	--danger: #c97a72;
	--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
	--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
	--shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.07);
	--shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.08);
}
/* Reset & Base */
*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body.sariadmin-body {
	height: 100%;
	overflow: hidden;
}
.sariadmin-body {
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	background: #f0f2f5;
	color: #1a1a2e;
}

/* Split Layout */
.sa-split {
	display: flex;
	height: 100vh;
	overflow: hidden;
}
.sa-left {
	flex: 1;
	background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 48px;
	position: relative;
	overflow: hidden;
}
.sa-left::before {
	content: '';
	position: absolute;
	top: -30%;
	left: -20%;
	width: 500px;
	height: 500px;
	background: radial-gradient(circle, rgba(99,162,255,0.15) 0%, transparent 70%);
	border-radius: 50%;
}
.sa-left::after {
	content: '';
	position: absolute;
	bottom: -20%;
	right: -10%;
	width: 400px;
	height: 400px;
	background: radial-gradient(circle, rgba(99,162,255,0.1) 0%, transparent 70%);
	border-radius: 50%;
}
.sa-brand {
	position: relative;
	z-index: 2;
}
.sa-brand-logo {
	display: inline-flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 32px;
}
.sa-brand-icon {
	width: 44px;
	height: 44px;
	background: rgba(255,255,255,0.12);
	border: 1px solid rgba(255,255,255,0.15);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	backdrop-filter: blur(10px);
}
.sa-brand-icon svg { color: #fff; }
.sa-brand-name {
	font-size: 1.5rem;
	font-weight: 800;
	color: #fff;
	letter-spacing: -0.5px;
}
.sa-hero-title {
	font-size: 1.9rem;
	font-weight: 800;
	color: #fff;
	line-height: 1.2;
	letter-spacing: -0.8px;
	margin-bottom: 12px;
}
.sa-hero-desc {
	font-size: 0.92rem;
	color: rgba(255,255,255,0.6);
	line-height: 1.5;
	max-width: 400px;
	margin-bottom: 32px;
}
.sa-features {
	display: flex;
	flex-direction: column;
	gap: 14px;
}
.sa-feature {
	display: flex;
	align-items: flex-start;
	gap: 14px;
}
.sa-feature-icon {
	width: 36px;
	height: 36px;
	min-width: 36px;
	background: rgba(99,162,255,0.12);
	border: 1px solid rgba(99,162,255,0.2);
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #63a2ff;
}
.sa-feature-text h4 {
	font-size: 0.88rem;
	font-weight: 700;
	color: #fff;
	margin-bottom: 2px;
}
.sa-feature-text p {
	font-size: 0.8rem;
	color: rgba(255,255,255,0.45);
}
.sa-footer {
	position: relative;
	z-index: 2;
	margin-top: auto;
	padding-top: 24px;
}
.sa-footer p {
	font-size: 0.75rem;
	color: rgba(255,255,255,0.3);
}

/* Right Panel */
.sa-right {
	width: 480px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px;
	background: #fff;
	overflow: hidden;
}
.sa-form-wrap {
	width: 100%;
	max-width: 360px;
	max-height: 100%;
	overflow: hidden;
}
.sa-form-header {
	margin-bottom: 28px;
}
.sa-form-header h2 {
	font-size: 1.4rem;
	font-weight: 700;
	color: #1a1a2e;
	margin-bottom: 6px;
	letter-spacing: -0.3px;
}
.sa-form-header p {
	font-size: 0.88rem;
	color: #6b7280;
}
.sa-field {
	margin-bottom: 16px;
}
.sa-field label {
	display: block;
	font-size: 0.82rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 6px;
}
.sa-input-wrap {
	position: relative;
	display: flex;
	align-items: center;
}
.sa-input-wrap .sa-icon {
	position: absolute;
	left: 14px;
	color: #9ca3af;
	display: flex;
	align-items: center;
	pointer-events: none;
	transition: color 0.2s;
}
.sa-input-wrap:focus-within .sa-icon {
	color: #4f8fd6;
}
.sa-input {
	width: 100%;
	padding: 12px 14px 12px 44px;
	font-size: 0.92rem;
	color: #1a1a2e;
	background: #f9fafb;
	border: 1.5px solid #e5e7eb;
	border-radius: 10px;
	outline: none;
	transition: all 0.2s;
	font-family: inherit;
}
.sa-input::placeholder {
	color: #9ca3af;
}
.sa-input:focus {
	border-color: #4f8fd6;
	background: #fff;
	box-shadow: 0 0 0 3px rgba(79,143,214,0.1);
}
.sa-pw-toggle {
	position: absolute;
	right: 12px;
	background: none;
	border: none;
	color: #9ca3af;
	cursor: pointer;
	padding: 4px;
	display: flex;
	align-items: center;
	transition: color 0.2s;
}
.sa-pw-toggle:hover { color: #6b7280; }

/* Submit */
.sa-submit {
	width: 100%;
	padding: 13px;
	margin-top: 8px;
	background: #1a1a2e;
	color: #fff;
	border: none;
	border-radius: 10px;
	font-size: 0.92rem;
	font-weight: 600;
	font-family: inherit;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	transition: all 0.2s;
}
.sa-submit:hover {
	background: #16213e;
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(26,26,46,0.25);
}
.sa-submit:active {
	transform: translateY(0);
}
.sa-submit svg {
	transition: transform 0.2s;
}
.sa-submit:hover svg {
	transform: translateX(3px);
}

/* Back link */
.sa-back {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	margin-top: 24px;
	font-size: 0.82rem;
	color: #9ca3af;
	text-decoration: none;
	transition: color 0.2s;
}
.sa-back:hover { color: #4f8fd6; }
.sa-back svg { transition: transform 0.2s; }
.sa-back:hover svg { transform: translateX(-3px); }

/* Responsive */
@media (max-width: 900px) {
	.sa-left { display: none; }
	.sa-right { width: 100%; height: 100vh; }
}
</style>
</head>
<body class="sariadmin-body">

${flashHtml}

<div class="sa-split">
  <div class="sa-left">
    <div class="sa-brand">
      <div class="sa-brand-logo">
        <div class="sa-brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <span class="sa-brand-name">SARI</span>
      </div>
      <h1 class="sa-hero-title">Perpustakaan<br>Digital Admin</h1>
      <p class="sa-hero-desc">Kelola koleksi buku, pengguna, dan sistem perpustakaan digital dari satu tempat.</p>
      <div class="sa-features">
        <div class="sa-feature">
          <div class="sa-feature-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div class="sa-feature-text"><h4>Manajemen Buku</h4><p>Tambah, edit, dan hapus koleksi</p></div>
        </div>
        <div class="sa-feature">
          <div class="sa-feature-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div class="sa-feature-text"><h4>Kelola Pengguna</h4><p>Akun mahasiswa dan pustakawan</p></div>
        </div>
        <div class="sa-feature">
          <div class="sa-feature-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div class="sa-feature-text"><h4>Statistik</h4><p>Pantau aktivitas peminjaman</p></div>
        </div>
      </div>
    </div>
    <div class="sa-footer">
      <p>&copy; ${new Date().getFullYear()} Universitas Sari Mulia</p>
    </div>
  </div>
  <div class="sa-right">
    <div class="sa-form-wrap">
      ${body}
    </div>
  </div>
</div>

<script src="/assets/js/app.js"></script>
</body>
</html>`;
}

export function csrfToken(): string {
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

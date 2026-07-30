// src/controllers/auth.ts - Login/Logout + Email Verification

import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "node:crypto";
import { createTransport } from "nodemailer";
import { APP } from "../config/app";
import { query, queryOne } from "../config/database";
import type { JwtPayload } from "../types";
import { layout, sariadminLayout, csrfToken } from "../views/html";
import { getUser, getFlash, setFlashRedirect, esc, hasRole } from "../helpers";

const transporter = APP.SMTP_USER && APP.SMTP_PASS
	? createTransport({
			host: APP.SMTP_HOST,
			port: APP.SMTP_PORT,
			secure: APP.SMTP_PORT === 465,
			auth: { user: APP.SMTP_USER, pass: APP.SMTP_PASS },
	  })
	: null;

// ---- Rate limiting (in-memory, ponytail: simple & works for single-instance) ----
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
	const now = Date.now();
	const record = loginAttempts.get(ip);
	if (!record || now > record.resetAt) {
		loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 }); // 1 min window
		return { allowed: true };
	}
	if (record.count >= 5) {
		return {
			allowed: false,
			retryAfter: Math.ceil((record.resetAt - now) / 1000),
		};
	}
	record.count++;
	return { allowed: true };
}

// ---- Zod validation ----
const LoginSchema = z.object({
	email: z.string().email("Format email tidak valid").max(255),
	password: z.string().min(1, "Password wajib diisi").max(100),
	redirect: z.string().optional(),
});

const RegisterSchema = z
	.object({
		name: z.string().min(2, "Nama minimal 2 karakter").max(100),
		email: z.string().email("Format email tidak valid").max(255),
		password: z.string().min(6, "Password minimal 6 karakter").max(100),
		password_confirm: z.string().min(1, "Konfirmasi password wajib diisi"),
	})
	.refine((data) => data.password === data.password_confirm, {
		message: "Password dan konfirmasi tidak cocok",
		path: ["password_confirm"],
	});

// ---- Controllers ----
export async function loginForm(c: Context) {
	const user = getUser(c);
	if (user) return c.redirect("/");
	const flash = getFlash(c);

	const html = layout(
		"Masuk",
		`
<div class="auth-page">
  <div class="auth-card">
    <h1>Masuk Perpustakaan Digital</h1>
    <form method="POST" action="/login">
      <input type="hidden" name="csrf_token" value="${esc(csrfToken())}">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" class="form-control" required autocomplete="email"
               placeholder="email@unisma.ac.id">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" class="form-control" required autocomplete="current-password">
      </div>
      <button type="submit" class="btn btn-primary btn-block">Masuk</button>
    </form>
    <p class="text-center mt-2 text-muted"><a href="/buku">Jelajahi Katalog Publik →</a></p>
    <p class="text-center mt-2 text-muted">Belum punya akun? <a href="/register">Daftar</a></p>
  </div>
</div>`,
		null,
		flash,
	);

	return c.html(html);
}

export async function registerForm(c: Context) {
	const user = getUser(c);
	if (user) return c.redirect("/");
	const flash = getFlash(c);

	const html = layout(
		"Daftar",
		`
<div class="auth-page">
  <div class="auth-card">
    <h1>Daftar Akun</h1>
    <form method="POST" action="/register">
      <input type="hidden" name="csrf_token" value="${esc(csrfToken())}">
      <div class="form-row-2">
        <div class="form-group">
          <label for="name">Nama Lengkap</label>
          <input type="text" id="name" name="name" class="form-control" required autocomplete="name" placeholder="Nama lengkap">
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" class="form-control" required autocomplete="email" placeholder="email@unisma.ac.id">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" class="form-control" required autocomplete="new-password" minlength="6" placeholder="Minimal 6 karakter">
        </div>
        <div class="form-group">
          <label for="password_confirm">Konfirmasi Password</label>
          <input type="password" id="password_confirm" name="password_confirm" class="form-control" required autocomplete="new-password" placeholder="Ulangi password">
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Daftar</button>
    </form>
    <p class="text-center mt-2 text-muted">Sudah punya akun? <a href="/login">Masuk</a></p>
  </div>
</div>`,
		null,
		flash,
	);

	return c.html(html);
}

export async function login(c: Context) {
	const ip =
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
	const rl = checkRateLimit(ip);
	if (!rl.allowed) {
		return setFlashRedirect(
			c,
			"/?auth=login",
			`Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.`,
			"danger",
		);
	}

	const body = await c.req.parseBody();
	const parsed = LoginSchema.safeParse(body);
	if (!parsed.success) {
		const msg = parsed.error.issues.map((err) => err.message).join(", ");
		return setFlashRedirect(c, "/?auth=login", msg, "danger");
	}

	const { email, password } = parsed.data;
	const redirectTo = parsed.data.redirect || c.req.header("referer") || "/buku";

	const user = await queryOne<any>(
		`SELECT u.*, r.name AS role_name
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = ? AND u.status = ? AND u.verified_at IS NOT NULL`,
		[email, "active"],
	);

	if (!user) {
		const unverified = await queryOne(
			"SELECT id FROM users WHERE email = ? AND verified_at IS NULL",
			[email],
		);
		if (unverified) {
			return setFlashRedirect(
				c,
				"/?auth=login",
				"Email belum diverifikasi. Cek email kamu untuk link verifikasi.",
				"warning",
			);
		}
		return setFlashRedirect(
			c,
			redirectTo,
			"Email atau password salah.",
			"danger",
		);
	}

	if (!(await bcrypt.compare(password, user.password))) {
		return setFlashRedirect(
			c,
			redirectTo,
			"Email atau password salah.",
			"danger",
		);
	}

	// Only allow public roles at /login — reject admin silently
	if (adminRoles.includes(user.role_name)) {
		return setFlashRedirect(
			c,
			redirectTo,
			"Email atau password salah.",
			"danger",
		);
	}

	// Reset rate limit on successful login
	loginAttempts.delete(ip);

	const payload: JwtPayload = {
		userId: user.id,
		roleName: user.role_name,
		name: user.name,
	};
	const token = jwt.sign(payload, APP.JWT_SECRET, { expiresIn: 86400 });

	setCookie(c, "token", token, {
		httpOnly: true,
		secure: !APP.DEBUG,
		sameSite: "Lax",
		path: "/",
		maxAge: 86400,
	});

	setCookie(
		c,
		"flash",
		JSON.stringify({
			type: "success",
			message: `Selamat datang, ${esc(user.name)}!`,
		}),
		{
			httpOnly: true,
			path: "/",
			maxAge: 5,
		},
	);

	// Log activity
	await query(
		"INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)",
		[user.id, "login", `Login: ${user.name}`, ip],
	);

	return c.redirect(redirectTo);
}

export async function logout(c: Context) {
	const user = getUser(c);
	deleteCookie(c, "token", { path: "/" });
	setCookie(
		c,
		"flash",
		JSON.stringify({ type: "success", message: "Berhasil logout." }),
		{
			httpOnly: true,
			path: "/",
			maxAge: 5,
		},
	);

	// Log activity
	if (user) {
		const ip =
			c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "local";
		await query(
			"INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)",
			[user.userId, "logout", `Logout: ${user.name}`, ip],
		);
	}

	return c.redirect("/buku");
}

// ---- Admin Login (hidden route) ----
const adminRoles = ["admin", "super_admin", "pustakawan"];

export async function adminLoginForm(c: Context) {
	const user = getUser(c);
	if (user) return c.redirect("/admin/books");
	const flash = getFlash(c);

	const html = sariadminLayout(
		"Admin Login",
		`
<div class="sa-form-header">
  <h2>Masuk ke Admin</h2>
  <p>Silakan masukkan kredensial Anda</p>
</div>

<form method="POST" action="/sariadmin">
  <div class="sa-field">
    <label for="email">Email</label>
    <div class="sa-input-wrap">
      <span class="sa-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      </span>
      <input type="email" id="email" name="email" class="sa-input" required autocomplete="email" placeholder="nama@universitas.ac.id">
    </div>
  </div>

  <div class="sa-field">
    <label for="password">Password</label>
    <div class="sa-input-wrap">
      <span class="sa-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </span>
      <input type="password" id="password" name="password" class="sa-input" required autocomplete="current-password" placeholder="Masukkan password">
      <button type="button" id="togglePassword" class="sa-pw-toggle" aria-label="Tampilkan Password">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-open"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-closed" style="display:none"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
      </button>
    </div>
  </div>

  <button type="submit" class="sa-submit">
    <span>Masuk</span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  </button>
</form>

<a href="/buku" class="sa-back">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
  <span>Kembali ke Katalog</span>
</a>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('togglePassword');
  const inp = document.getElementById('password');
  if (btn && inp) {
    btn.addEventListener('click', () => {
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.querySelector('.eye-open').style.display = show ? 'none' : '';
      btn.querySelector('.eye-closed').style.display = show ? '' : 'none';
    });
  }
});
</script>
`,
		flash,
	);

	return c.html(html);
}

export async function adminLogin(c: Context) {
	const ip =
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
	const rl = checkRateLimit(ip);
	if (!rl.allowed) {
		return setFlashRedirect(
			c,
			"/sariadmin",
			`Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.`,
			"danger",
		);
	}

	const body = await c.req.parseBody();
	const parsed = LoginSchema.safeParse(body);
	if (!parsed.success) {
		const msg = parsed.error.issues.map((err) => err.message).join(", ");
		return setFlashRedirect(c, "/sariadmin", msg, "danger");
	}

	const { email, password } = parsed.data;

	const user = await queryOne<any>(
		`SELECT u.*, r.name AS role_name
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = ? AND u.status = ? AND u.verified_at IS NOT NULL`,
		[email, "active"],
	);

	if (!user) {
		const unverified = await queryOne(
			"SELECT id FROM users WHERE email = ? AND verified_at IS NULL",
			[email],
		);
		if (unverified) {
			return setFlashRedirect(
				c,
				"/sariadmin",
				"Email belum diverifikasi. Cek email kamu untuk link verifikasi.",
				"warning",
			);
		}
		return setFlashRedirect(
			c,
			"/sariadmin",
			"Email atau password salah.",
			"danger",
		);
	}

	if (!(await bcrypt.compare(password, user.password))) {
		return setFlashRedirect(
			c,
			"/sariadmin",
			"Email atau password salah.",
			"danger",
		);
	}

	if (!adminRoles.includes(user.role_name)) {
		return setFlashRedirect(
			c,
			"/sariadmin",
			"Akun ini bukan akun admin.",
			"danger",
		);
	}

	loginAttempts.delete(ip);

	const payload: JwtPayload = {
		userId: user.id,
		roleName: user.role_name,
		name: user.name,
	};
	const token = jwt.sign(payload, APP.JWT_SECRET, { expiresIn: 86400 });

	setCookie(c, "token", token, {
		httpOnly: true,
		secure: !APP.DEBUG,
		sameSite: "Lax",
		path: "/",
		maxAge: 86400,
	});
	setCookie(
		c,
		"flash",
		JSON.stringify({
			type: "success",
			message: `Selamat datang, ${esc(user.name)}!`,
		}),
		{ httpOnly: true, path: "/", maxAge: 5 },
	);

	await query(
		"INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)",
		[user.id, "login", `Login: ${user.name}`, ip],
	);

	return c.redirect("/admin/books");
}

// ---- Register (Guest -> requires email verification) ----
export async function register(c: Context) {
	const ip =
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
	const rl = checkRateLimit(ip);
	if (!rl.allowed) {
		return setFlashRedirect(
			c,
			"/register",
			`Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.`,
			"danger",
		);
	}

	const body = await c.req.parseBody();
	const parsed = RegisterSchema.safeParse(body);
	if (!parsed.success) {
		const msg = parsed.error.issues.map((err) => err.message).join(", ");
		return setFlashRedirect(c, "/register", msg, "danger");
	}

	const { name, email, password } = parsed.data;

	// Check if email already exists
	const existing = await queryOne(
		"SELECT id, verified_at FROM users WHERE email = ?",
		[email],
	);
	if (existing && existing.verified_at) {
		return setFlashRedirect(c, "/register", "Email sudah terdaftar.", "danger");
	}
	if (existing && !existing.verified_at) {
		// Resend verification for unverified account
		const token = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
		await query(
			"INSERT INTO verification_tokens (email, token, expires_at) VALUES (?, ?, ?)",
			[email, token, expiresAt],
		);
		await sendVerificationEmail(email, token);
		return setFlashRedirect(
			c,
			"/register",
			"Email sudah terdaftar tapi belum diverifikasi. Kami kirim ulang email verifikasi.",
			"success",
		);
	}

	// Get 'tamu' role ID
	const role = await queryOne<{ id: number }>(
		"SELECT id FROM roles WHERE name = ?",
		["tamu"],
	);
	if (!role) {
		return setFlashRedirect(
			c,
			"/register",
			"Konfigurasi role tidak lengkap.",
			"danger",
		);
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const username = email.split("@")[0];
	await query(
		"INSERT INTO users (username, name, email, password, role_id, status) VALUES (?, ?, ?, ?, ?, ?)",
		[username, name, email, passwordHash, role.id, "active"],
	);

	// Generate verification token
	const token = crypto.randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
	await query(
		"INSERT INTO verification_tokens (email, token, expires_at) VALUES (?, ?, ?)",
		[email, token, expiresAt],
	);

	// Send verification email
	await sendVerificationEmail(email, token);

	loginAttempts.delete(ip);

	// Redirect ke halaman utama, muncul sweetalert
	const referer = c.req.header("referer") || "/buku";
	const redirectTo = referer.includes("/register") ? "/buku" : referer;
	return setFlashRedirect(
		c,
		redirectTo,
		"Silahkan cek email anda",
		"success",
	);
}

// ---- Send Verification Email ----
async function sendVerificationEmail(email: string, token: string) {
	const link = `${APP.SITE_URL}/verify-email?token=${token}`;

	if (!transporter) {
		console.log("========================================");
		console.log("🔗 Link verifikasi (dev mode):");
		console.log(link);
		console.log(`📧 Untuk: ${email}`);
		console.log("========================================");
		return;
	}

	// ponytail: SMTP failure = fallback to console log
	try {
		await transporter.sendMail({
			from: APP.EMAIL_FROM,
			to: email,
			subject: "Verifikasi Email - SARI Perpustakaan Digital",
			text: `Verifikasi email kamu untuk akun SARI Perpustakaan Digital

Klik link ini:
${link}

Link berlaku 3 jam.
Abaikan jika kamu tidak mendaftar.`,
			html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f3f4f6;padding:40px 20px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
<div style="background:#2563eb;padding:24px;text-align:center">
<h1 style="color:#fff;margin:0;font-size:1.2rem">SARI Perpustakaan Digital</h1>
</div>
<div style="padding:32px 24px">
<h2 style="margin:0 0 12px;font-size:1.1rem">Verifikasi Email</h2>
<p style="color:#4b5563;line-height:1.6;margin:0 0 24px">Klik tombol di bawah untuk verifikasi akun kamu:</p>
<a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Verifikasi Email</a>
<p style="color:#9ca3af;font-size:0.85rem;margin-top:24px">Link berlaku 3 jam. Abaikan jika kamu tidak mendaftar.</p>
</div>
</div>
</body>
</html>`,
			});
		console.log(`✅ Email verifikasi terkirim ke ${email}`);
	} catch (err) {
		console.log("========================================");
		console.log("⚠️  Gagal kirim email — fallback ke dev mode");
		console.log("🔗 Link verifikasi:", link);
		console.log("📧 Untuk:", email);
		console.log("Error:", err instanceof Error ? err.message : err);
		console.log("========================================");
	}
}

// ---- Verify Email ----
export async function verifyEmail(c: Context) {
	const token = c.req.query("token");
	if (!token) {
		return c.html(
			layout(
				"Verifikasi Gagal",
				"<p style='text-align:center;padding:40px;color:#dc2626'>Token tidak valid.</p>",
				null,
			),
		);
	}

	const row = await queryOne<{ email: string; expires_at: string }>(
		"SELECT email, expires_at FROM verification_tokens WHERE token = ?",
		[token],
	);

	if (!row) {
		return c.html(
			layout(
				"Verifikasi Gagal",
				"<p style='text-align:center;padding:40px;color:#dc2626'>Token tidak valid atau sudah digunakan.</p>",
				null,
			),
		);
	}

	if (new Date(row.expires_at) < new Date()) {
		return c.html(
			layout(
				"Verifikasi Gagal",
				"<p style='text-align:center;padding:40px;color:#dc2626'>Token sudah kedaluwarsa. Daftar ulang untuk mendapat token baru.</p>",
				null,
			),
		);
	}

	// Update user as verified
	await query("UPDATE users SET verified_at = NOW() WHERE email = ?", [
		row.email,
	]);

	// Clean up used token
	await query("DELETE FROM verification_tokens WHERE email = ?", [row.email]);

	// Auto-login: cari user & buat token
	const user = await queryOne<any>(
		`SELECT u.*, r.name AS role_name
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
		[row.email],
	);

	if (user) {
		const payload: JwtPayload = {
			userId: user.id,
			roleName: user.role_name,
			name: user.name,
		};
		const jwtToken = jwt.sign(payload, APP.JWT_SECRET, {
			expiresIn: 86400,
		});
		setCookie(c, "token", jwtToken, {
			httpOnly: true,
			secure: !APP.DEBUG,
			sameSite: "Lax",
			path: "/",
			maxAge: 86400,
		});
		setCookie(
			c,
			"flash",
			JSON.stringify({
				type: "success",
				message: "Email berhasil diverifikasi! Selamat datang.",
			}),
			{ httpOnly: true, path: "/", maxAge: 5 },
		);
	}

	return c.redirect("/buku");
}

// ---- Sitemap ----
export async function sitemap(c: Context) {
	const baseUrl = c.req.header("origin") || `http://localhost:${APP.PORT}`;
	const books = await query<{ slug: string; updated_at: string }[]>(
		"SELECT slug, updated_at FROM books WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1000",
	);
	const faculties = await query<{ slug: string }[]>(
		"SELECT slug FROM faculties ORDER BY name",
	);
	const programs = await query<{ slug: string }[]>(
		"SELECT slug FROM programs ORDER BY name",
	);

	const urls: Array<{
		loc: string;
		changefreq: string;
		priority: number;
		lastmod?: string;
	}> = [
		{ loc: baseUrl, changefreq: "daily", priority: 1.0 },
		{ loc: `${baseUrl}/buku`, changefreq: "daily", priority: 0.9 },
		{ loc: `${baseUrl}/login`, changefreq: "monthly", priority: 0.3 },
		{ loc: `${baseUrl}/register`, changefreq: "monthly", priority: 0.3 },
	];

	for (const f of faculties) {
		urls.push({
			loc: `${baseUrl}/buku?faculty=${f.slug}`,
			changefreq: "weekly",
			priority: 0.7,
		});
	}
	for (const p of programs) {
		urls.push({
			loc: `${baseUrl}/buku?program=${p.slug}`,
			changefreq: "weekly",
			priority: 0.6,
		});
	}
	for (const b of books) {
		urls.push({
			loc: `${baseUrl}/buku/${b.slug}`,
			lastmod: b.updated_at.split("T")[0],
			changefreq: "monthly",
			priority: 0.8,
		});
	}

	let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
	for (const u of urls) {
		xml += `<url>
<loc>${esc(u.loc)}</loc>
`;
		if (u.lastmod)
			xml += `<lastmod>${u.lastmod}</lastmod>
`;
		xml += `<changefreq>${u.changefreq}</changefreq>
<priority>${u.priority}</priority>
</url>
`;
	}
	xml += `</urlset>`;

	return c.body(xml, 200, { "Content-Type": "application/xml; charset=utf-8" });
}

// Re-export for other modules
export { getUser, hasRole };

// src/controllers/auth.ts - Login/Logout

import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { APP } from "../config/app";
import { query, queryOne } from "../config/database";
import type { JwtPayload } from "../types";
import { layout } from "../views/html";
import { getUser, getFlash, setFlashRedirect, esc } from "../helpers";

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
     WHERE u.email = ? AND u.status = ?`,
		[email, "active"],
	);

	if (!user || !(await bcrypt.compare(password, user.password))) {
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

	setCookie(c, "flash", JSON.stringify({ type: "success", message: `Selamat datang, ${esc(user.name)}!` }), {
		httpOnly: true,
		path: "/",
		maxAge: 5,
	});

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
	setCookie(c, "flash", JSON.stringify({ type: "success", message: "Berhasil logout." }), {
		httpOnly: true,
		path: "/",
		maxAge: 5,
	});

	// Log activity
	if (user) {
		const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "local";
		await query(
			"INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)",
			[user.userId, "logout", `Logout: ${user.name}`, ip],
		);
	}

	return c.redirect("/buku");
}

// ---- Register (Guest -> Mahasiswa) ----
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
	const existing = await queryOne("SELECT id FROM users WHERE email = ?", [
		email,
	]);
	if (existing) {
		return setFlashRedirect(c, "/register", "Email sudah terdaftar.", "danger");
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

	// Get user ID for auto-login
	const newUser = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = ?", [email]);

	loginAttempts.delete(ip);

	// Auto-login: create token and redirect
	const payload: JwtPayload = {
		userId: newUser!.id,
		roleName: "tamu",
		name: name,
	};
	const token = jwt.sign(payload, APP.JWT_SECRET, { expiresIn: 86400 });

	setCookie(c, "token", token, {
		httpOnly: true,
		secure: !APP.DEBUG,
		sameSite: "Lax",
		path: "/",
		maxAge: 86400,
	});

	// Log activity
	await query(
		"INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)",
		[newUser!.id, "register", `Register: ${name}`, ip],
	);

	setCookie(c, "flash", JSON.stringify({ type: "success", message: `Selamat datang, ${esc(name)}! Akun berhasil dibuat.` }), {
		httpOnly: true,
		path: "/",
		maxAge: 5,
	});

	return c.redirect("/");
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

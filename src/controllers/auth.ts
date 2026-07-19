// src/controllers/auth.ts - Login/Logout

import type { Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { APP } from "../config/app";
import { queryOne } from "../config/database";
import type { JwtPayload } from "../types";
import { layout } from "../views/html";
import { getUser, hasRole, getFlash, setFlashRedirect } from "../helpers";

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
	redirect: z.string().url().optional(),
});

// ---- Controllers ----
export async function loginForm(c: Context) {
	const user = getUser(c);
	if (user) return c.redirect("/");
	const flash = getFlash(c);

	const html = layout(
		"Login",
		`
<div class="auth-page">
  <div class="auth-card">
    <h1>Login Perpustakaan Digital</h1>
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
      <button type="submit" class="btn btn-primary btn-block">Login</button>
    </form>
    <p class="text-center mt-2 text-muted"><a href="/buku">Jelajahi Katalog Publik →</a></p>
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
			"/login",
			`Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.`,
			"danger",
		);
	}

	const body = await c.req.parseBody();
	const parsed = LoginSchema.safeParse(body);
	if (!parsed.success) {
		const msg = parsed.error.issues.map((err) => err.message).join(", ");
		return setFlashRedirect(c, "/login", msg, "danger");
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

	return c.redirect(redirectTo);
}

export async function logout(c: Context) {
	deleteCookie(c, "token", { path: "/" });
	return c.redirect("/login");
}

// Re-export for other modules
export { getUser, hasRole };

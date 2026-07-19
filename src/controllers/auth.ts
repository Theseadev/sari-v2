// src/controllers/auth.ts - Login/Logout

import type { Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { APP } from "../config/app";
import { queryOne } from "../config/database";
import type { JwtPayload } from "../types";
import { layout } from "../views/html";

/** Ambil user dari cookie JWT */
export function getUser(c: Context): JwtPayload | null {
	const token = getCookie(c, "token");
	if (!token) return null;
	try {
		return jwt.verify(token, APP.JWT_SECRET) as JwtPayload;
	} catch {
		return null;
	}
}

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
               placeholder="email@uin-antasari.ac.id">
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
	const body = await c.req.parseBody();
	const email = String(body.email || "");
	const password = String(body.password || "");
	const redirectTo = String(body.redirect || c.req.header("referer") || "/buku");

	if (!email || !password) {
		return setFlashRedirect(c, redirectTo, "Email dan password wajib diisi.", "danger");
	}

	const user = await queryOne<any>(
		`SELECT u.*, r.name AS role_name
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = ? AND u.status = ?`,
		[email, "active"],
	);

	if (!user || !(await bcrypt.compare(password, user.password))) {
		return setFlashRedirect(c, redirectTo, "Email atau password salah.", "danger");
	}

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

// -- Helpers --

function getFlash(c: Context): { type: string; message: string } | null {
	const raw = getCookie(c, "flash");
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function setFlashRedirect(
	c: Context,
	url: string,
	msg: string,
	type: string,
): Response {
	setCookie(c, "flash", JSON.stringify({ type, message: msg }), {
		httpOnly: true,
		path: "/",
		maxAge: 5,
	});
	return c.redirect(url);
}

// src/controllers/password.ts — Forgot & Reset Password

import type { Context } from "hono";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { query, queryOne } from "../config/database";
import { layout } from "../views/html";
import { getUser, getFlash, setFlashRedirect, esc } from "../helpers";

export async function forgotForm(c: Context) {
	const user = getUser(c);
	const flash = getFlash(c);
	const html = layout(
		"Lupa Password",
		`<div class="auth-page">
  <div class="auth-card">
    <h1>Lupa Password</h1>
    <p class="text-muted mb-3">Masukkan email Anda. Token reset akan ditampilkan (demo, tanpa email).</p>
    <form method="POST" action="/lupa-password">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" class="form-control" required placeholder="email@unisma.ac.id">
      </div>
      <button type="submit" class="btn btn-primary btn-block">Kirim Token</button>
    </form>
    <p class="text-center mt-2 text-muted"><a href="/login">← Kembali ke Masuk</a></p>
  </div>
</div>`,
		user,
		flash,
	);
	return c.html(html);
}

export async function forgot(c: Context) {
	const body = await c.req.parseBody();
	const email = String(body.email || "").trim();
	if (!email) return setFlashRedirect(c, "/lupa-password", "Email wajib diisi.", "danger");

	const user = await queryOne<{ id: number }>(
		"SELECT id FROM users WHERE email = ? AND status = 'active'",
		[email],
	);
	// Ponytail: always show same message to prevent email enumeration
	if (!user) {
		return setFlashRedirect(c, "/lupa-password", "Jika email terdaftar, token reset sudah dikirim.", "success");
	}

	// Invalidate old tokens
	await query("UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0", [user.id]);

	const token = crypto.randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + 3600_000).toISOString().slice(0, 19).replace("T", " ");
	await query(
		"INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
		[user.id, token, expiresAt],
	);

	// Ponytail: demo mode — show token in toast. Production: send email.
	return setFlashRedirect(c, `/reset-password?token=${token}`, `Token: ${token.slice(0, 12)}...`, "success");
}

export async function resetForm(c: Context) {
	const token = c.req.query("token") || "";
	const flash = getFlash(c);
	const user = getUser(c);

	if (!token) {
		return setFlashRedirect(c, "/lupa-password", "Token tidak valid.", "danger");
	}

	const row = await queryOne<{ id: number; user_id: number; expires_at: string; used: number }>(
		"SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?",
		[token],
	);

	if (!row || row.used || new Date(row.expires_at) < new Date()) {
		return setFlashRedirect(c, "/lupa-password", "Token sudah kadaluarsa atau tidak valid.", "danger");
	}

	const html = layout(
		"Reset Password",
		`<div class="auth-page">
  <div class="auth-card">
    <h1>Reset Password</h1>
    <form method="POST" action="/reset-password">
      <input type="hidden" name="token" value="${esc(token)}">
      <div class="form-group">
        <label for="password">Password Baru</label>
        <input type="password" id="password" name="password" class="form-control" required minlength="6" placeholder="Minimal 6 karakter">
      </div>
      <div class="form-group">
        <label for="password_confirm">Konfirmasi Password</label>
        <input type="password" id="password_confirm" name="password_confirm" class="form-control" required placeholder="Ulangi password">
      </div>
      <button type="submit" class="btn btn-primary btn-block">Reset Password</button>
    </form>
  </div>
</div>`,
		user,
		flash,
	);
	return c.html(html);
}

export async function reset(c: Context) {
	const body = await c.req.parseBody();
	const token = String(body.token || "");
	const password = String(body.password || "");
	const confirm = String(body.password_confirm || "");

	if (!token) return setFlashRedirect(c, "/lupa-password", "Token tidak valid.", "danger");
	if (password.length < 6) return setFlashRedirect(c, `/reset-password?token=${token}`, "Password minimal 6 karakter.", "danger");
	if (password !== confirm) return setFlashRedirect(c, `/reset-password?token=${token}`, "Password dan konfirmasi tidak cocok.", "danger");

	const row = await queryOne<{ id: number; user_id: number; expires_at: string; used: number }>(
		"SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?",
		[token],
	);

	if (!row || row.used || new Date(row.expires_at) < new Date()) {
		return setFlashRedirect(c, "/lupa-password", "Token sudah kadaluarsa atau tidak valid.", "danger");
	}

	const hash = await bcrypt.hash(password, 10);
	await query("UPDATE users SET password = ? WHERE id = ?", [hash, row.user_id]);
	await query("UPDATE password_resets SET used = 1 WHERE id = ?", [row.id]);

	return setFlashRedirect(c, "/login", "Password berhasil direset! Silakan masuk.", "success");
}

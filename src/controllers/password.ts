// src/controllers/password.ts — Forgot & Reset Password

import type { Context } from "hono";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createTransport } from "nodemailer";
import { query, queryOne } from "../config/database";
import { layout } from "../views/html";
import { getUser, getFlash, setFlashRedirect, esc } from "../helpers";
import { APP } from "../config/app";

const transporter =
	APP.SMTP_USER && APP.SMTP_PASS
		? createTransport({
				host: APP.SMTP_HOST,
				port: APP.SMTP_PORT,
				secure: APP.SMTP_PORT === 465,
				auth: { user: APP.SMTP_USER, pass: APP.SMTP_PASS },
			})
		: null;

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
	if (!email)
		return setFlashRedirect(
			c,
			"/lupa-password",
			"Email wajib diisi.",
			"danger",
		);

	const user = await queryOne<{ id: number }>(
		"SELECT id FROM users WHERE email = ? AND status = 'active'",
		[email],
	);
	// Ponytail: always show same message to prevent email enumeration
	if (!user) {
		return setFlashRedirect(
			c,
			"/lupa-password",
			"Jika email terdaftar, token reset sudah dikirim.",
			"success",
		);
	}

	// Invalidate old tokens
	await query(
		"UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0",
		[user.id],
	);

	const token = crypto.randomBytes(32).toString("hex");
	// ponytail: pake DATE_ADD biar timezone MySQL (WITA) sama dengan server
	await query(
		"INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
		[user.id, token],
	);

	// Kirim email (atau log di dev mode)
	const link = `${APP.SITE_URL}/buku?reset=${token}`;
	if (transporter) {
		try {
			await transporter.sendMail({
				from: APP.EMAIL_FROM,
				to: email,
				subject: "Reset Password - SARI Perpustakaan Digital",
				text: `Reset password untuk akun SARI Perpustakaan Digital\n\nKlik link ini:\n${link}\n\nLink berlaku 1 jam.\nAbaikan jika kamu tidak meminta reset password.`,
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
<h2 style="margin:0 0 12px;font-size:1.1rem">Reset Password</h2>
<p style="color:#4b5563;line-height:1.6;margin:0 0 24px">Klik tombol di bawah untuk reset password akun kamu:</p>
<a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Ganti Password Baru</a>
<p style="color:#9ca3af;font-size:0.85rem;margin-top:24px">Link berlaku 1 jam. Abaikan jika kamu tidak meminta reset password.</p>
</div>
</div>
</body>
</html>`,
			});
		} catch (err) {
			console.log(
				"⚠️  Gagal kirim email:",
				err instanceof Error ? err.message : err,
			);
			console.log("🔗 Link:", link);
		}
	} else {
		console.log("========================================");
		console.log("🔗 Link reset (dev mode):", link);
		console.log("📧 Untuk:", email);
		console.log("========================================");
	}

	return setFlashRedirect(
		c,
		"/lupa-password",
		"Jika email terdaftar, link reset sudah dikirim.",
		"success",
	);
}

// ---- API: Forgot Password (modal, JSON) ----
export async function apiForgot(c: Context) {
	const body = await c.req.parseBody();
	const email = String(body.email || "").trim();
	if (!email) {
		return c.json({ error: "Email wajib diisi." }, 400);
	}

	const user = await queryOne<{ id: number; name: string }>(
		"SELECT id, name FROM users WHERE email = ? AND status = 'active'",
		[email],
	);
	if (!user) {
		return c.json({ error: "Email tidak ditemukan." }, 404);
	}

	await query(
		"UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0",
		[user.id],
	);

	const token = crypto.randomBytes(32).toString("hex");
	await query(
		"INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
		[user.id, token],
	);

	const link = `${APP.SITE_URL}/buku?reset=${token}`;

	if (transporter) {
		try {
			await transporter.sendMail({
				from: APP.EMAIL_FROM,
				to: email,
				subject: "Reset Password - SARI Perpustakaan Digital",
				text: `Halo ${user.name},\n\nKlik link ini untuk reset password:\n${link}\n\nLink berlaku 1 jam.`,
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
<p style="color:#4b5563;line-height:1.6;margin:0 0 12px">Halo <strong>${esc(user.name)}</strong>,</p>
<p style="color:#4b5563;line-height:1.6;margin:0 0 24px">Klik tombol di bawah untuk reset password akun kamu:</p>
<a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Ganti Password Baru</a>
<p style="color:#9ca3af;font-size:0.85rem;margin-top:24px">Link berlaku 1 jam. Abaikan jika kamu tidak meminta reset password.</p>
</div>
</div>
</body>
</html>`,
			});
		} catch {
			return c.json({ error: "Gagal mengirim email. Coba lagi." }, 500);
		}
	} else {
		console.log("========================================");
		console.log("🔗 Link reset (dev mode):", link);
		console.log("📧 Untuk:", email);
		console.log("========================================");
	}

	return c.json({ ok: true });
}

// ---- API: Reset Password (modal, JSON) ----
export async function apiReset(c: Context) {
	const body = await c.req.parseBody();
	const token = String(body.token || "");
	const password = String(body.password || "");
	const confirm = String(body.password_confirm || "");

	if (!token) return c.json({ error: "Token tidak valid." }, 400);
	if (password.length < 6)
		return c.json({ error: "Password minimal 6 karakter." }, 400);
	if (password !== confirm)
		return c.json({ error: "Password dan konfirmasi tidak cocok." }, 400);

	const row = await queryOne<{
		id: number;
		user_id: number;
		expires_at: string;
		used: number;
	}>(
		"SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?",
		[token],
	);

	if (!row || row.used || new Date(row.expires_at) < new Date()) {
		return c.json({ error: "Token sudah kadaluarsa atau tidak valid." }, 400);
	}

	const hash = await bcrypt.hash(password, 10);
	await query("UPDATE users SET password = ? WHERE id = ?", [
		hash,
		row.user_id,
	]);
	await query("UPDATE password_resets SET used = 1 WHERE id = ?", [row.id]);

	return c.json({ ok: true });
}

export async function resetForm(c: Context) {
	const token = c.req.query("token") || "";
	const flash = getFlash(c);
	const user = getUser(c);

	if (!token) {
		return setFlashRedirect(
			c,
			"/lupa-password",
			"Token tidak valid.",
			"danger",
		);
	}

	const row = await queryOne<{
		id: number;
		user_id: number;
		expires_at: string;
		used: number;
	}>(
		"SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?",
		[token],
	);

	if (!row || row.used || new Date(row.expires_at) < new Date()) {
		return setFlashRedirect(
			c,
			"/lupa-password",
			"Token sudah kadaluarsa atau tidak valid.",
			"danger",
		);
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

	if (!token)
		return setFlashRedirect(
			c,
			"/lupa-password",
			"Token tidak valid.",
			"danger",
		);
	if (password.length < 6)
		return setFlashRedirect(
			c,
			`/reset-password?token=${token}`,
			"Password minimal 6 karakter.",
			"danger",
		);
	if (password !== confirm)
		return setFlashRedirect(
			c,
			`/reset-password?token=${token}`,
			"Password dan konfirmasi tidak cocok.",
			"danger",
		);

	const row = await queryOne<{
		id: number;
		user_id: number;
		expires_at: string;
		used: number;
	}>(
		"SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?",
		[token],
	);

	if (!row || row.used || new Date(row.expires_at) < new Date()) {
		return setFlashRedirect(
			c,
			"/lupa-password",
			"Token sudah kadaluarsa atau tidak valid.",
			"danger",
		);
	}

	const hash = await bcrypt.hash(password, 10);
	await query("UPDATE users SET password = ? WHERE id = ?", [
		hash,
		row.user_id,
	]);
	await query("UPDATE password_resets SET used = 1 WHERE id = ?", [row.id]);

	return setFlashRedirect(
		c,
		"/login",
		"Password berhasil direset! Silakan masuk.",
		"success",
	);
}

// src/controllers/profile.ts — User profile & change password

import type { Context } from "hono";
import bcrypt from "bcryptjs";
import { query, queryOne } from "../config/database";
import { layout } from "../views/html";
import { getUser, getFlash, setFlashRedirect, esc } from "../helpers";

export async function profile(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const flash = getFlash(c);

	const dbUser = await queryOne<{ name: string; email: string; username: string; nim_nip: string | null; created_at: string }>(
		"SELECT name, email, username, nim_nip, created_at FROM users WHERE id = ?",
		[user.userId],
	);

	const html = layout(
		"Profil Saya",
		`<div class="auth-page" style="min-height:calc(100vh - 64px)">
  <div class="auth-card" style="max-width:480px">
    <h1 style="text-align:left">Profil Saya</h1>
    <div style="display:grid;gap:12px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light)">
        <span class="text-muted" style="font-size:0.85rem">Nama</span>
        <strong style="font-size:0.85rem">${esc(dbUser?.name || user.name)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light)">
        <span class="text-muted" style="font-size:0.85rem">Email</span>
        <strong style="font-size:0.85rem">${esc(dbUser?.email || "")}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light)">
        <span class="text-muted" style="font-size:0.85rem">Username</span>
        <strong style="font-size:0.85rem">${esc(dbUser?.username || "")}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light)">
        <span class="text-muted" style="font-size:0.85rem">NIM/NIP</span>
        <strong style="font-size:0.85rem">${esc(dbUser?.nim_nip || "-")}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0">
        <span class="text-muted" style="font-size:0.85rem">Role</span>
        <span class="badge ${user.roleName}" style="font-size:0.75rem">${esc(user.roleName)}</span>
      </div>
    </div>
    <a href="/profil/ganti-password" class="btn btn-outline btn-block" style="margin-bottom:10px">🔒 Ganti Password</a>
    <a href="/buku" class="btn btn-primary btn-block">Kembali ke Katalog</a>
  </div>
</div>`,
		user,
		flash,
	);
	return c.html(html);
}

export async function changePasswordForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const flash = getFlash(c);

	const html = layout(
		"Ganti Password",
		`<div class="auth-page" style="min-height:calc(100vh - 64px)">
  <div class="auth-card" style="max-width:420px">
    <h1 style="text-align:left">Ganti Password</h1>
    <form method="POST" action="/profil/ganti-password">
      <div class="form-group">
        <label for="current_password">Password Saat Ini</label>
        <input type="password" id="current_password" name="current_password" class="form-control" required autocomplete="current-password">
      </div>
      <div class="form-group">
        <label for="new_password">Password Baru</label>
        <input type="password" id="new_password" name="new_password" class="form-control" required minlength="6" autocomplete="new-password" placeholder="Minimal 6 karakter">
      </div>
      <div class="form-group">
        <label for="confirm_password">Konfirmasi Password Baru</label>
        <input type="password" id="confirm_password" name="confirm_password" class="form-control" required autocomplete="new-password" placeholder="Ulangi password baru">
      </div>
      <button type="submit" class="btn btn-primary btn-block">Simpan</button>
    </form>
    <p class="text-center mt-2 text-muted"><a href="/profil">← Kembali ke Profil</a></p>
  </div>
</div>`,
		user,
		flash,
	);
	return c.html(html);
}

export async function changePassword(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");

	const body = await c.req.parseBody();
	const current = String(body.current_password || "");
	const newPass = String(body.new_password || "");
	const confirm = String(body.confirm_password || "");

	if (!current) return setFlashRedirect(c, "/profil/ganti-password", "Password saat ini wajib diisi.", "danger");
	if (newPass.length < 6) return setFlashRedirect(c, "/profil/ganti-password", "Password baru minimal 6 karakter.", "danger");
	if (newPass !== confirm) return setFlashRedirect(c, "/profil/ganti-password", "Password baru dan konfirmasi tidak cocok.", "danger");

	const dbUser = await queryOne<{ password: string }>(
		"SELECT password FROM users WHERE id = ?",
		[user.userId],
	);

	if (!dbUser || !(await bcrypt.compare(current, dbUser.password))) {
		return setFlashRedirect(c, "/profil/ganti-password", "Password saat ini salah.", "danger");
	}

	const hash = await bcrypt.hash(newPass, 10);
	await query("UPDATE users SET password = ? WHERE id = ?", [hash, user.userId]);

	return setFlashRedirect(c, "/profil", "Password berhasil diubah!", "success");
}

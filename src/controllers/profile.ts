// src/controllers/profile.ts — User profile & change password

import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { query, queryOne } from "../config/database";
import { layout } from "../views/html";
import { getUser, getFlash, setFlashRedirect, esc } from "../helpers";

// Profile modal (AJAX)
export async function profileModal(c: Context) {
	const user = getUser(c);
	if (!user) return c.html("<p style='padding:20px;text-align:center;color:var(--text-muted)'>Silakan masuk terlebih dahulu.</p>");

	const dbUser = await queryOne<{ name: string; email: string; username: string; nim_nip: string | null; created_at: string }>(
		"SELECT name, email, username, nim_nip, created_at FROM users WHERE id = ?",
		[user.userId],
	);

	return c.html(`
    <div style="display:flex;flex-direction:column;gap:0">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light)">
        <span style="color:var(--text-muted);font-size:0.82rem;width:100px">Nama</span>
        <strong style="font-size:0.85rem;text-align:right;flex:1">${esc(dbUser?.name || user.name)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light)">
        <span style="color:var(--text-muted);font-size:0.82rem;width:100px">Email</span>
        <strong style="font-size:0.85rem;text-align:right;flex:1;word-break:break-all">${esc(dbUser?.email || "")}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light)">
        <span style="color:var(--text-muted);font-size:0.82rem;width:100px">Username</span>
        <strong style="font-size:0.85rem;text-align:right;flex:1">${esc(dbUser?.username || "")}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light)">
        <span style="color:var(--text-muted);font-size:0.82rem;width:100px">NIM/NIP</span>
        <strong style="font-size:0.85rem;text-align:right;flex:1">${esc(dbUser?.nim_nip || "-")}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0">
        <span style="color:var(--text-muted);font-size:0.82rem;width:100px">Role</span>
        <span class="badge ${user.roleName}" style="font-size:0.72rem;text-transform:capitalize">${esc(user.roleName)}</span>
      </div>
    </div>
  `);
}

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

export async function changePasswordModal(c: Context) {
	const user = getUser(c);
	if (!user) return c.html("<p style='padding:20px;text-align:center;color:var(--text-muted)'>Silakan masuk terlebih dahulu.</p>");

	return c.html(`
    <form id="changePasswordForm" method="POST" action="/profil/ganti-password">
      <input type="hidden" name="from_modal" value="1">
      <div class="form-group">
        <label for="cp_current">Password Saat Ini</label>
        <input type="password" id="cp_current" name="current_password" class="form-control" required autocomplete="current-password">
      </div>
      <div class="form-group">
        <label for="cp_new">Password Baru</label>
        <input type="password" id="cp_new" name="new_password" class="form-control" required minlength="6" autocomplete="new-password" placeholder="Minimal 6 karakter">
      </div>
      <div class="form-group">
        <label for="cp_confirm">Konfirmasi Password Baru</label>
        <input type="password" id="cp_confirm" name="confirm_password" class="form-control" required autocomplete="new-password" placeholder="Ulangi password baru">
      </div>
      <button type="submit" class="btn btn-primary btn-block">Simpan Perubahan</button>
    </form>
  `);
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
	const fromModal = body.from_modal === "1";
	const redirect = fromModal ? "/" : "/profil/ganti-password";

	if (!current) return setFlashRedirect(c, redirect, "Password saat ini wajib diisi.", "danger");
	if (newPass.length < 6) return setFlashRedirect(c, redirect, "Password baru minimal 6 karakter.", "danger");
	if (newPass !== confirm) return setFlashRedirect(c, redirect, "Password baru dan konfirmasi tidak cocok.", "danger");

	const dbUser = await queryOne<{ password: string }>(
		"SELECT password FROM users WHERE id = ?",
		[user.userId],
	);

	if (!dbUser || !(await bcrypt.compare(current, dbUser.password))) {
		return setFlashRedirect(c, redirect, "Password saat ini salah.", "danger");
	}

	const hash = await bcrypt.hash(newPass, 10);
	await query("UPDATE users SET password = ? WHERE id = ?", [hash, user.userId]);

	// Logout after password change
	deleteCookie(c, "token", { path: "/" });
	setCookie(c, "flash", JSON.stringify({ type: "success", message: "Password berhasil diubah! Silakan masuk kembali." }), {
		httpOnly: true,
		path: "/",
		maxAge: 5,
	});

	return c.redirect("/?auth=login");
}

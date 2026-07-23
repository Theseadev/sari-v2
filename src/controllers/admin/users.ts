// src/controllers/admin/users.ts — User CRUD (super_admin only)

import type { Context } from "hono";
import bcrypt from "bcryptjs";
import { query, queryOne } from "../../config/database";
import { userList, userForm } from "../../views/admin/users";
import { getUser } from "../../helpers";
import { errorPage } from "../../views/html";
import { getFlash, setFlash } from "../flash";

// ── List ──
const perPage = 5;

export async function list(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (user.roleName !== "super_admin") return c.redirect("/admin");
	const flash = getFlash(c);
	const search = (c.req.query("q") || "").trim();
	const page = search ? 1 : Math.max(1, Number(c.req.query("page")) || 1);
	const limit = search ? 999 : perPage;
	const offset = search ? 0 : (page - 1) * perPage;

	let whereSql = "";
	const params: (string | number)[] = [];
	if (search) {
		whereSql =
			" WHERE (u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.nim_nip LIKE ?)";
		const term = `%${search}%`;
		params.push(term, term, term, term);
	}

	const total = await queryOne<{ cnt: number }>(
		`SELECT COUNT(*) AS cnt FROM users u${whereSql}`,
		params,
	);
	const totalPages = search ? 1 : Math.ceil((total?.cnt || 0) / perPage);

	const users = await query<any[]>(
		`SELECT u.id, u.username, u.name, u.email, u.nim_nip, u.status,
          r.name AS role_name, u.last_login, u.created_at
   FROM users u JOIN roles r ON r.id = u.role_id${whereSql}
   ORDER BY u.created_at DESC
   LIMIT ${limit} OFFSET ${offset}`,
		params,
	);
	const isAjax = c.req.header("x-requested-with") === "XMLHttpRequest";
	return c.html(
		userList(
			users,
			{ name: user.name, roleName: user.roleName },
			"users",
			{ page, totalPages, total: total?.cnt || 0, search },
			isAjax,
		),
	);
}

// ── Create Form ──
export async function createForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const roles = await query<{ id: number; name: string }[]>(
		"SELECT id, name FROM roles ORDER BY id",
	);
	return c.html(userForm({ name: user.name, roleName: user.roleName }, roles));
}

// ── Store ──
export async function store(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const body = await c.req.parseBody();

	const username = String(body.username || "").trim();
	const name = String(body.name || "").trim();
	const email = String(body.email || "").trim();
	const password = String(body.password || "");

	if (!username || !name || !email || !password) {
		setFlash(c, "Semua field wajib diisi.", "danger");
		return c.redirect("/admin/users/create");
	}
	if (password.length < 6) {
		setFlash(c, "Password minimal 6 karakter.", "danger");
		return c.redirect("/admin/users/create");
	}

	// Check duplicate
	const existing = await queryOne<any>(
		"SELECT id FROM users WHERE username = ? OR email = ?",
		[username, email],
	);
	if (existing) {
		setFlash(c, "Username atau email sudah digunakan.", "danger");
		return c.redirect("/admin/users/create");
	}

	const hash = await bcrypt.hash(password, 10);
	await query(
		`INSERT INTO users (role_id, username, name, email, password, nim_nip, status)
   VALUES (?,?,?,?,?,?,?)`,
		[
			Number(body.role_id) || 3,
			username,
			name,
			email,
			hash,
			body.nim_nip || null,
			body.status || "active",
		],
	);

	await query(
		`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
		[
			user.userId,
			"create_user",
			`Menambah user: ${name}`,
			c.req.header("x-forwarded-for") || "local",
		],
	);

	setFlash(c, `User "${name}" berhasil ditambahkan.`, "success");
	return c.redirect("/admin/users");
}

// ── Edit Form ──
export async function editForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const editUser = await queryOne<any>("SELECT * FROM users WHERE id = ?", [
		id,
	]);
	if (!editUser) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "User tidak ditemukan."),
			404,
		);
	}
	const roles = await query<{ id: number; name: string }[]>(
		"SELECT id, name FROM roles ORDER BY id",
	);
	return c.html(
		userForm({ name: user.name, roleName: user.roleName }, roles, editUser),
	);
}

// ── Update ──
export async function update(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();

	const existing = await queryOne<any>("SELECT * FROM users WHERE id = ?", [
		id,
	]);
	if (!existing) {
		setFlash(c, "User tidak ditemukan.", "danger");
		return c.redirect("/admin/users");
	}

	const username = String(body.username || "").trim();
	const name = String(body.name || "").trim();
	const email = String(body.email || "").trim();
	if (!username || !name || !email) {
		setFlash(c, "Username, nama, dan email wajib diisi.", "danger");
		return c.redirect(`/admin/users/${id}/edit`);
	}

	// Check duplicate (exclude self)
	const dup = await queryOne<any>(
		"SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
		[username, email, id],
	);
	if (dup) {
		setFlash(c, "Username atau email sudah digunakan.", "danger");
		return c.redirect(`/admin/users/${id}/edit`);
	}

	const password = String(body.password || "");
	if (password) {
		if (password.length < 6) {
			setFlash(c, "Password minimal 6 karakter.", "danger");
			return c.redirect(`/admin/users/${id}/edit`);
		}
		const hash = await bcrypt.hash(password, 10);
		await query(
			`UPDATE users SET username=?, name=?, email=?, nim_nip=?, role_id=?, status=?, password=? WHERE id=?`,
			[
				username,
				name,
				email,
				body.nim_nip || null,
				Number(body.role_id) || 3,
				body.status || "active",
				hash,
				id,
			],
		);
	} else {
		await query(
			`UPDATE users SET username=?, name=?, email=?, nim_nip=?, role_id=?, status=? WHERE id=?`,
			[
				username,
				name,
				email,
				body.nim_nip || null,
				Number(body.role_id) || 3,
				body.status || "active",
				id,
			],
		);
	}

	await query(
		`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
		[
			user.userId,
			"update_user",
			`Mengedit user: ${name}`,
			c.req.header("x-forwarded-for") || "local",
		],
	);

	setFlash(c, `User "${name}" berhasil diupdate.`, "success");
	return c.redirect("/admin/users");
}

// ── Delete ──
export async function remove(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const target = await queryOne<any>("SELECT * FROM users WHERE id = ?", [id]);
	if (!target) {
		setFlash(c, "User tidak ditemukan.", "danger");
		return c.redirect("/admin/users");
	}
	if (target.role_name === "super_admin") {
		setFlash(c, "Tidak bisa menghapus super admin.", "danger");
		return c.redirect("/admin/users");
	}

	await query("DELETE FROM users WHERE id = ?", [id]);

	await query(
		`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
		[
			user.userId,
			"delete_user",
			`Menghapus user: ${target.name}`,
			c.req.header("x-forwarded-for") || "local",
		],
	);

	setFlash(c, `User "${target.name}" berhasil dihapus.`, "success");
	return c.redirect("/admin/users");
}

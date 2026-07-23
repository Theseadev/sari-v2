// src/controllers/admin/faculties.ts — Faculty CRUD

import type { Context } from "hono";
import { query, queryOne } from "../../config/database";
import { facList, facForm } from "../../views/admin/faculties";
import { getUser } from "../../helpers";
import { errorPage } from "../../views/html";
import { getFlash, setFlash } from "../flash";

// ── List ──
export async function list(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName))
		return c.redirect("/admin");
	const _flash = getFlash(c);
	const search = (c.req.query("q") || "").trim();

	let whereSql = "";
	const params: (string | number)[] = [];
	if (search) {
		whereSql = " WHERE f.name LIKE ? OR f.description LIKE ?";
		const term = `%${search}%`;
		params.push(term, term);
	}

	const facs = await query<any[]>(
		`SELECT f.*, (SELECT COUNT(*) FROM programs p WHERE p.faculty_id = f.id) AS program_count
   FROM faculties f${whereSql} ORDER BY f.name`,
		params,
	);
	const isAjax = c.req.header("x-requested-with") === "XMLHttpRequest";
	return c.html(
		facList(
			facs,
			{ name: user.name, roleName: user.roleName },
			"faculties",
			search,
			isAjax,
		),
	);
}

// ── Create Form ──
export async function createForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	return c.html(facForm({ name: user.name, roleName: user.roleName }));
}

// ── Store ──
export async function store(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const body = await c.req.parseBody();

	const name = String(body.name || "").trim();
	if (!name) {
		setFlash(c, "Nama fakultas wajib diisi.", "danger");
		return c.redirect("/admin/faculties/create");
	}

	const slug = makeSlug(name);

	const existing = await queryOne<any>(
		"SELECT id FROM faculties WHERE name = ?",
		[name],
	);
	if (existing) {
		setFlash(c, "Fakultas dengan nama tersebut sudah ada.", "danger");
		return c.redirect("/admin/faculties/create");
	}

	await query(
		"INSERT INTO faculties (name, slug, description) VALUES (?,?,?)",
		[name, slug, body.description || null],
	);

	setFlash(c, `Fakultas "${name}" berhasil ditambahkan.`, "success");
	return c.redirect("/admin/faculties");
}

// ── Edit Form ──
export async function editForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const fac = await queryOne<any>("SELECT * FROM faculties WHERE id = ?", [id]);
	if (!fac) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "Fakultas tidak ditemukan."),
			404,
		);
	}
	return c.html(facForm({ name: user.name, roleName: user.roleName }, fac));
}

// ── Update ──
export async function update(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();

	const name = String(body.name || "").trim();
	if (!name) {
		setFlash(c, "Nama fakultas wajib diisi.", "danger");
		return c.redirect(`/admin/faculties/${id}/edit`);
	}

	const slug = makeSlug(name);

	await query("UPDATE faculties SET name=?, slug=?, description=? WHERE id=?", [
		name,
		slug,
		body.description || null,
		id,
	]);

	setFlash(c, `Fakultas "${name}" berhasil diupdate.`, "success");
	return c.redirect("/admin/faculties");
}

// ── Delete ──
export async function remove(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const fac = await queryOne<any>("SELECT * FROM faculties WHERE id = ?", [id]);
	if (!fac) {
		setFlash(c, "Fakultas tidak ditemukan.", "danger");
		return c.redirect("/admin/faculties");
	}

	const [progCount] = await query<any[]>(
		"SELECT COUNT(*) AS c FROM programs WHERE faculty_id = ?",
		[id],
	);
	if (progCount.c > 0) {
		setFlash(
			c,
			`Tidak bisa menghapus: ada ${progCount.c} program studi di fakultas ini.`,
			"danger",
		);
		return c.redirect("/admin/faculties");
	}

	await query("DELETE FROM faculties WHERE id = ?", [id]);
	setFlash(c, `Fakultas "${fac.name}" berhasil dihapus.`, "success");
	return c.redirect("/admin/faculties");
}

function makeSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 220);
}

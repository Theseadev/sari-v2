// src/controllers/admin/programs.ts — Program CRUD

import type { Context } from "hono";
import { query, queryOne } from "../../config/database";
import { progList, progForm } from "../../views/admin/programs";
import { getUser } from "../../helpers";
import { errorPage } from "../../views/html";
import { getFlash, setFlash } from "../flash";

// ── List ──
export async function list(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (!["admin", "super_admin", "pustakawan"].includes(user.roleName)) return c.redirect("/admin");
	const flash = getFlash(c);
	const progs = await query<any[]>(
		`SELECT p.*, f.name AS faculty_name
   FROM programs p JOIN faculties f ON f.id = p.faculty_id
   ORDER BY f.name, p.name`,
	);
	return c.html(
		progList(progs, { name: user.name, roleName: user.roleName }, "programs"),
	);
}

// ── Create Form ──
export async function createForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const facs = await query<{ id: number; name: string }[]>(
		"SELECT id, name FROM faculties ORDER BY name",
	);
	return c.html(
		progForm({ name: user.name, roleName: user.roleName }, facs),
	);
}

// ── Store ──
export async function store(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const body = await c.req.parseBody();

	const name = String(body.name || "").trim();
	const facultyId = Number(body.faculty_id);
	if (!name || !facultyId) {
		setFlash(c, "Nama dan fakultas wajib diisi.", "danger");
		return c.redirect("/admin/programs/create");
	}

	const slug = makeSlug(name);

	const existing = await queryOne<any>(
		"SELECT id FROM programs WHERE slug = ?",
		[slug],
	);
	if (existing) {
		setFlash(c, "Program studi dengan nama tersebut sudah ada.", "danger");
		return c.redirect("/admin/programs/create");
	}

	await query(
		"INSERT INTO programs (faculty_id, name, slug) VALUES (?,?,?)",
		[facultyId, name, slug],
	);

	setFlash(c, `Program studi "${name}" berhasil ditambahkan.`, "success");
	return c.redirect("/admin/programs");
}

// ── Edit Form ──
export async function editForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const prog = await queryOne<any>("SELECT * FROM programs WHERE id = ?", [id]);
	if (!prog) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "Program studi tidak ditemukan."),
			404,
		);
	}
	const facs = await query<{ id: number; name: string }[]>(
		"SELECT id, name FROM faculties ORDER BY name",
	);
	return c.html(
		progForm({ name: user.name, roleName: user.roleName }, facs, prog),
	);
}

// ── Update ──
export async function update(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();

	const name = String(body.name || "").trim();
	const facultyId = Number(body.faculty_id);
	if (!name || !facultyId) {
		setFlash(c, "Nama dan fakultas wajib diisi.", "danger");
		return c.redirect(`/admin/programs/${id}/edit`);
	}

	const slug = makeSlug(name);

	await query(
		"UPDATE programs SET faculty_id=?, name=?, slug=? WHERE id=?",
		[facultyId, name, slug, id],
	);

	setFlash(c, `Program studi "${name}" berhasil diupdate.`, "success");
	return c.redirect("/admin/programs");
}

// ── Delete ──
export async function remove(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const prog = await queryOne<any>("SELECT * FROM programs WHERE id = ?", [id]);
	if (!prog) {
		setFlash(c, "Program studi tidak ditemukan.", "danger");
		return c.redirect("/admin/programs");
	}

	const [bookCount] = await query<any[]>(
		"SELECT COUNT(*) AS c FROM books WHERE program_id = ?",
		[id],
	);
	if (bookCount.c > 0) {
		setFlash(
			c,
			`Tidak bisa menghapus: ada ${bookCount.c} buku di program studi ini.`,
			"danger",
		);
		return c.redirect("/admin/programs");
	}

	await query("DELETE FROM programs WHERE id = ?", [id]);
	setFlash(c, `Program studi "${prog.name}" berhasil dihapus.`, "success");
	return c.redirect("/admin/programs");
}

function makeSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 220);
}

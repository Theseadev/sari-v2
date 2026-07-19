// src/controllers/admin/categories.ts — Category CRUD

import type { Context } from "hono";
import { query, queryOne } from "../../config/database";
import { catList, catForm } from "../../views/admin/categories";
import { getUser } from "../../helpers";
import { errorPage } from "../../views/html";
import { getFlash, setFlash } from "../flash";

// ── List ──
export async function list(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const flash = getFlash(c);
	const cats = await query<any[]>(
		`SELECT c.*, (SELECT COUNT(*) FROM books b WHERE b.category_id = c.id) AS book_count
   FROM categories c ORDER BY c.name`,
	);
	return c.html(
		catList(cats, { name: user.name, roleName: user.roleName }, "categories"),
	);
}

// ── Create Form ──
export async function createForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	return c.html(catForm({ name: user.name, roleName: user.roleName }));
}

// ── Store ──
export async function store(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const body = await c.req.parseBody();

	const name = String(body.name || "").trim();
	if (!name) {
		setFlash(c, "Nama kategori wajib diisi.", "danger");
		return c.redirect("/admin/categories/create");
	}

	const slug = makeSlug(name);

	const existing = await queryOne<any>(
		"SELECT id FROM categories WHERE name = ?",
		[name],
	);
	if (existing) {
		setFlash(c, "Kategori dengan nama tersebut sudah ada.", "danger");
		return c.redirect("/admin/categories/create");
	}

	await query(
		"INSERT INTO categories (name, slug, description) VALUES (?,?,?)",
		[name, slug, body.description || null],
	);

	setFlash(c, `Kategori "${name}" berhasil ditambahkan.`, "success");
	return c.redirect("/admin/categories");
}

// ── Edit Form ──
export async function editForm(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const cat = await queryOne<any>("SELECT * FROM categories WHERE id = ?", [
		id,
	]);
	if (!cat) {
		return c.html(
			errorPage(404, "Tidak Ditemukan", "Kategori tidak ditemukan."),
			404,
		);
	}
	return c.html(catForm({ name: user.name, roleName: user.roleName }, cat));
}

// ── Update ──
export async function update(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();

	const name = String(body.name || "").trim();
	if (!name) {
		setFlash(c, "Nama kategori wajib diisi.", "danger");
		return c.redirect(`/admin/categories/${id}/edit`);
	}

	const slug = makeSlug(name);

	await query(
		"UPDATE categories SET name=?, slug=?, description=? WHERE id=?",
		[slug, name, body.description || null, id],
	);

	setFlash(c, `Kategori "${name}" berhasil diupdate.`, "success");
	return c.redirect("/admin/categories");
}

// ── Delete ──
export async function remove(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	const id = Number(c.req.param("id"));
	const cat = await queryOne<any>("SELECT * FROM categories WHERE id = ?", [
		id,
	]);
	if (!cat) {
		setFlash(c, "Kategori tidak ditemukan.", "danger");
		return c.redirect("/admin/categories");
	}

	const [bookCount] = await query<any[]>(
		"SELECT COUNT(*) AS c FROM books WHERE category_id = ?",
		[id],
	);
	if (bookCount.c > 0) {
		setFlash(
			c,
			`Tidak bisa menghapus: ada ${bookCount.c} buku di kategori ini.`,
			"danger",
		);
		return c.redirect("/admin/categories");
	}

	await query("DELETE FROM categories WHERE id = ?", [id]);
	setFlash(c, `Kategori "${cat.name}" berhasil dihapus.`, "success");
	return c.redirect("/admin/categories");
}

function makeSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 180);
}

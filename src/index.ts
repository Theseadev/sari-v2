// src/index.ts - Entry point & routing (Hono + TypeScript)

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { APP } from "./config/app";
import { errorPage } from "./views/html";
import * as auth from "./controllers/auth";
import * as books from "./controllers/books";
import * as pdf from "./controllers/pdf";
import * as dash from "./controllers/dashboard";
import * as logsCtrl from "./controllers/logs";
import * as booksCrud from "./controllers/admin/books";
import * as usersCrud from "./controllers/admin/users";
import * as facsCrud from "./controllers/admin/faculties";
import * as progsCrud from "./controllers/admin/programs";
import * as catsCrud from "./controllers/admin/categories";
import * as password from "./controllers/password";
import * as profile from "./controllers/profile";
import * as bookmarks from "./controllers/bookmarks";
import { csrfProtection } from "./middleware/csrf";

const app = new Hono();

// Static files
app.use("/assets/*", serveStatic({ root: "public" }));
app.use("/uploads/*", serveStatic({ root: "public" }));

// CSRF protection for mutating requests
app.use("*", csrfProtection);

// AUTH
app.get("/login", (c) => auth.loginForm(c));
app.post("/login", (c) => auth.login(c));
app.get("/register", (c) => auth.registerForm(c));
app.post("/register", (c) => auth.register(c));
app.get("/logout", (c) => auth.logout(c));

// Password Reset
app.get("/lupa-password", (c) => password.forgotForm(c));
app.post("/lupa-password", (c) => password.forgot(c));
app.get("/reset-password", (c) => password.resetForm(c));
app.post("/reset-password", (c) => password.reset(c));

// Profile
app.get("/profil", (c) => profile.profile(c));
app.get("/profil/modal", (c) => profile.profileModal(c));
app.get("/profil/ganti-password/modal", (c) => profile.changePasswordModal(c));
app.get("/profil/ganti-password", (c) => profile.changePasswordForm(c));
app.post("/profil/ganti-password", (c) => profile.changePassword(c));

// Bookmarks (toggle + modal data)
app.post("/bookmark/:id/toggle", (c) => bookmarks.toggle(c));
app.get("/bookmark/modal", (c) => bookmarks.modal(c));
app.get("/riwayat/modal", (c) => bookmarks.historyModal(c));
app.get("/riwayat", (c) => bookmarks.history(c));

// Sitemap
app.get("/sitemap.xml", (c) => auth.sitemap(c));

// PUBLIC: Catalog & Detail
app.get("/", (c) => c.redirect("/buku"));
app.get("/buku", (c) => books.catalog(c));
app.get("/buku/:slug", (c) => books.detail(c));
app.get("/buku/:slug/full", (c) => books.detailPage(c));

// PDF Reader & Proxy
app.get("/baca/:slug", (c) => books.reader(c));
app.get("/pdf/:slug", (c) => pdf.servePdf(c));

// ADMIN
app.get("/admin", (c) => dash.dashboard(c));
app.get("/admin/logs", (c) => logsCtrl.logs(c));

// Books CRUD
app.get("/admin/books", (c) => booksCrud.list(c));
app.get("/admin/books/create", (c) => booksCrud.createForm(c));
app.post("/admin/books/create", (c) => booksCrud.store(c));
app.get("/admin/books/:id/edit", (c) => booksCrud.editForm(c));
app.post("/admin/books/:id/update", (c) => booksCrud.update(c));
app.post("/admin/books/:id/delete", (c) => booksCrud.remove(c));

// Users CRUD (super_admin)
app.get("/admin/users", (c) => usersCrud.list(c));
app.get("/admin/users/create", (c) => usersCrud.createForm(c));
app.post("/admin/users/create", (c) => usersCrud.store(c));
app.get("/admin/users/:id/edit", (c) => usersCrud.editForm(c));
app.post("/admin/users/:id/update", (c) => usersCrud.update(c));
app.post("/admin/users/:id/delete", (c) => usersCrud.remove(c));

// Faculties CRUD
app.get("/admin/faculties", (c) => facsCrud.list(c));
app.get("/admin/faculties/create", (c) => facsCrud.createForm(c));
app.post("/admin/faculties/create", (c) => facsCrud.store(c));
app.get("/admin/faculties/:id/edit", (c) => facsCrud.editForm(c));
app.post("/admin/faculties/:id/update", (c) => facsCrud.update(c));
app.post("/admin/faculties/:id/delete", (c) => facsCrud.remove(c));

// Programs CRUD
app.get("/admin/programs", (c) => progsCrud.list(c));
app.get("/admin/programs/create", (c) => progsCrud.createForm(c));
app.post("/admin/programs/create", (c) => progsCrud.store(c));
app.get("/admin/programs/:id/edit", (c) => progsCrud.editForm(c));
app.post("/admin/programs/:id/update", (c) => progsCrud.update(c));
app.post("/admin/programs/:id/delete", (c) => progsCrud.remove(c));

// Categories CRUD
app.get("/admin/categories", (c) => catsCrud.list(c));
app.get("/admin/categories/create", (c) => catsCrud.createForm(c));
app.post("/admin/categories/create", (c) => catsCrud.store(c));
app.get("/admin/categories/:id/edit", (c) => catsCrud.editForm(c));
app.post("/admin/categories/:id/update", (c) => catsCrud.update(c));
app.post("/admin/categories/:id/delete", (c) => catsCrud.remove(c));

// 404
app.notFound((c) =>
	c.html(
		errorPage(
			404,
			"Halaman Tidak Ditemukan",
			"Maaf, halaman yang Anda cari tidak tersedia.",
		),
		404,
	),
);

// Start
if (APP.DEBUG)
	console.log(`<${APP.NAME}> running at http://localhost:${APP.PORT}`);
serve({ fetch: app.fetch, port: APP.PORT });

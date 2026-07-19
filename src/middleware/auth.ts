// src/middleware/auth.ts - Middleware RBAC

import type { Context, MiddlewareHandler } from "hono";
import { APP } from "../config/app";
import type { JwtPayload, RoleName } from "../types";
import { getUser, esc } from "../helpers";

/**
 * Middleware: redirect ke /login jika belum auth.
 */
export const requireLogin: MiddlewareHandler = async (c, next) => {
	const user = getUser(c);
	if (!user) {
		return c.redirect(`/login?redirect=${encodeURIComponent(c.req.path)}`);
	}
	c.set("user", user);
	await next();
};

/**
 * Middleware: batasi akses berdasarkan role.
 */
export function requireRole(roles: RoleName[]): MiddlewareHandler {
	return async (c, next) => {
		const user = getUser(c);
		if (!user || !roles.includes(user.roleName)) {
			return page403(
				c,
				"Anda tidak memiliki izin untuk mengakses halaman ini.",
			);
		}
		c.set("user", user);
		await next();
	};
}

/**
 * Middleware: cek akses buku (public = semua, internal = login + role tertentu).
 */
export function requireBookAccess(accessType: string): MiddlewareHandler {
	return async (c, next) => {
		if (accessType === "public") {
			c.set("user", getUser(c));
			await next();
			return;
		}
		// internal
		const user = getUser(c);
		if (
			!user ||
			!["mahasiswa", "admin", "super_admin", "pustakawan"].includes(
				user.roleName,
			)
		) {
			return page403(c, "Buku ini hanya untuk akses internal kampus.");
		}
		c.set("user", user);
		await next();
	};
}

/**
 * Render halaman 403.
 */
function page403(c: Context, msg: string): Response {
	return c.html(
		`<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>403 - ${APP.NAME}</title>
<link rel="stylesheet" href="/assets/css/style.css"></head>
<body><main class="container">
<div class="error-page"><h1>403 — Akses Ditolak</h1><p>${esc(msg)}</p>
<a href="/" class="btn">Kembali ke Beranda</a></div></main></body></html>`,
		403,
	);
}

export { esc, getUser } from "../helpers";

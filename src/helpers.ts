// src/helpers.ts - Fungsi utilitas

import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { APP } from "./config/app";
import type { JwtPayload } from "./types";

/* ---------- HTML escaping ---------- */
export function esc(s: unknown): string {
	if (s == null) return "";
	return String(s)
		.replace(/&/g, "\u0026amp;")
		.replace(/</g, "\u0026lt;")
		.replace(/>/g, "\u0026gt;")
		.replace(/"/g, "\u0026quot;")
		.replace(/'/g, "\u0026#039;");
}

/* ---------- JWT user from cookie ---------- */
export function getUser(c: Context): JwtPayload | null {
	const token = getCookie(c, "token");
	if (!token) return null;
	try {
		return jwt.verify(token, APP.JWT_SECRET) as JwtPayload;
	} catch {
		return null;
	}
}

/* ---------- Flash messages (cookie-based, with length guard) ---------- */
export function getFlash(c: Context): { type: string; message: string } | null {
	const raw = getCookie(c, "flash");
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function setFlashRedirect(
	c: Context,
	url: string,
	msg: string,
	type: string,
): Response {
	// Truncate to ~3KB to stay safe under 4KB cookie limit
	const safeMsg = msg.length > 3000 ? msg.slice(0, 3000) + "\u2026" : msg;
	setCookie(c, "flash", JSON.stringify({ type, message: safeMsg }), {
		httpOnly: true,
		path: "/",
		maxAge: 5,
	});
	return c.redirect(url);
}

export function setFlash(c: Context, msg: string, type: string): void {
	const safeMsg = msg.length > 3000 ? msg.slice(0, 3000) + "\u2026" : msg;
	setCookie(c, "flash", JSON.stringify({ type, message: safeMsg }), {
		httpOnly: true,
		path: "/",
		maxAge: 5,
	});
}

/* ---------- Role check ---------- */
export function hasRole(user: JwtPayload | null, allowed: string[]): boolean {
	return user !== null && allowed.includes(user.roleName);
}

export { APP } from "./config/app";

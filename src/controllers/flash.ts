// src/controllers/flash.ts — Flash message helper

import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

export function getFlash(c: Context): { type: string; message: string } | null {
	const raw = getCookie(c, "flash");
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function setFlash(c: Context, msg: string, type: string): void {
	setCookie(c, "flash", JSON.stringify({ type, message: msg }), {
		httpOnly: true,
		path: "/",
		maxAge: 5,
	});
}

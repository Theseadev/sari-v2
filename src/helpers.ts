// src/helpers.ts - Fungsi utilitas

import type { JwtPayload } from "./types";

/* ---------- HTML escaping ---------- */
export function esc(s: unknown): string {
	if (s == null) return "";
	return String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/* ---------- Role check ---------- */
export function hasRole(user: JwtPayload | null, allowed: string[]): boolean {
	return user !== null && allowed.includes(user.roleName);
}

export { APP } from "./config/app";

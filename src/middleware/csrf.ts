// src/middleware/csrf.ts - CSRF Protection Middleware

import type { Context, MiddlewareHandler } from "hono";
import { verifyCsrfToken } from "../views/html";

/**
 * Middleware: validasi CSRF token untuk POST/PUT/DELETE requests.
 * Skip untuk GET/HEAD/OPTIONS.
 */
export const csrfProtection: MiddlewareHandler = async (c, next) => {
	const method = c.req.method;
	if (["GET", "HEAD", "OPTIONS"].includes(method)) {
		await next();
		return;
	}

	// Skip CSRF untuk bookmark toggle (action non-sensitif)
	if (c.req.path.includes("/bookmark/")) {
		await next();
		return;
	}

	// Get token from header (for fetch/XHR) or form body
	const headerToken =
		c.req.header("x-csrf-token") || c.req.header("csrf-token");
	const formData = await c.req.parseBody().catch(() => ({}));
	const bodyToken = (formData as any)?.csrf_token;

	const token = headerToken || bodyToken;
	if (!token || !verifyCsrfToken(String(token))) {
		return c.text("CSRF token tidak valid atau kadaluarsa", 403);
	}

	await next();
};

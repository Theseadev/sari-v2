// src/services/openlibrary.ts — OpenLibrary API client
// Ponytail: fetch wrapper, no dependencies

const BASE = "https://openlibrary.org";
const COVERS = "https://covers.openlibrary.org/b";

/** Convert plain text with newlines to double-newline paragraphs for textarea */
function formatDescription(text: string): string {
	return text
		.trim()
		.replace(/\(penutup (depan|belakang)\)/gi, "")
		.split(/\r?\n/)
		.filter((p) => p.trim())
		.map((p) => p.trim())
		.join("\n\n");
}


export interface OLSearchResult {
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	publisher?: string[];
	isbn?: string[];
	cover_i?: number;
	key: string;
	subtitle?: string;
	language?: string[];
}

export interface OLBookData {
	title: string;
	author: string;
	publisher: string;
	publication_year: number;
	isbn: string;
	description: string;
	cover_id: number | null;
	cover_image: string | null;
}

/** Translate text to Indonesian via free Google Translate API (no key needed) */
export async function translateToId(text: string): Promise<string> {
	if (!text || text.length < 10) return text;
	try {
		const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text.slice(0, 3000))}`;
		const res = await fetch(url);
		if (!res.ok) return text;
		const data = await res.json();
		return data?.[0]?.map((s: any) => s[0]).join("") || text;
	} catch {
		return text;
	}
}

/** Search books by query */
export async function searchBooks(
	q: string,
	limit = 10,
): Promise<OLSearchResult[]> {
	const url = `${BASE}/search.json?q=${encodeURIComponent(q)}&limit=${limit}`;
	const res = await fetch(url);
	if (!res.ok) return [];
	const data = await res.json();
	return data.docs || [];
}

/** Get book data by ISBN */
export async function getByIsbn(isbn: string): Promise<OLBookData | null> {
	// First try the books API
	const url = `${BASE}/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
	const res = await fetch(url);
	if (!res.ok) return null;
	const data = await res.json();
	const key = `ISBN:${isbn}`;
	const book = data[key];
	if (!book) return null;

	// Try to get description from works API using book key
	let description = "";
	if (book.key) {
		try {
			const wRes = await fetch(`${BASE}${book.key}.json`);
			if (wRes.ok) {
				const wData = await wRes.json();
				if (typeof wData.description === "string") {
					description = formatDescription(wData.description.slice(0, 2000));
				} else if (wData.description?.value) {
					description = formatDescription(wData.description.value.slice(0, 2000));
				}
			}
		} catch {}
	}

	// Fallback: try works API directly from ISBN search
	if (!description) {
		try {
			const searchRes = await fetch(`${BASE}/search.json?q=isbn:${isbn}&limit=1`);
			if (searchRes.ok) {
				const searchData = await searchRes.json();
				if (searchData.docs?.[0]?.key) {
					const wRes = await fetch(`${BASE}${searchData.docs[0].key}.json`);
					if (wRes.ok) {
						const wData = await wRes.json();
						if (typeof wData.description === "string") {
							description = formatDescription(wData.description.slice(0, 2000));
						} else if (wData.description?.value) {
							description = formatDescription(wData.description.value.slice(0, 2000));
						}
					}
				}
			}
		} catch {}
	}

	// Auto-translate description to Indonesian
	if (description) description = await translateToId(description);

	return {
		title: book.title || "",
		author: book.authors?.map((a: any) => a.name).join(", ") || "",
		publisher: book.publishers?.map((p: any) => p.name).join(", ") || "",
		publication_year: book.publish_date ? parseInt(book.publish_date, 10) : 0,
		isbn,
		description,
		cover_id: book.cover?.id || null,
		cover_image: null,
	};
}

/** Search by ISBN (fallback: search API) */
export async function searchByIsbn(isbn: string): Promise<OLBookData | null> {
	// First try exact ISBN lookup
	const exact = await getByIsbn(isbn);
	if (exact && exact.title) return exact;

	// Fallback: search API with ISBN
	const results = await searchBooks(isbn, 1);
	if (results.length === 0) return null;
	const r = results[0];
	const desc = r.subtitle || "";
	return {
		title: r.title || "",
		author: r.author_name?.join(", ") || "",
		publisher: r.publisher?.join(", ") || "",
		publication_year: r.first_publish_year || 0,
		isbn: r.isbn?.[0] || isbn,
		description: desc ? await translateToId(desc) : "",
		cover_id: r.cover_i || null,
		cover_image: null,
	};
}

/** Download cover from OpenLibrary, save to disk, return local filename */
export async function downloadCover(
	isbn: string,
): Promise<string | null> {
	try {
		const url = `${COVERS}/isbn/${isbn}-L.jpg`;
		const res = await fetch(url);
		if (!res.ok || !res.headers.get("content-type")?.startsWith("image/"))
			return null;
		const buf = Buffer.from(await res.arrayBuffer());
		const { writeFile, mkdir } = await import("node:fs/promises");
		const { join } = await import("node:path");
		const dir = join(process.cwd(), "public", "uploads", "covers");
		await mkdir(dir, { recursive: true });
		const filename = `ol-${isbn}.jpg`;
		await writeFile(join(dir, filename), buf);
		return filename;
	} catch {
		return null;
	}
}

/** Get cover image URL */
export function getCoverUrl(
	coverId: number | null,
	size: "S" | "M" | "L" = "M",
): string | null {
	if (!coverId) return null;
	return `${COVERS}/id/${coverId}-${size}.jpg`;
}

/** Get cover URL by ISBN */
export function getCoverUrlByIsbn(
	isbn: string,
	size: "S" | "M" | "L" = "M",
): string {
	return `${COVERS}/isbn/${isbn}-${size}.jpg`;
}
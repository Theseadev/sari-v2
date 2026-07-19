// scripts/generate-assets.ts — Generate cover SVG & sample PDFs
import { mkdirSync, writeFileSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const COVERS_DIR = "public/uploads/covers";
const PDFS_DIR = "storage/pdfs";

const books = [
	{
		slug: "pengaruh-implementasi-smart-city",
		title:
			"Pengaruh Implementasi Smart City terhadap Kualitas Hidup Masyarakat Perkotaan",
		author: "Muhammad Al-Fatih",
		category: "Skripsi",
		file: "skripsi/smart-city-alfatih-2024.pdf",
		cover: "smart-city-cover.svg",
		color1: "#1a365d",
		color2: "#2563eb",
		pages: 120,
	},
	{
		slug: "pemrograman-web-modern-php-8",
		title: "Pemrograman Web Modern dengan PHP 8",
		author: "Andi Hakim",
		category: "Referensi Umum",
		file: "referensi/php8-web-hakim-2023.pdf",
		cover: "php8-cover.svg",
		color1: "#065f46",
		color2: "#059669",
		pages: 350,
	},
	{
		slug: "algoritma-struktur-data-pemula",
		title: "Algoritma dan Struktur Data untuk Pemula",
		author: "Dr. Rina Wijaya, M.Kom",
		category: "Buku Ajar",
		file: "buku-ajar/algoritma-wijaya-2024.pdf",
		cover: "algoritma-cover.svg",
		color1: "#7c2d12",
		color2: "#d97706",
		pages: 280,
	},
	{
		slug: "sejarah-peradaban-islam-nusantara",
		title: "Sejarah Peradaban Islam Nusantara",
		author: "Prof. Dr. H. Abdullah Karim, M.Ag",
		category: "Referensi Umum",
		file: "referensi/sejarah-islam-karim-2022.pdf",
		cover: "sejarah-cover.svg",
		color1: "#4c1d95",
		color2: "#7c3aed",
		pages: 410,
	},
];

// ── Generate SVG Covers ──
for (const b of books) {
	const lines = wrapText(b.title, 28);
	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640" width="480" height="640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${b.color1}"/>
      <stop offset="100%" stop-color="${b.color2}"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="480" height="640" fill="url(#bg)" rx="8"/>
  <!-- Decorative elements -->
  <circle cx="440" cy="-20" r="160" fill="rgba(255,255,255,0.04)"/>
  <circle cx="-40" cy="580" r="200" fill="rgba(255,255,255,0.04)"/>
  <!-- Top bar -->
  <rect x="30" y="30" width="420" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <!-- Book icon -->
  <text x="240" y="140" text-anchor="middle" font-size="64" fill="rgba(255,255,255,0.15)">&#x1F4D6;</text>
  <!-- Title -->
  <text x="240" y="240" text-anchor="middle" font-family="Georgia,serif" font-size="32" font-weight="bold" fill="#fff" letter-spacing="1">${escapeXml(lines[0])}</text>
  ${lines
		.slice(1)
		.map(
			(l, i) =>
				`<text x="240" y="${280 + i * 42}" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="rgba(255,255,255,0.95)" letter-spacing="0.5">${escapeXml(l)}</text>`,
		)
		.join("")}
  <!-- Divider -->
  <line x1="160" y1="380" x2="320" y2="380" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <!-- Author -->
  <text x="240" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="rgba(255,255,255,0.7)">${escapeXml(b.author)}</text>
  <!-- Category badge -->
  <rect x="180" y="450" width="120" height="30" rx="15" fill="rgba(255,255,255,0.12)"/>
  <text x="240" y="470" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="rgba(255,255,255,0.8)" font-weight="bold">${escapeXml(b.category.toUpperCase())}</text>
  <!-- Bottom bar -->
  <rect x="30" y="600" width="420" height="3" fill="rgba(255,255,255,0.3)" rx="1.5"/>
  <text x="240" y="620" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.35)">UNIVERSITAS SARI MULIA</text>
</svg>`;
	writeFileSync(`${COVERS_DIR}/${b.cover}`, svg);
	console.log(`✅ Cover: ${b.cover}`);
}

// ── Generate Sample PDFs ──
async function generatePDFs() {
	for (const b of books) {
		const pdfDoc = await PDFDocument.create();
		const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
		const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

		const pageCount = Math.min(b.pages, 30); // generate max 30 pages for demo
		for (let i = 1; i <= pageCount; i++) {
			const page = pdfDoc.addPage([480, 720]);
			const { width, height } = page.getSize();

			// Header
			page.drawText(b.title, {
				x: 40,
				y: height - 50,
				size: 14,
				font: fontBold,
				color: rgb(0.1, 0.1, 0.1),
			});
			page.drawLine({
				start: { x: 40, y: height - 60 },
				end: { x: width - 40, y: height - 60 },
				thickness: 0.5,
				color: rgb(0.7, 0.7, 0.7),
			});

			// Page number
			page.drawText(`— ${i} —`, {
				x: width / 2 - 15,
				y: 30,
				size: 10,
				font,
				color: rgb(0.6, 0.6, 0.6),
			});

			// Content
			const text = generateLorem(b.title, i);
			const lines = wrapTextPdf(text, 70);
			let y = height - 100;
			for (const line of lines) {
				if (y < 60) break;
				page.drawText(line, {
					x: 40,
					y,
					size: 11,
					font,
					color: rgb(0.2, 0.2, 0.2),
				});
				y -= 18;
			}
		}

		const pdfBytes = await pdfDoc.save();
		const dir = PDFS_DIR + "/" + b.file.substring(0, b.file.lastIndexOf("/"));
		mkdirSync(dir, { recursive: true });
		writeFileSync(PDFS_DIR + "/" + b.file, pdfBytes);
		console.log(`✅ PDF (${pageCount} hlm): ${b.file}`);
	}
}

function generateLorem(title: string, page: number): string {
	const paragraphs = [
		`Bab ${page} — ${title}`,
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
		"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
		"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
		"Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
	];
	const content: string[] = [];
	for (const p of paragraphs) {
		content.push(p);
		content.push("");
	}
	content.push(`— Halaman ${page} —`);
	return content.join("\n");
}

function wrapTextPdf(text: string, maxChars: number): string[] {
	const lines: string[] = [];
	for (const p of text.split("\n")) {
		if (p === "") {
			lines.push("");
			continue;
		}
		let words = p.split(" ");
		let current = "";
		for (const w of words) {
			if ((current + " " + w).trim().length > maxChars) {
				lines.push(current.trim());
				current = w;
			} else {
				current += (current ? " " : "") + w;
			}
		}
		if (current.trim()) lines.push(current.trim());
	}
	return lines;
}

function wrapText(text: string, maxLen: number): string[] {
	const words = text.split(" ");
	const lines: string[] = [];
	let cur = "";
	for (const w of words) {
		if ((cur + " " + w).length > maxLen) {
			lines.push(cur.trim());
			cur = w;
		} else {
			cur += (cur ? " " : "") + w;
		}
	}
	if (cur.trim()) lines.push(cur.trim());
	return lines.slice(0, 3); // max 3 lines
}

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

mkdirSync(COVERS_DIR, { recursive: true });
generatePDFs().then(() => console.log("\n🎉 Semua aset berhasil dibuat!"));

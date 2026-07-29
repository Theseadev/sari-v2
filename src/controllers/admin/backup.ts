// src/controllers/admin/backup.ts — Database Backup (super_admin only)

import { exec } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Context } from "hono";
import * as archiver from "archiver";
import { createWriteStream } from "node:fs";
import { utils, write } from "xlsx";
import { DB } from "../../config/app";
import { query } from "../../config/database";
import { getUser } from "../../helpers";
import { adminLayout } from "../../views/admin/helpers";
import { csrfToken } from "../../views/html";
import { setFlash } from "../flash";

const execAsync = promisify(exec);

const BACKUP_DIR = join(process.cwd(), "storage", "backups");
const COVERS_DIR = join(process.cwd(), "public", "uploads", "covers");
const PDFS_DIR = join(process.cwd(), "storage", "pdfs");
if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

const MYSQL_BIN = "C:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin";
const MYSQLDUMP = join(MYSQL_BIN, "mysqldump.exe");
const MYSQL = join(MYSQL_BIN, "mysql.exe");

function checkAccess(c: Context) {
	const user = getUser(c);
	if (user?.roleName !== "super_admin") {
		c.redirect("/admin");
		return null;
	}
	return user;
}

// ── Page ──
export async function page(c: Context) {
	const user = checkAccess(c);
	if (!user) return c.redirect("/admin");

	const backups = readdirSync(BACKUP_DIR)
		.filter((f) => f.endsWith(".sql") || f.endsWith(".zip"))
		.map((f) => {
			const stat = statSync(join(BACKUP_DIR, f));
			return {
				name: f,
				size: formatSize(stat.size),
				date: stat.mtime.toLocaleString("id-ID"),
			};
		})
		.sort((a, b) => b.date.localeCompare(a.date));

	const csrf = csrfToken();

	const body = `
<style>
  .backup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; }
  .backup-card { background: var(--card-bg, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; padding: 20px; }
  .backup-card h3 { margin: 0 0 12px; font-size: 0.95rem; }
  .backup-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
  .backup-btn.export { background: #10b981; color: #fff; }
  .backup-btn.export:hover { background: #059669; }
  .backup-btn.import { background: #6366f1; color: #fff; }
  .backup-btn.import:hover { background: #4f46e5; }
  .backup-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .backup-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .backup-table th, .backup-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border, #e5e7eb); }
  .backup-table th { font-weight: 600; font-size: 0.8rem; color: var(--text-muted, #6b7280); }
  .btn-sm { padding: 4px 10px; font-size: 0.8rem; border-radius: 4px; border: none; cursor: pointer; }
  .btn-download { background: #3b82f6; color: #fff; }
  .btn-delete { background: #ef4444; color: #fff; }
  .upload-zone { border: 2px dashed var(--border, #d1d5db); border-radius: 8px; padding: 28px; text-align: center; cursor: pointer; transition: border-color 0.15s; margin-bottom: 10px; }
  .upload-zone:hover, .upload-zone.dragover { border-color: #6366f1; }
  .upload-zone input { display: none; }
  @media (max-width: 768px) { .backup-grid { grid-template-columns: 1fr; } }
</style>

<h2 style="margin:0 0 4px">Backup Database</h2>

<div class="backup-grid">
  <div class="backup-card">
    <h3>Ekspor</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <form method="POST" action="/admin/backup/export">
        <input type="hidden" name="_csrf" value="${esc(csrf)}">
        <input type="hidden" name="format" value="sql">
        <button type="submit" class="backup-btn export">SQL</button>
      </form>
      <form method="POST" action="/admin/backup/export">
        <input type="hidden" name="_csrf" value="${esc(csrf)}">
        <input type="hidden" name="format" value="zip">
        <button type="submit" class="backup-btn export">ZIP</button>
      </form>
    </div>
    <small style="color:var(--text-muted,#6b7280);margin-top:8px;display:block">SQL: database saja. ZIP: cover + buku + excel.</small>
  </div>

  <div class="backup-card">
    <h3>Impor</h3>
    <form method="POST" action="/admin/backup/import" enctype="multipart/form-data" id="importForm">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <div class="upload-zone" id="uploadZone">
        <input type="file" name="backup" id="backupFile" accept=".sql">
        <div style="color:var(--text-muted,#6b7280);font-size:0.9rem">Pilih file .sql</div>
      </div>
      <button type="submit" class="backup-btn import" id="importBtn" disabled>Import</button>
    </form>
    <small style="color:#b45309">Import menimpa data existing.</small>
  </div>
</div>

${
	backups.length > 0
		? `
<h3 style="margin:20px 0 8px;font-size:0.95rem">Backup Tersimpan</h3>
<table class="backup-table">
  <thead>
    <tr><th>File</th><th>Ukuran</th><th>Tanggal</th><th></th></tr>
  </thead>
  <tbody>
    ${backups
			.map(
				(b) => `
      <tr>
        <td>${esc(b.name)}</td>
        <td>${esc(b.size)}</td>
        <td>${esc(b.date)}</td>
        <td style="white-space:nowrap">
          <a href="/admin/backup/download/${encodeURIComponent(b.name)}" class="btn-sm btn-download">Download</a>
          <form method="POST" action="/admin/backup/delete" style="display:inline" onsubmit="return confirm('Hapus ${esc(b.name)}?')">
            <input type="hidden" name="_csrf" value="${esc(csrf)}">
            <input type="hidden" name="file" value="${esc(b.name)}">
            <button type="submit" class="btn-sm btn-delete">Hapus</button>
          </form>
        </td>
      </tr>`,
			)
			.join("")}
  </tbody>
</table>
`
		: ""
}

<script>
const zone = document.getElementById('uploadZone');
const fileInput = document.getElementById('backupFile');
const importBtn = document.getElementById('importBtn');

zone.addEventListener('click', () => fileInput.click());
zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
zone.addEventListener('drop', (e) => {
  e.preventDefault();
  zone.classList.remove('dragover');
  fileInput.files = e.dataTransfer.files;
  updateZone();
});
fileInput.addEventListener('change', updateZone);

function updateZone() {
  if (fileInput.files.length > 0) {
    const f = fileInput.files[0];
    zone.innerHTML = '<input type="file" name="backup" id="backupFile" accept=".sql" style="display:none">' +
      '<div style="color:var(--text-muted,#6b7280);font-size:0.9rem"><strong>' + f.name + '</strong> (' + formatSize(f.size) + ')</div>';
    importBtn.disabled = false;
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
</script>
`;

	return c.html(
		adminLayout(
			"Backup",
			body,
			{ name: user.name, roleName: user.roleName },
			"backup",
		),
	);
}

// ── Export ──
export async function exportBackup(c: Context) {
	const user = checkAccess(c);
	if (!user) return c.redirect("/admin");

	const format = (await c.req.parseBody()).format === "zip" ? "zip" : "sql";
	const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
	const filename = `sari-backup-${ts}`;

	try {
		const dumpFile = join(BACKUP_DIR, `${filename}.sql`);
		const dumpCmd = `"${MYSQLDUMP}" -h ${DB.host} -P ${DB.port} -u ${DB.user}${DB.password ? ` -p${DB.password}` : ""} ${DB.database} > "${dumpFile}"`;
		await execAsync(dumpCmd, { timeout: 120000 });

		if (format === "zip") {
			const zipFile = join(BACKUP_DIR, `${filename}.zip`);

			// Query all books for excel
			const books = await query<BookRow[]>(
				`SELECT b.title, b.author, b.synopsis, b.publisher, b.year, b.isbn,
				 p.name AS program_study, b.access_type, b.pdf_filename, b.cover_image
				 FROM books b
				 LEFT JOIN programs p ON p.id = b.program_id
				 ORDER BY b.title`,
			);

			// Create excel in memory
			const excelData = books.map((b) => ({
				Judul: b.title || "",
				Penulis: b.author || "",
				Sinopsis: b.synopsis || "",
				Penerbit: b.publisher || "",
				Tahun: b.year || "",
				ISBN: b.isbn || "",
				"Program Studi": b.program_study || "",
				Akses: b.access_type || "public",
				"File PDF": b.pdf_filename || "",
				Cover: b.cover_image || "",
			}));
			const ws = utils.json_to_sheet(excelData);
			const wb = utils.book_new();
			utils.book_append_sheet(wb, ws, "Buku");
			const xlsxBuf = write(wb, { type: "buffer", bookType: "xlsx" });

			// Create ZIP with archiver
			await new Promise<void>((resolve, reject) => {
				const output = createWriteStream(zipFile);
				const archive = archiver("zip", { zlib: { level: 1 } }); // level 1 = fast

				output.on("close", () => resolve());
				archive.on("error", reject);

				archive.pipe(output);

				// Add SQL dump
				archive.file(dumpFile, { name: `${filename}.sql` });

				// Add excel
				archive.append(xlsxBuf, { name: "excel/data-buku.xlsx" });

				// Add covers
				if (existsSync(COVERS_DIR)) {
					archive.directory(COVERS_DIR, "Cover");
				}

				// Add pdfs
				if (existsSync(PDFS_DIR)) {
					archive.directory(PDFS_DIR, "Buku");
				}

				archive.finalize();
			});

			// Cleanup SQL dump (ZIP already contains it)
			unlinkSync(dumpFile);

			await query(
				`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
				[
					user.userId,
					"backup_export",
					`Export ZIP: ${filename}.zip`,
					c.req.header("x-forwarded-for") || "local",
				],
			);
		} else {
			await query(
				`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
				[
					user.userId,
					"backup_export",
					`Export SQL: ${filename}.sql`,
					c.req.header("x-forwarded-for") || "local",
				],
			);
		}

		return c.redirect("/admin/backup");
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		setFlash(c, `Gagal export: ${msg.slice(0, 200)}`, "danger");
		return c.redirect("/admin/backup");
	}
}

type BookRow = {
	title: string;
	author: string;
	synopsis: string;
	publisher: string;
	year: string;
	isbn: string;
	program_study: string;
	access_type: string;
	pdf_filename: string;
	cover_image: string;
};

// ── Download ──
export async function download(c: Context) {
	const user = checkAccess(c);
	if (!user) return c.redirect("/admin");

	const file = c.req.param("file");
	if (!file) return c.redirect("/admin/backup");

	const filePath = join(BACKUP_DIR, file);
	if (!existsSync(filePath) || !filePath.startsWith(BACKUP_DIR)) {
		setFlash(c, "File tidak ditemukan.", "danger");
		return c.redirect("/admin/backup");
	}

	const data = readFileSync(filePath);
	const mime = file.endsWith(".zip") ? "application/zip" : "text/sql";

	return new Response(data, {
		headers: {
			"Content-Type": mime,
			"Content-Disposition": `attachment; filename="${file}"`,
		},
	});
}

// ── Delete ──
export async function remove(c: Context) {
	const user = checkAccess(c);
	if (!user) return c.redirect("/admin");

	const body = await c.req.parseBody();
	const file = String(body.file || "");
	const filePath = join(BACKUP_DIR, file);

	if (!file || !existsSync(filePath) || !filePath.startsWith(BACKUP_DIR)) {
		setFlash(c, "File tidak ditemukan.", "danger");
		return c.redirect("/admin/backup");
	}

	unlinkSync(filePath);

	await query(
		`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
		[
			user.userId,
			"backup_delete",
			`Hapus backup: ${file}`,
			c.req.header("x-forwarded-for") || "local",
		],
	);

	setFlash(c, `Backup "${file}" dihapus.`, "success");
	return c.redirect("/admin/backup");
}

// ── Import (SQL only) ──
export async function importBackup(c: Context) {
	const user = checkAccess(c);
	if (!user) return c.redirect("/admin");

	try {
		const formData = await c.req.formData();
		const file = formData.get("backup") as File | null;

		if (!file || file.size === 0) {
			setFlash(c, "Pilih file backup.", "danger");
			return c.redirect("/admin/backup");
		}

		if (file.size > 50 * 1024 * 1024) {
			setFlash(c, "Ukuran file maksimal 50MB.", "danger");
			return c.redirect("/admin/backup");
		}

		if (!file.name.toLowerCase().endsWith(".sql")) {
			setFlash(c, "Format harus .sql", "danger");
			return c.redirect("/admin/backup");
		}

		const tmpFile = join(BACKUP_DIR, `_import_${Date.now()}.sql`);
		const arrayBuf = await file.arrayBuffer();
		writeFileSync(tmpFile, Buffer.from(arrayBuf));

		const importCmd = `"${MYSQL}" -h ${DB.host} -P ${DB.port} -u ${DB.user}${DB.password ? ` -p${DB.password}` : ""} ${DB.database} < "${tmpFile}"`;
		await execAsync(importCmd, { timeout: 300000 });

		try {
			unlinkSync(tmpFile);
		} catch {}

		await query(
			`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
			[
				user.userId,
				"backup_import",
				`Import: ${file.name}`,
				c.req.header("x-forwarded-for") || "local",
			],
		);

		setFlash(c, `Import dari "${file.name}" berhasil.`, "success");
		return c.redirect("/admin/backup");
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		setFlash(c, `Gagal import: ${msg.slice(0, 200)}`, "danger");
		return c.redirect("/admin/backup");
	}
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1048576).toFixed(1)} MB`;
}

function esc(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

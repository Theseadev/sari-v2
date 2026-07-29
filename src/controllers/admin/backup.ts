// src/controllers/admin/backup.ts — Database Backup & Export (super_admin only)

import { exec } from "node:child_process";
import {
	cpSync,
	createWriteStream,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { ZipArchive } from "archiver";
import type { Context } from "hono";
import { utils, write } from "xlsx";
import { DB } from "../../config/app";
import { query } from "../../config/database";
import { getFlash, getUser } from "../../helpers";
import { adminLayout } from "../../views/admin/helpers";
import { csrfToken } from "../../views/html";
import { setFlash } from "../flash";

const execAsync = promisify(exec);

const BACKUP_DIR = join(process.cwd(), "storage", "backups");
const COVERS_DIR = join(process.cwd(), "public", "uploads", "covers");
const PDFS_DIR = join(process.cwd(), "storage", "pdfs");
if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

function getMysqlBin(): { dump: string; mysql: string } {
	const candidates = [
		"C:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin",
		"C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin",
	];
	for (const dir of candidates) {
		const dumpPath = join(dir, "mysqldump.exe");
		if (existsSync(dumpPath)) {
			return { dump: dumpPath, mysql: join(dir, "mysql.exe") };
		}
	}
	return { dump: "mysqldump", mysql: "mysql" };
}

const SEVEN_ZIP = "C:\\laragon\\bin\\laragon\\utils\\7z.exe";

const FORMAT_OPTIONS = [
	{ value: "zip", label: "ZIP Archive (.zip)", ext: "zip" },
	{ value: "sql", label: "SQL Dump (.sql)", ext: "sql" },
	{ value: "rar", label: "RAR Archive (.rar)", ext: "rar" },
	{ value: "7z", label: "7-Zip Archive (.7z)", ext: "7z" },
	{ value: "tar", label: "TAR Archive (.tar)", ext: "tar" },
	{ value: "bzip2", label: "BZIP2 Compressed (.bz2)", ext: "bz2" },
	{ value: "gzip", label: "GZIP Compressed (.gz)", ext: "gz" },
	{ value: "xz", label: "XZ Compressed (.xz)", ext: "xz" },
	{ value: "lz4", label: "LZ4 Compressed (.lz4)", ext: "lz4" },
	{ value: "zstd", label: "ZSTD Compressed (.zst)", ext: "zst" },
	{ value: "tar.bz2", label: "TAR.BZ2 Compressed (.tar.bz2)", ext: "tar.bz2" },
	{ value: "tar.gz", label: "TAR.GZ Compressed (.tar.gz)", ext: "tar.gz" },
];

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

	const flash = getFlash(c);

	const backups = readdirSync(BACKUP_DIR)
		.filter((f) => {
			const p = join(BACKUP_DIR, f);
			try {
				const s = statSync(p);
				return s.isFile() && !f.startsWith("_");
			} catch {
				return false;
			}
		})
		.map((f) => {
			const stat = statSync(join(BACKUP_DIR, f));
			return {
				name: f,
				size: formatSize(stat.size),
				date: stat.mtime.toLocaleString("id-ID"),
				mtimeMs: stat.mtimeMs,
			};
		})
		.sort((a, b) => b.mtimeMs - a.mtimeMs);

	const csrf = csrfToken();

	const body = `
<style>
  .backup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; }
  .backup-card { background: var(--card-bg, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; padding: 20px; }
  .backup-card h3 { margin: 0 0 12px; font-size: 0.95rem; }
  .backup-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.88rem; transition: background 0.15s; }
  .backup-btn.export { background: #10b981; color: #fff; }
  .backup-btn.export:hover { background: #059669; }
  .backup-btn.import { background: #6366f1; color: #fff; }
  .backup-btn.import:hover { background: #4f46e5; }
  .backup-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .backup-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .backup-table th, .backup-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border, #e5e7eb); }
  .backup-table th { font-weight: 600; font-size: 0.8rem; color: var(--text-muted, #6b7280); }
  .btn-sm { padding: 4px 10px; font-size: 0.8rem; border-radius: 4px; border: none; cursor: pointer; text-decoration: none; display: inline-block; }
  .btn-download { background: #3b82f6; color: #fff; }
  .btn-download:hover { background: #2563eb; }
  .btn-delete { background: #ef4444; color: #fff; }
  .btn-delete:hover { background: #dc2626; }
  .upload-zone { border: 2px dashed var(--border, #d1d5db); border-radius: 8px; padding: 28px; text-align: center; cursor: pointer; transition: border-color 0.15s; margin-bottom: 10px; }
  .upload-zone:hover, .upload-zone.dragover { border-color: #6366f1; }
  .upload-zone input { display: none; }
  .alert-banner { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: 500; font-size: 0.9rem; }
  .alert-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .alert-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
  @media (max-width: 768px) { .backup-grid { grid-template-columns: 1fr; } }
</style>

<h2 style="margin:0 0 12px">Backup Database</h2>

${
	flash
		? `<div class="alert-banner alert-${flash.type === "danger" ? "danger" : "success"}">${esc(flash.message)}</div>`
		: ""
}

<div class="backup-grid">
  <div class="backup-card">
    <h3>Ekspor Backup</h3>
    <form method="POST" action="/admin/backup/export" style="margin-top:12px">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
        <select name="format" id="exportFormat" style="flex:1;min-width:200px;padding:9px 12px;border-radius:8px;border:1px solid var(--border,#d1d5db);font-size:0.9rem;background:var(--card-bg,#fff);color:var(--text,#1f2937);cursor:pointer">
          ${FORMAT_OPTIONS.map(
						(opt) =>
							`<option value="${opt.value}" ${opt.value === "zip" ? "selected" : ""}>${esc(opt.label)}${opt.value === "zip" ? " (Default)" : ""}</option>`,
					).join("")}
        </select>
        <button type="submit" class="backup-btn export">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Ekspor
        </button>
      </div>
    </form>
    <small style="color:var(--text-muted,#6b7280);line-height:1.4;display:block">
      • <strong>ZIP (Default)</strong>: Paket lengkap (Database SQL + Cover + Buku PDF + Data Excel).<br>
      • <strong>Opsi Lain</strong>: .sql, .rar, .7z, .tar, .tar.gz, .tar.bz2, .gz, .bz2, .xz, .zst, .lz4.
    </small>
  </div>

  <div class="backup-card">
    <h3>Impor</h3>
    <form method="POST" action="/admin/backup/import" enctype="multipart/form-data" id="importForm">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <div class="upload-zone" id="uploadZone">
        <input type="file" name="backup" id="backupFile" accept=".sql,.zip">
        <div style="color:var(--text-muted,#6b7280);font-size:0.9rem">Pilih file .sql atau .zip</div>
      </div>
      <button type="submit" class="backup-btn import" id="importBtn" disabled>Import</button>
    </form>
    <small style="color:#b45309;display:block;margin-top:8px">Import menimpa data existing.</small>
  </div>
</div>

${
	backups.length > 0
		? `
<h3 style="margin:24px 0 8px;font-size:0.95rem">Backup Tersimpan</h3>
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
    zone.innerHTML = '<input type="file" name="backup" id="backupFile" accept=".sql,.zip" style="display:none">' +
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

	const body = await c.req.parseBody();
	const selectedFormat = String(body.format || "zip").toLowerCase();
	const fmt =
		FORMAT_OPTIONS.find((f) => f.value === selectedFormat) || FORMAT_OPTIONS[0];

	const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
	const baseName = `sari-backup-${ts}`;
	const outFilename = `${baseName}.${fmt.ext}`;
	const outFile = join(BACKUP_DIR, outFilename);

	const tmpDir = join(BACKUP_DIR, `_tmp_${ts}`);
	if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

	const { dump } = getMysqlBin();

	try {
		const dumpFile = join(tmpDir, `${baseName}.sql`);
		const passArg = DB.password ? ` "-p${DB.password}"` : "";
		const dumpCmd = `"${dump}" -h ${DB.host} -P ${DB.port} -u ${DB.user}${passArg} ${DB.database} > "${dumpFile}"`;
		await execAsync(dumpCmd, { timeout: 120000 });

		if (fmt.value === "sql") {
			writeFileSync(outFile, readFileSync(dumpFile));
		} else {
			// Query all books for Excel export
			const books = await query<BookRow[]>(
				`SELECT b.title, b.author, b.description AS synopsis, b.publisher,
				 b.publication_year AS year, b.isbn, p.name AS program_study,
				 b.access_type, b.file_path AS pdf_filename, b.cover_image
				 FROM books b
				 LEFT JOIN programs p ON p.id = b.program_id
				 ORDER BY b.title`,
			);

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
			const excelDir = join(tmpDir, "excel");
			if (!existsSync(excelDir)) mkdirSync(excelDir, { recursive: true });
			const xlsxBuf = write(wb, { type: "buffer", bookType: "xlsx" });
			writeFileSync(join(excelDir, "data-buku.xlsx"), xlsxBuf);

			if (existsSync(COVERS_DIR)) {
				const coverDest = join(tmpDir, "Cover");
				mkdirSync(coverDest, { recursive: true });
				cpSync(COVERS_DIR, coverDest, { recursive: true });
			}

			if (existsSync(PDFS_DIR)) {
				const pdfDest = join(tmpDir, "Buku");
				mkdirSync(pdfDest, { recursive: true });
				cpSync(PDFS_DIR, pdfDest, { recursive: true });
			}

			const has7z = existsSync(SEVEN_ZIP);

			if (has7z) {
				if (fmt.value === "zip" || fmt.value === "rar" || fmt.value === "lz4") {
					await execAsync(`"${SEVEN_ZIP}" a -tzip "${outFile}" .`, {
						cwd: tmpDir,
					});
				} else if (fmt.value === "7z") {
					await execAsync(`"${SEVEN_ZIP}" a -t7z "${outFile}" .`, {
						cwd: tmpDir,
					});
				} else if (fmt.value === "tar") {
					await execAsync(`"${SEVEN_ZIP}" a -ttar "${outFile}" .`, {
						cwd: tmpDir,
					});
				} else if (fmt.value === "tar.gz" || fmt.value === "gzip") {
					const tarPath = join(tmpDir, "_tmp.tar");
					await execAsync(`"${SEVEN_ZIP}" a -ttar "${tarPath}" .`, {
						cwd: tmpDir,
					});
					await execAsync(`"${SEVEN_ZIP}" a -tgzip "${outFile}" "${tarPath}"`);
				} else if (fmt.value === "tar.bz2" || fmt.value === "bzip2") {
					const tarPath = join(tmpDir, "_tmp.tar");
					await execAsync(`"${SEVEN_ZIP}" a -ttar "${tarPath}" .`, {
						cwd: tmpDir,
					});
					await execAsync(`"${SEVEN_ZIP}" a -tbzip2 "${outFile}" "${tarPath}"`);
				} else if (fmt.value === "xz") {
					const tarPath = join(tmpDir, "_tmp.tar");
					await execAsync(`"${SEVEN_ZIP}" a -ttar "${tarPath}" .`, {
						cwd: tmpDir,
					});
					await execAsync(`"${SEVEN_ZIP}" a -txz "${outFile}" "${tarPath}"`);
				} else if (fmt.value === "zstd") {
					const tarPath = join(tmpDir, "_tmp.tar");
					await execAsync(`"${SEVEN_ZIP}" a -ttar "${tarPath}" .`, {
						cwd: tmpDir,
					});
					try {
						await execAsync(
							`"${SEVEN_ZIP}" a -tzstd "${outFile}" "${tarPath}"`,
						);
					} catch {
						await execAsync(`"${SEVEN_ZIP}" a -t7z "${outFile}" .`, {
							cwd: tmpDir,
						});
					}
				}
			} else {
				await createZipFallback(tmpDir, outFile, dumpFile, xlsxBuf, baseName);
			}
		}

		await query(
			`INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?,?,?,?)`,
			[
				user.userId,
				"backup_export",
				`Export ${fmt.label}: ${outFilename}`,
				c.req.header("x-forwarded-for") || "local",
			],
		);

		setFlash(
			c,
			`Backup ${fmt.label} (${outFilename}) berhasil dibuat.`,
			"success",
		);
		return c.redirect("/admin/backup");
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		setFlash(c, `Gagal export: ${msg.slice(0, 200)}`, "danger");
		return c.redirect("/admin/backup");
	} finally {
		if (existsSync(tmpDir)) {
			try {
				rmSync(tmpDir, { recursive: true, force: true });
			} catch {}
		}
	}
}

async function createZipFallback(
	tmpDir: string,
	outFile: string,
	dumpFile: string,
	xlsxBuf: Buffer,
	baseName: string,
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const output = createWriteStream(outFile);
		const archive = new ZipArchive({ zlib: { level: 1 } });

		output.on("close", () => resolve());
		archive.on("error", reject);

		archive.pipe(output);
		archive.file(dumpFile, { name: `${baseName}.sql` });
		archive.append(xlsxBuf, { name: "excel/data-buku.xlsx" });

		if (existsSync(COVERS_DIR)) archive.directory(COVERS_DIR, "Cover");
		if (existsSync(PDFS_DIR)) archive.directory(PDFS_DIR, "Buku");

		archive.finalize();
	});
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
	const mime = getMimeType(file);

	return new Response(data, {
		headers: {
			"Content-Type": mime,
			"Content-Disposition": `attachment; filename="${file}"`,
		},
	});
}

function getMimeType(file: string): string {
	const f = file.toLowerCase();
	if (f.endsWith(".sql")) return "text/plain";
	if (f.endsWith(".zip")) return "application/zip";
	if (f.endsWith(".rar")) return "application/vnd.rar";
	if (f.endsWith(".7z")) return "application/x-7z-compressed";
	if (f.endsWith(".tar")) return "application/x-tar";
	if (f.endsWith(".tar.gz") || f.endsWith(".tgz")) return "application/gzip";
	if (f.endsWith(".tar.bz2") || f.endsWith(".tbz2"))
		return "application/x-bzip2";
	if (f.endsWith(".gz") || f.endsWith(".gzip")) return "application/gzip";
	if (f.endsWith(".bz2") || f.endsWith(".bzip2")) return "application/x-bzip2";
	if (f.endsWith(".xz")) return "application/x-xz";
	if (f.endsWith(".zst") || f.endsWith(".zstd")) return "application/zstd";
	if (f.endsWith(".lz4")) return "application/x-lz4";
	return "application/octet-stream";
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

// ── Import (SQL / ZIP) ──
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

		const lowerName = file.name.toLowerCase();
		if (!lowerName.endsWith(".sql") && !lowerName.endsWith(".zip")) {
			setFlash(c, "Format harus .sql atau .zip", "danger");
			return c.redirect("/admin/backup");
		}

		const ts = Date.now();
		let targetSqlFile = join(BACKUP_DIR, `_import_${ts}.sql`);
		const arrayBuf = await file.arrayBuffer();

		if (lowerName.endsWith(".zip")) {
			const tmpZip = join(BACKUP_DIR, `_import_${ts}.zip`);
			const tmpUnzipDir = join(BACKUP_DIR, `_import_unzip_${ts}`);
			mkdirSync(tmpUnzipDir, { recursive: true });
			writeFileSync(tmpZip, Buffer.from(arrayBuf));

			try {
				await execAsync(`"${SEVEN_ZIP}" x "${tmpZip}" -o"${tmpUnzipDir}" -y`);
				const extractedFiles = readdirSync(tmpUnzipDir);
				const foundSql = extractedFiles.find((f) =>
					f.toLowerCase().endsWith(".sql"),
				);
				if (!foundSql) {
					throw new Error("File .sql tidak ditemukan di dalam archive ZIP.");
				}
				targetSqlFile = join(tmpUnzipDir, foundSql);
				try {
					unlinkSync(tmpZip);
				} catch {}
			} catch (unzipErr: any) {
				try {
					unlinkSync(tmpZip);
					rmSync(tmpUnzipDir, { recursive: true, force: true });
				} catch {}
				setFlash(c, `Gagal membaca file ZIP: ${unzipErr.message}`, "danger");
				return c.redirect("/admin/backup");
			}
		} else {
			writeFileSync(targetSqlFile, Buffer.from(arrayBuf));
		}

		const { mysql } = getMysqlBin();
		const passArg = DB.password ? ` "-p${DB.password}"` : "";
		const importCmd = `"${mysql}" -h ${DB.host} -P ${DB.port} -u ${DB.user}${passArg} ${DB.database} < "${targetSqlFile}"`;
		await execAsync(importCmd, { timeout: 300000 });

		try {
			unlinkSync(targetSqlFile);
			if (lowerName.endsWith(".zip")) {
				rmSync(join(BACKUP_DIR, `_import_unzip_${ts}`), {
					recursive: true,
					force: true,
				});
			}
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

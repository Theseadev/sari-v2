import { pool } from "../src/config/database";

async function seed() {
	console.log("⏳ Menghapus data lama...");
	await pool.execute("DELETE FROM books");
	await pool.execute("DELETE FROM programs");
	await pool.execute("DELETE FROM faculties");

	console.log("⏳ Insert faculties...");
	await pool.execute(`INSERT INTO faculties (id, name, slug, description) VALUES
		(1, 'Kesehatan', 'kesehatan', 'Fakultas Ilmu Kesehatan'),
		(2, 'Humaniora', 'humaniora', 'Fakultas Humaniora'),
		(3, 'Sains dan Teknologi', 'sains-dan-teknologi', 'Fakultas Sains dan Teknologi'),
		(4, 'Kedokteran Hewan', 'kedokteran-hewan', 'Fakultas Kedokteran Hewan')`);

	console.log("⏳ Insert programs...");
	await pool.execute(`INSERT INTO programs (id, faculty_id, name, slug) VALUES
		(1, 1, 'Kebidanan', 'kebidanan'),
		(2, 1, 'Keperawatan', 'keperawatan'),
		(3, 1, 'Farmasi', 'farmasi'),
		(4, 1, 'Terapan Promosi Kesehatan', 'terapan-promosi-kesehatan'),
		(5, 2, 'Sarjana Akuntansi', 'sarjana-akuntansi'),
		(6, 2, 'Sarjana Hukum', 'sarjana-hukum'),
		(7, 2, 'Sarjana Manajemen', 'sarjana-manajemen'),
		(8, 2, 'Pendidikan Bahasa Inggris', 'pendidikan-bahasa-inggris'),
		(9, 3, 'Sistem Informasi', 'sistem-informasi'),
		(10, 3, 'Teknik Industri', 'teknik-industri'),
		(11, 3, 'Teknologi Informasi', 'teknologi-informasi'),
		(12, 4, 'Kedokteran Hewan', 'kedokteran-hewan')`);

	console.log("✅ Seed selesai!");
	await pool.end();
}

seed().catch((e) => {
	console.error("❌", e.message);
	process.exit(1);
});

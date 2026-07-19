-- Seed 5 sample books for SARI v2
-- Run: mysql -u root sari_v2 < seed_books.sql

USE sari_v2;

-- Clear existing books (optional)
-- DELETE FROM books;

-- Book 1: Skripsi Kebidanan
INSERT INTO books (category_id, program_id, uploaded_by, title, slug, author, publisher, publication_year, isbn, description, access_type, file_path, cover_image, page_count, file_size, views, status) VALUES
(1, 1, 2, 'Analisis Faktor Risiko Kejadian Anemia pada Ibu Hamil Trimester III di Wilayah Kerja Puskesmas Banjarmasin Utara', 'analisis-faktor-risiko-anemia-ibu-hamil', 'Siti Aminah, S.ST., M.Keb.', 'Universitas Sari Mulia', 2023, '978-623-001-234-5', 'Skripsi ini menganalisis faktor-faktor risiko yang mempengaruhi kejadian anemia pada ibu hamil trimester III. Penelitian menggunakan desain cross-sectional dengan sampel 85 responden. Hasil menunjukkan prevalensi anemia 42,4% dengan faktor dominan adalah asupan zat besi (p=0,001) dan infeksi cacingan (p=0,023).', 'internal', 'skripsi/analisis-anemia-ibu-hamil.pdf', 'covers/sejarah-cover.svg', 87, 2457600, 127, 'active');

-- Book 2: Buku Ajar Keperawatan
INSERT INTO books (category_id, program_id, uploaded_by, title, slug, author, publisher, publication_year, isbn, description, access_type, file_path, cover_image, page_count, file_size, views, status) VALUES
(4, 2, 2, 'Asuhan Keperawatan Maternitas: Panduan Praktis untuk Mahasiswa & Praktisi', 'asuhan-keperawatan-maternitas', 'Dr. Rina Wijayanti, M.Kep., Sp.Mat', 'Penerbit Andi', 2022, '978-979-295-432-1', 'Buku ajar komprehensif yang mencakup asuhan keperawatan maternitas dari antenatal, intranatal, postnatal, hingga bayi baru lahir. Dilengkapi studi kasus, care plan, dan gambar ilustrasi prosedur klinis. Referensi wajib untuk mahasiswa Keperawatan dan Bidan.', 'public', 'buku-ajar/asuhan-keperawatan-maternitas.pdf', 'covers/algoritma-cover.svg', 342, 8923400, 342, 'active');

-- Book 3: Referensi Farmasi
INSERT INTO books (category_id, program_id, uploaded_by, title, slug, author, publisher, publication_year, isbn, description, access_type, file_path, cover_image, page_count, file_size, views, status) VALUES
(5, 3, 2, 'Farmakologi Klinis: Dasar-dasar Penggunaan Obat Rasional', 'farmakologi-klinis-penggunaan-obat-rasional', 'Prof. Dr. Andi Susilo, M.Farm., Apt.', 'Sagung Seto', 2023, '978-623-712-098-7', 'Buku referensi farmakologi klinis yang membahas mekanisme kerja, indikasi, kontraindikasi, efek samping, dan interaksi obat. Fokus pada pemilihan terapi rasional berdasarkan evidence-based medicine. Termasuk kasus nyata dan algoritma pengelolaan penyakit tropis.', 'public', 'referensi/farmakologi-klinis.pdf', 'covers/php8-cover.svg', 518, 12450000, 215, 'active');

-- Book 4: Skripsi Sistem Informasi
INSERT INTO books (category_id, program_id, uploaded_by, title, slug, author, publisher, publication_year, isbn, description, access_type, file_path, cover_image, page_count, file_size, views, status) VALUES
(1, 9, 2, 'Rancang Bangun Sistem Informasi Manajemen Perpustakaan Digital Berbasis Web pada Universitas Sari Mulia', 'sistem-informasi-perpustakaan-digital-web', 'Muhammad Rizki Pratama, S.Kom.', 'Universitas Sari Mulia', 2024, '978-623-112-456-7', 'Skripsi pengembangan sistem informasi perpustakaan digital dengan fitur: katalog online, peminjaman digital, manajemen koleksi, laporan statistik, dan integrasi QR code. Menggunakan Laravel + Vue.js, database MySQL, deployment Docker. Uji black-box 100% pass, UAT skor 4,8/5.', 'internal', 'skripsi/sistem-perpustakaan-digital.pdf', 'covers/smart-city-cover.svg', 124, 4120000, 89, 'active');

-- Book 5: Tesis Manajemen
INSERT INTO books (category_id, program_id, uploaded_by, title, slug, author, publisher, publication_year, isbn, description, access_type, file_path, cover_image, page_count, file_size, views, status) VALUES
(2, 7, 2, 'Pengaruh Gaya Kepemimpinan Transformasional dan Budaya Organisasi terhadap Kinerja Karyawan dengan Motivasi Kerja sebagai Variabel Mediasi', 'pengaruh-kepemimpinan-transformasional-kinerja-karyawan', 'Drs. Bambang Sutrisno, M.Si.', 'Universitas Sari Mulia', 2022, '978-979-102-789-3', 'Penelitian kuantitatif dengan pendekatan SEM-PLS pada 120 karyawan BUMD Kalimantan Selatan. Hasil: gaya kepemimpinan transformasional (β=0,341, p<0,05) dan budaya organisasi (β=0,287, p<0,05) berpengaruh positif signifikan terhadap kinerja. Motivasi kerja memediasi partial (VAF=42%).', 'public', 'tesis/kepemimpinan-transformasional.pdf', 'covers/sejarah-cover.svg', 178, 6780000, 156, 'active');
-- =====================================================
-- SARI v2 - Perpustakaan Digital Universitas Sari Mulia
-- Database Schema (DDL + Dummy Data)
-- Engine: InnoDB | Charset: utf8mb4
-- =====================================================

CREATE DATABASE IF NOT EXISTS sari_v2
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sari_v2;

-- -----------------------------------------------------
-- Tabel roles: RBAC level
-- -----------------------------------------------------
CREATE TABLE roles (
    id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL DEFAULT '',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO roles (id, name, description) VALUES
    (1, 'super_admin',  'Kontrol penuh sistem & manajemen admin'),
    (2, 'admin',        'Pustakawan — CRUD buku, kategori, user'),
    (3, 'mahasiswa',    'Mahasiswa — akses semua buku publik & internal'),
    (4, 'tamu',         'Masyarakat umum — hanya buku publik');

-- -----------------------------------------------------
-- Tabel users
-- -----------------------------------------------------
CREATE TABLE users (
    id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    role_id       TINYINT UNSIGNED NOT NULL,
    username      VARCHAR(100)    NOT NULL UNIQUE,
    name          VARCHAR(200)    NOT NULL,
    email         VARCHAR(200)    NOT NULL UNIQUE,
    password      VARCHAR(255)    NOT NULL,  -- bcrypt hash
    nim_nip       VARCHAR(50)     DEFAULT NULL,
    status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
    last_login    DATETIME        DEFAULT NULL,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

-- Password untuk semua dummy user: "password123" (bcrypt hash)
INSERT INTO users (role_id, username, name, email, password, nim_nip) VALUES
    (1, 'super',     'Super Administrator', 'super@uin-antasari.ac.id',
     '$2a$10$RRE7wuN1b3Pgx..R/w1gZOL9Aj4CKeN0dQKwt895cxYkK7pOBFK1m', '196001012010011001'),
    (2, 'pustakawan1', 'Ahmad Pustakawan', 'ahmad@uin-antasari.ac.id',
     '$2a$10$RRE7wuN1b3Pgx..R/w1gZOL9Aj4CKeN0dQKwt895cxYkK7pOBFK1m', '198503152015032001'),
    (3, 'mhs001',     'Budi Santoso', 'budi@student.uin-antasari.ac.id',
     '$2a$10$RRE7wuN1b3Pgx..R/w1gZOL9Aj4CKeN0dQKwt895cxYkK7pOBFK1m', '21010101001'),
    (3, 'mhs002',     'Siti Nurhaliza', 'siti@student.uin-antasari.ac.id',
     '$2a$10$RRE7wuN1b3Pgx..R/w1gZOL9Aj4CKeN0dQKwt895cxYkK7pOBFK1m', '21010101002'),
    (4, 'tamu01',     'Masyarakat Umum', 'umum@contoh.com',
     '$2a$10$RRE7wuN1b3Pgx..R/w1gZOL9Aj4CKeN0dQKwt895cxYkK7pOBFK1m', NULL);

-- -----------------------------------------------------
-- Tabel categories
-- -----------------------------------------------------
CREATE TABLE categories (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL UNIQUE,
    slug        VARCHAR(180)    NOT NULL UNIQUE,
    description TEXT            DEFAULT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO categories (name, slug, description) VALUES
    ('Skripsi',        'skripsi',        'Karya ilmiah mahasiswa S1'),
    ('Tesis',          'tesis',          'Karya ilmiah mahasiswa S2'),
    ('Disertasi',      'disertasi',      'Karya ilmiah mahasiswa S3'),
    ('Buku Ajar',      'buku-ajar',      'Materi perkuliahan resmi'),
    ('Referensi Umum', 'referensi-umum', 'Buku referensi untuk publik'),
    ('Jurnal',         'jurnal',         'Jurnal ilmiah internal kampus');

-- -----------------------------------------------------
-- Tabel faculties (Fakultas)
-- -----------------------------------------------------
CREATE TABLE faculties (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL UNIQUE,
    slug        VARCHAR(220)    NOT NULL UNIQUE,
    description TEXT            DEFAULT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO faculties (id, name, slug, description) VALUES
    (1, 'Kesehatan', 'kesehatan', 'Fakultas Ilmu Kesehatan'),
    (2, 'Humaniora', 'humaniora', 'Fakultas Humaniora'),
    (3, 'Sains dan Teknologi', 'sains-dan-teknologi', 'Fakultas Sains dan Teknologi'),
    (4, 'Kedokteran Hewan', 'kedokteran-hewan', 'Fakultas Kedokteran Hewan');

-- -----------------------------------------------------
-- Tabel programs (Program Studi)
-- -----------------------------------------------------
CREATE TABLE programs (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    faculty_id  INT UNSIGNED    NOT NULL,
    name        VARCHAR(200)    NOT NULL,
    slug        VARCHAR(220)    NOT NULL UNIQUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_programs_faculty FOREIGN KEY (faculty_id) REFERENCES faculties(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO programs (id, faculty_id, name, slug) VALUES
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
    (12, 4, 'Kedokteran Hewan', 'kedokteran-hewan');

-- -----------------------------------------------------
-- Tabel books
-- -----------------------------------------------------
CREATE TABLE books (
    id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    category_id     INT UNSIGNED    NOT NULL,
    program_id      INT UNSIGNED    DEFAULT NULL,
    uploaded_by     INT UNSIGNED    NOT NULL,
    title           VARCHAR(300)    NOT NULL,
    slug            VARCHAR(350)    NOT NULL UNIQUE,
    author          VARCHAR(250)    NOT NULL DEFAULT '',
    publisher       VARCHAR(200)    DEFAULT NULL,
    publication_year YEAR           DEFAULT NULL,
    isbn            VARCHAR(30)     DEFAULT NULL,
    description     TEXT            DEFAULT NULL,
    access_type     ENUM('public','internal') NOT NULL DEFAULT 'public',
    file_path       VARCHAR(500)    NOT NULL,   -- path relatif ke storage/pdfs/
    cover_image     VARCHAR(500)    DEFAULT NULL,-- path relatif ke public/uploads/covers/
    page_count      SMALLINT UNSIGNED DEFAULT 0,
    file_size       INT UNSIGNED    DEFAULT 0,  -- dalam bytes
    views           INT UNSIGNED    DEFAULT 0,
    status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_books_program FOREIGN KEY (program_id) REFERENCES programs(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_books_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_books_access ON books(access_type, status);
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_books_uploader ON books(uploaded_by);
CREATE FULLTEXT INDEX ft_books_search ON books(title, author, description);

-- Data dummy buku (isi sesuai data riil nanti)

-- -----------------------------------------------------
-- Tabel activity_logs: audit trail
-- -----------------------------------------------------
CREATE TABLE activity_logs (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED    DEFAULT NULL,
    action      VARCHAR(100)    NOT NULL,   -- 'login', 'logout', 'create_book', 'update_book', 'delete_book', dll
    description TEXT            DEFAULT NULL,
    ip_address  VARCHAR(45)     DEFAULT NULL,
    user_agent  VARCHAR(500)    DEFAULT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_action ON activity_logs(action);
CREATE INDEX idx_logs_created ON activity_logs(created_at);

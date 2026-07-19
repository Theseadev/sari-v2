# SARI v2 — Sistem Akses Referensi Informasi

> **Perpustakaan Digital Universitas Sari Mulia Banjarmasin**

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-4.7-E36002?logo=hono&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)

---

## Overview

SARI v2 adalah sistem perpustakaan digital untuk **Universitas Sari Mulia Banjarmasin**. Menyediakan katalog buku publik, pembaca PDF dengan kontrol akses, dan panel admin lengkap untuk mengelola buku, user, fakultas, serta program studi.

Dibangun dengan **Hono** + **TypeScript** + **MySQL** di atas **Node.js**.

---

## Fitur

### 📚 Katalog Publik
- Katalog buku dengan pencarian & filter
- Detail buku: cover, metadata, deskripsi, jumlah views
- Akses kontrol: publik vs internal (khusus kampus)

### 📖 PDF Reader (Flipbook)
- PDF.js-powered flipbook — dua halaman, navigasi keyboard (←/→, Home/End)
- Streaming PDF aman — `inline`, `no-store`, `nosniff`
- Blokir unduhan: right-click disabled, toolbar download disembunyikan

### 🔖 Bookmark & Riwayat
- **Bookmark** — simpan buku favorit, popup langsung dari dropdown
- **Riwayat Baca** — tracking halaman terakhir, popup dari dropdown
- Klik buku di popup → langsung buka detail buku

### 👤 Profil & Autentikasi
- **Popup Profil** — info akun langsung dari dropdown
- **Ganti Password** — akses cepat dari dropdown
- **Auto-login** — daftar langsung masuk, tidak perlu login ulang
- JWT (HS256) + bcryptjs, HttpOnly cookie

### 🛡️ Role-Based Access
| Role | Akses |
|------|-------|
| `mahasiswa` | Katalog + buku internal |
| `pustakawan` | Katalog + buku internal + admin read-only |
| `admin` | Full CRUD semua modul |
| `super_admin` | Admin + kelola user + log aktivitas |

### ⚙️ Admin Panel
| Modul | Fitur |
|-------|-------|
| **Dashboard** | Statistik, log aktivitas terbaru |
| **Buku** | CRUD, upload cover & PDF, slug otomatis, status toggle |
| **User** | CRUD (super_admin), role assignment |
| **Fakultas** | Full CRUD |
| **Program Studi** | CRUD, terhubung ke fakultas |
| **Log Aktivitas** | Audit trail login, logout, CRUD, bookmark |

### 🎨 UI/UX
- **SweetAlert2** — konfirmasi hapus yang elegan
- **Flash Messages** — toast notifikasi via SweetAlert2
- **Modal Popups** — profil, bookmark, riwayat, detail buku
- **Responsive** — mobile-friendly layout

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Runtime | Node.js 22+ (ESM) |
| Framework | [Hono](https://hono.dev) 4.7 |
| Bahasa | TypeScript 5.8 (strict) |
| Database | MySQL 8 via `mysql2/promise` |
| Auth | `jsonwebtoken` (HS256) + `bcryptjs` |
| Validasi | `zod` |
| PDF | `pdf-lib` (generasi), `pdf.js` (viewer) |
| Build | `tsx` (dev), `tsc` (build) |

---

## Struktur Project

```
sari-v2/
├── public/
│   ├── assets/
│   │   ├── css/style.css
│   │   └── js/app.js
│   └── uploads/
│       ├── covers/
│       └── pdfs/
├── src/
│   ├── index.ts              # Entry point & routing
│   ├── config/
│   │   ├── app.ts            # Konfigurasi aplikasi
│   │   └── database.ts       # MySQL pool & query helpers
│   ├── controllers/
│   │   ├── auth.ts           # Login, logout, register
│   │   ├── bookmarks.ts      # Bookmark, riwayat, popup modal
│   │   ├── books.ts          # Katalog, detail, flipbook
│   │   ├── pdf.ts            # Proxy streaming PDF
│   │   ├── profile.ts        # Profil & ganti password
│   │   ├── dashboard.ts      # Dashboard admin
│   │   ├── logs.ts           # Log aktivitas
│   │   ├── password.ts       # Lupa password
│   │   └── admin/
│   │       ├── books.ts      # CRUD buku
│   │       ├── users.ts      # CRUD user
│   │       ├── faculties.ts  # CRUD fakultas
│   │       ├── programs.ts   # CRUD program studi
│   │       └── categories.ts # CRUD kategori
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification & role guards
│   │   └── csrf.ts           # CSRF protection
│   ├── views/
│   │   ├── html.ts           # Layout utama & modal popups
│   │   └── admin/
│   │       └── helpers.ts    # Admin layout & form helpers
│   ├── types.ts              # TypeScript types
│   └── helpers.ts            # Utility functions
├── database/
│   ├── schema.sql            # Database schema
│   └── migration_v3.sql      # Migrasi bookmarks & riwayat
├── package.json
└── tsconfig.json
```

---

## Instalasi

### Prasyarat
- Node.js ≥ 22
- MySQL ≥ 8.0
- npm

### Setup

```bash
# Clone repository
git clone https://github.com/uin-antasari/sari-v2.git
cd sari-v2

# Install dependencies
npm install

# Setup database
mysql -u root -p < database/schema.sql
mysql -u root -p sari_v2 < database/migration_v3.sql

# Jalankan development
npm run dev
```

Server berjalan di **http://localhost:3000**

---

## Konfigurasi

Buat file `.env` atau edit langsung di `src/config/app.ts`:

```env
APP_PORT=3000
APP_DEBUG=true

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=sari_v2

JWT_SECRET=secret-key-min-32-karakter
```

---

## Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Development server dengan hot reload |
| `npm start` | Jalankan server |
| `npm run build` | Build TypeScript ke JavaScript |

---

## API Routes

| Method | Path | Deskripsi | Auth |
|--------|------|-----------|------|
| `GET` | `/buku` | Katalog buku | Publik |
| `GET` | `/buku/:slug` | Detail buku | Publik |
| `GET` | `/baca/:slug` | Flipbook reader | Login |
| `GET` | `/pdf/:slug` | Stream PDF | Login |
| `POST` | `/bookmark/:id/toggle` | Toggle bookmark | Login |
| `GET` | `/bookmark/modal` | Data bookmark (AJAX) | Login |
| `GET` | `/riwayat/modal` | Data riwayat (AJAX) | Login |
| `GET` | `/profil/modal` | Data profil (AJAX) | Login |
| `POST` | `/login` | Login | Publik |
| `POST` | `/register` | Daftar + auto-login | Publik |
| `GET` | `/admin` | Dashboard | Admin |
| `CRUD` | `/admin/books` | Kelola buku | Admin |
| `CRUD` | `/admin/users` | Kelola user | Super Admin |
| `CRUD` | `/admin/faculties` | Kelola fakultas | Admin |
| `CRUD` | `/admin/programs` | Kelola prodi | Admin |
| `GET` | `/admin/logs` | Log aktivitas | Super Admin |

---

## Database Schema

```
users           — id, username, name, email, password, role_id, status
roles           — id, name (mahasiswa, pustakawan, admin, super_admin)
books           — id, title, slug, author, cover_image, file_path, access_type, status
faculties       — id, name, code
programs        — id, faculty_id, name, code, degree
bookmarks       — id, user_id, book_id
reading_history — id, user_id, book_id, last_page
activity_logs   — id, user_id, action, description, ip_address
password_resets — id, user_id, token, expires_at
```

---

## Security

- **Prepared Statements** — semua query pakai parameterized
- **JWT HttpOnly Cookie** — token tidak bisa diakses via JavaScript
- **CSRF Protection** — token HMAC-based, stateless
- **Role Guards** — middleware cek role di setiap route admin
- **Input Sanitization** — HTML escaping di semua server-rendered view
- **PDF Security** — streaming inline, no-store cache, nosniff header

---

## License

MIT © Universitas Sari Mulia Banjarmasin

# SARI v2 — Sistem Akses Referensi Informasi v2

> **Digital Library & Book Catalog System for UIN Antasari Banjarmasin**

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-4.7-E36002?logo=hono&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

**SARI v2** (Sistem Akses Referensi Informasi versi 2) is a modern digital library system built for **UIN Antasari Banjarmasin**. It provides a public book catalog, secure PDF reader with access control, and a full-featured admin panel for managing books, users, faculties, and study programs.

Built with **Hono** (fast, lightweight web framework) + **TypeScript** + **MySQL**, running on **Node.js** via `@hono/node-server`.

---

## Features

### 📚 Public Catalog
- **Book Catalog** — Paginated, searchable list of active books
- **Book Detail** — Cover, metadata (author, ISBN, publisher, year, pages, faculty/program), description, view counter
- **Access Control** — Public vs Internal (campus-only) books with role-based access

### 📖 PDF Reader (Flipbook)
- **PDF.js-powered flipbook** — Two-page spread, keyboard navigation (←/→, Home/End), zoom via device pixel ratio
- **Secure PDF Proxy** — Streams PDFs with `inline` disposition, `no-store` cache headers, `X-Content-Type-Options: nosniff`
- **Access Enforcement** — Internal books restricted to authenticated campus roles (`mahasiswa`, `admin`, `super_admin`, `pustakawan`)
- **Anti-download UX** — Right-click disabled, keyboard shortcuts blocked, no toolbar download button

### 🛡️ Authentication & Authorization
- **JWT** (HS256) + **bcryptjs** password hashing
- **Role-based Access**:
  - `mahasiswa` — Student (catalog + internal books)
  - `pustakawan` — Librarian (catalog + internal books + admin read)
  - `admin` — Full admin CRUD
  - `super_admin` — Admin + user management
- **HttpOnly Cookies** for JWT storage, `SameSite=Lax`, secure in production

### ⚙️ Admin Panel
| Module | Features |
|--------|----------|
| **Dashboard** | Stats cards, recent activity log |
| **Books CRUD** | Create/Edit/Delete, cover upload, PDF upload, slug auto-gen, status toggle |
| **Users CRUD** | Super-admin only, role assignment, password reset |
| **Faculties CRUD** | Full CRUD |
| **Study Programs CRUD** | Linked to faculty |
| **Activity Logs** | Paginated, filterable audit trail |

### 📄 PDF Generation
- **pdf-lib** based certificate/report generation (controller: `pdf.ts`)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 22+ (ESM) |
| **Framework** | [Hono](https://hono.dev) 4.7 |
| **Language** | TypeScript 5.8 (strict) |
| **Database** | MySQL 8 via `mysql2/promise` (prepared statements) |
| **Auth** | `jsonwebtoken` (HS256) + `bcryptjs` |
| **PDF** | `pdf-lib` (generation), `pdf.js` 3.11 via CDN (viewer) |
| **Dev/Build** | `tsx` (watch/run), `tsc` (build) |
| **Static Files** | `@hono/node-server/serve-static` |

---

## Project Structure

```
sari-v2/
├── public/                 # Static assets (served at /assets, /uploads)
│   ├── assets/             # CSS, JS, images
│   └── uploads/            # Book covers & PDFs (served directly)
├── src/
│   ├── index.ts            # Entry point: routes + server bootstrap
│   ├── config/
│   │   ├── app.ts          # App config (name, port, debug, paths, JWT secret)
│   │   └── database.ts     # MySQL pool + query helpers (query, queryOne, execute)
│   ├── controllers/
│   │   ├── auth.ts         # Login/logout, JWT cookie handling
│   │   ├── books.ts        # Public catalog, detail, reader
│   │   ├── pdf.ts          # Secure PDF proxy streaming
│   │   ├── dashboard.ts    # Admin dashboard + stats
│   │   ├── logs.ts         # Activity log viewer
│   │   └── admin/
│   │       ├── books.ts    # Books CRUD
│   │       ├── users.ts    # Users CRUD (super_admin)
│   │       ├── faculties.ts
│   │       └── programs.ts
│   ├── middleware/
│   │   └── auth.ts         # JWT verification, role guards, getUser()
│   ├── views/
│   │   └── html.ts         # Server-rendered HTML layouts (Hono JSX-like)
│   ├── types.ts            # Shared TypeScript types (User, Book, Role, etc.)
│   └── helpers.ts          # Cookie, flash, slug, escape helpers
├── database/
│   └── schema.sql          # Database schema (run manually)
├── seed_books.sql          # Sample book data
├── seed_books_v2.sql       # Extended sample data
├── package.json
├── tsconfig.json
└── README.md               # ← You are here
```

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 22 (ESM, `tsx` runtime)
- **MySQL** ≥ 8.0
- **npm** / `pnpm` / `yarn`

### Installation

```bash
# Clone
git clone https://github.com/uin-antasari/sari-v2.git
cd sari-v2

# Install dependencies
npm install

# Configure environment
cp .env.example .env   # Create from example (see below)
# Edit .env with your DB credentials & JWT secret

# Initialize database
mysql -u root -p < database/schema.sql
mysql -u root -p < seed_books.sql        # optional sample data
mysql -u root -p < seed_books_v2.sql     # optional extended data

# Development (hot reload)
npm run dev

# Production build + run
npm run build
npm start
```

Server runs at **`http://localhost:3000`** (default `APP_PORT`).

---

## Configuration

Create `.env` from `.env.example` (create if missing):

```env
# App
APP_NAME="SARI v2"
APP_PORT=3000
APP_DEBUG=true

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sari_v2

# JWT (HS256) — use a strong random string in production!
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# File Storage (absolute paths, must exist & be writable)
PDF_PATH=/var/www/sari-v2/storage/pdfs/
COVER_PATH=/var/www/sari-v2/storage/covers/
UPLOAD_MAX_SIZE=52428800   # 50MB
```

> **Production**: Set `APP_DEBUG=false`, use strong `JWT_SECRET` (≥32 chars), enable HTTPS, set `Secure` cookie flag in `auth.ts`.

---

## Database Schema (High-Level)

```sql
users          -- id, name, email, password_hash, role_id, is_active
roles          -- id, name (mahasiswa, pustakawan, admin, super_admin), description
books          -- id, title, slug, author, description, cover_image, file_path,
               -- access_type (public|internal), status (draft|active|archived),
               -- publisher, publication_year, isbn, page_count, views,
               -- faculty_id, program_id, created_by, timestamps
faculties      -- id, name, code, description
programs       -- id, faculty_id, name, code, degree (S1/S2/S3)
activity_logs  -- id, user_id, action, description, ip_address, user_agent, created_at
```

Full schema: `database/schema.sql`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with `tsx watch` (hot reload) |
| `npm run start` | Run built JS from `dist/` (after `npm run build`) |
| `npm run build` | Type-check + emit JS to `dist/` via `tsc` |

---

## Deployment Notes

- **Process Manager**: Use `pm2` or `systemd` to run `npm start` (built output in `dist/`)
- **Reverse Proxy**: Nginx/Caddy in front for TLS, static file caching, gzip
- **Static Files**: `public/assets/*` and `public/uploads/*` served directly by Hono; in production, offload to Nginx `location /assets { alias /path/to/public/assets; }`
- **File Storage**: Ensure `PDF_PATH` and `COVER_PATH` directories exist and are writable by the Node process
- **Database**: Use a managed MySQL (RDS, CloudSQL) or self-hosted with connection pooling
- **Environment**: Never commit `.env`; inject secrets via your deployment platform

---

## API Routes Overview

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/` | Redirect → `/buku` | Public |
| `GET` | `/buku` | Public catalog (paginated) | Public |
| `GET` | `/buku/:slug` | Book detail | Public |
| `GET` | `/baca/:slug` | Flipbook reader | Role-gated |
| `GET` | `/pdf/:slug` | Secure PDF stream | Role-gated |
| `GET/POST` | `/login` `/logout` | Auth | Public |
| `GET` | `/admin` | Dashboard | `admin`/`super_admin` |
| `GET` | `/admin/logs` | Activity logs | `admin`/`super_admin` |
| `CRUD` | `/admin/books` | Books management | `admin`/`super_admin` |
| `CRUD` | `/admin/users` | Users management | `super_admin` |
| `CRUD` | `/admin/faculties` | Faculties management | `admin`/`super_admin` |
| `CRUD` | `/admin/programs` | Programs management | `admin`/`super_admin` |

---

## Security Highlights

- **Prepared Statements** everywhere (`mysql2/promise` placeholders)
- **JWT in HttpOnly Cookie** — not in localStorage, mitigates XSS token theft
- **Role Guards** — middleware enforces role on every admin route
- **PDF Access Control** — internal books checked at proxy layer, not just UI
- **Secure Headers** on PDF responses: `no-store`, `nosniff`, `inline` disposition
- **Input Sanitization** — HTML escaping helpers in `helpers.ts` for server-rendered views
- **Slug Collision Handling** — auto-increment suffix on create

---

## Development Notes

- **TypeScript**: Strict mode enabled (`tsconfig.json`)
- **No ORM** — raw SQL with typed `query()` / `queryOne()` helpers returning typed rows
- **Views**: Server-rendered HTML strings (no template engine), kept in `views/html.ts`
- **Flash Messages**: Cookie-based (set on redirect, read once, auto-clear)
- **File Uploads**: Handled in admin controllers; stored to configured paths

---

## License

MIT © [UIN Antasari Banjarmasin](https://www.uin-antasari.ac.id)

---

> **Maintained by** the UIN Antasari Digital Library Team.  
> Issues & PRs welcome — please follow the existing code style (TypeScript strict, Hono patterns, raw SQL).
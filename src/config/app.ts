// src/config/app.ts - Konfigurasi aplikasi

// .env loading: optional, uncomment jika pakai dotenv

const DEFAULT_JWT_SECRET = "sari-v2-dev-secret-change-in-production";
const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

const isProd = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET && !isProd) {
	console.warn(
		"⚠️  JWT_SECRET not set — using dev default. Set JWT_SECRET in production!",
	);
}
if (!process.env.JWT_SECRET && isProd) {
	throw new Error("FATAL: JWT_SECRET must be set in production");
}

// Ponytail: enforce non-default secret in prod
if (jwtSecret === DEFAULT_JWT_SECRET && isProd) {
	throw new Error(
		"FATAL: JWT_SECRET cannot be the default value in production",
	);
}

export const APP = {
	NAME: "SARI - Perpustakaan Digital Universitas Sari Mulia",
	DEBUG: !isProd,
	PORT: Number(process.env.PORT) || 3000,
	BASE_PATH: `${process.cwd()}/`,
	STORAGE_PATH: `${process.cwd()}/storage/`,
	PDF_PATH: `${process.cwd()}/storage/pdfs/`,
	COVER_PATH: `${process.cwd()}/public/uploads/covers/`,
	JWT_SECRET: jwtSecret,
	JWT_EXPIRES_IN: "24h",
};

export const DB = {
	host: process.env.DB_HOST || "127.0.0.1",
	port: Number(process.env.DB_PORT) || 3306,
	database: process.env.DB_NAME || "sari_v2",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASS || "",
	charset: "utf8mb4" as const,
	// Ponytail: connectionLimit default 10 — cukup untuk development
	waitForConnections: true,
	connectionLimit: 10,
};

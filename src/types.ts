// src/types.ts - Tipe data bersama

export interface User {
	id: number;
	role_id: number;
	username: string;
	name: string;
	email: string;
	nim_nip: string | null;
	status: "active" | "inactive";
	role_name: RoleName;
	last_login: string | null;
}

export type RoleName = "super_admin" | "admin" | "pustakawan" | "mahasiswa" | "tamu";

export interface Book {
	id: number;
	category_id: number;
	program_id: number | null;
	uploaded_by: number;
	title: string;
	slug: string;
	author: string;
	publisher: string | null;
	publication_year: number | null;
	isbn: string | null;
	description: string | null;
	access_type: "public" | "internal";
	file_path: string;
	cover_image: string | null;
	page_count: number;
	file_size: number;
	views: number;
	status: "active" | "inactive";
	uploader_name?: string;
	category_name?: string;
	program_name?: string;
	faculty_name?: string;
	created_at: string;
}

export interface Category {
	id: number;
	name: string;
	slug: string;
	description: string | null;
}

export interface Faculty {
	id: number;
	name: string;
	slug: string;
	description: string | null;
}

export interface Program {
	id: number;
	faculty_id: number;
	name: string;
	slug: string;
}

export interface ActivityLog {
	id: number;
	user_id: number | null;
	action: string;
	description: string | null;
	ip_address: string | null;
	user_agent: string | null;
	user_name?: string;
	created_at: string;
}

export interface Stats {
	total_books: number;
	total_users: number;
	total_public: number;
	total_internal: number;
}

export interface Flash {
	type: "info" | "success" | "warning" | "danger";
	message: string;
}

export interface JwtPayload {
	userId: number;
	roleName: RoleName;
	name: string;
}

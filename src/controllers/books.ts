// src/controllers/books.ts - Katalog, detail, flip-book reader
// Versi Komprehensif (UI/UX Lengkap, JSDoc, CSS/JS Inline Terintegrasi)

import type { Context } from "hono";
import { query, queryOne } from "../config/database";
import type { Book, Faculty, Program } from "../types";
import { esc, getUser, getFlash } from "../helpers";
import { layout, errorPage } from "../views/html";

// ============================================================================
// KONFIGURASI & KONSTANTA GLOBAL
// ============================================================================

/**
 * Jumlah buku yang ditampilkan per halaman pada katalog
 */
const ITEMS_PER_PAGE = 24;

/**
 * SVG Icons yang digunakan secara berulang untuk mengurangi beban HTTP request.
 */
const ICONS = {
    search: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    book: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    eye: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    page: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    close: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    chevronDown: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    chevronLeft: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    chevronRight: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    zoomIn: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
    zoomOut: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
    bookmark: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`
};

// ============================================================================
// HELPER FUNCTIONS (Khusus Controller Ini)
// ============================================================================

/**
 * Membuat struktur HTML untuk kustom dropdown filter.
 */
function buildDropdown(name: string, label: string, selectedValue: number, itemsHtml: string): string {
    const selectedLabel = selectedValue === 0 ? label : "";
    return `
    <div class="custom-dropdown" data-name="${name}">
        <input type="hidden" name="${name}" value="${selectedValue}">
        <button type="button" class="dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
            <span class="dropdown-text" data-placeholder="${label}">${selectedLabel}</span>
            <span class="dropdown-icon">${ICONS.chevronDown}</span>
        </button>
        <div class="dropdown-menu" role="listbox">
            <div class="dropdown-search">
                <input type="text" placeholder="Cari..." aria-label="Cari dalam list">
            </div>
            <ul class="dropdown-list">
                ${itemsHtml}
            </ul>
        </div>
    </div>`;
}

/**
 * Meng-generate CSS untuk styling Katalog, Dropdown, dan Animasi Modal.
 */
function getCatalogStyles(): string {
    return `
    <style>
        /* CSS Khusus Katalog — Theme-Aware */
        .hero-catalog {
            background: linear-gradient(135deg, var(--primary-dark), var(--primary));
            color: #fff;
            padding: 100px 20px 60px;
            text-align: center;
            border-radius: 0 0 40px 40px;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .hero-catalog h1 {
            font-size: 2.2rem;
            margin-bottom: 8px;
            font-family: var(--font-heading);
            letter-spacing: -0.5px;
            font-weight: 600;
        }
        .hero-catalog p {
            font-size: 1.05rem;
            opacity: 0.85;
            margin-bottom: 28px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        /* Filter Form */
        .filter-form {
            max-width: 900px;
            margin: 0 auto;
            background: transparent;
            box-shadow: none;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .search-box {
            display: flex;
            gap: 10px;
            position: relative;
        }
        .search-box .icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            z-index: 1;
        }
        .hero-catalog .search-box input {
            flex: 1;
            padding: 14px 16px 14px 44px;
            border: 1.5px solid rgba(255, 255, 255, 0.25);
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.25s;
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #ffffff;
            outline: none;
        }
        .hero-catalog .search-box input::placeholder { color: rgba(255,255,255,0.5); }
        .hero-catalog .search-box input:focus {
            border-color: rgba(255, 255, 255, 0.5);
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08);
        }
        .hero-catalog .search-box button {
            background: rgba(255, 255, 255, 0.9);
            color: var(--primary-dark);
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            padding: 0 28px;
            border-radius: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.25s;
            backdrop-filter: blur(4px);
        }
        .hero-catalog .search-box button:hover {
            background: #ffffff;
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .filter-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        @media (max-width: 768px) {
            .hero-catalog { padding: 80px 16px 40px; }
            .hero-catalog h1 { font-size: 1.6rem; }
            .hero-catalog p { font-size: 0.9rem; }
            .filter-row { grid-template-columns: 1fr; }
            .search-box { flex-direction: column; }
            .search-box button { padding: 14px; }
            .book-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 14px;
            }
            .info { padding: 10px; }
            .info h3 { font-size: 0.85rem; }
            .info .author { font-size: 0.72rem; }
            .meta { font-size: 0.7rem; padding-top: 8px; gap: 4px; flex-wrap: wrap; }
            .meta-stat svg { width: 11px; height: 11px; }
        }

        @media (max-width: 480px) {
            .book-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            .catalog-header { flex-direction: column; gap: 8px; align-items: flex-start; }
            .hero-catalog h1 { font-size: 1.3rem; }
            .pagination .btn { font-size: 0.78rem; padding: 6px 12px; }
            .page-info { font-size: 0.75rem; }
        }

        /* Custom Dropdown — Glassmorphism eksklusif di hero */
        .custom-dropdown { position: relative; text-align: left; }
        .hero-catalog .dropdown-trigger {
            width: 100%;
            padding: 14px 18px;
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1.5px solid rgba(255, 255, 255, 0.25);
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            color: #ffffff;
            font-size: 0.95rem;
            font-weight: 500;
            transition: all 0.25s;
        }
        .hero-catalog .dropdown-trigger:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.45);
        }
        .hero-catalog .dropdown-trigger .dropdown-icon { 
            display: flex;
            color: rgba(255, 255, 255, 0.8);
            transition: transform 0.25s, color 0.2s;
        }
        .hero-catalog .custom-dropdown.active .dropdown-trigger {
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.4);
        }
        .hero-catalog .custom-dropdown.active .dropdown-trigger .dropdown-icon {
            transform: rotate(180deg);
            color: #ffffff;
        }
        
        /* Dark mode — hero tetap biru, glass tetap putih transparan */
        [data-theme="dark"] .hero-catalog .dropdown-trigger,
        [data-theme="dark"] .hero-catalog .search-box input,
        [data-theme="dark"] .hero-catalog .search-box button {
            /* override apa pun dari global dark mode */
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-color: rgba(255, 255, 255, 0.25);
            color: #ffffff;
        }
        [data-theme="dark"] .hero-catalog .dropdown-trigger:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.45);
        }
        .dropdown-menu {
            position: absolute;
            top: calc(100% + 8px);
            left: 0; right: 0;
            background: var(--bg-card);
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--border-light);
            z-index: 50;
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            max-height: 300px;
            display: flex;
            flex-direction: column;
        }
        .custom-dropdown.active .dropdown-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        .dropdown-search { 
            padding: 10px; 
            border-bottom: 1px solid var(--border-light); 
        }
        .dropdown-search input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border-light);
            border-radius: 8px;
            font-size: 0.9rem;
            background: var(--bg);
            color: var(--text);
        }
        .dropdown-search input:focus {
            outline: none;
            border-color: var(--primary);
        }
        .dropdown-list {
            list-style: none;
            overflow-y: auto;
            margin: 0; padding: 4px;
        }
        .dropdown-list li {
            padding: 10px 14px;
            cursor: pointer;
            font-size: 0.95rem;
            color: var(--text-muted);
            border-radius: 8px;
            transition: all 0.15s;
        }
        .dropdown-list li:hover { 
            background: var(--primary-light); 
            color: var(--primary);
            padding-left: 18px;
        }
        .dropdown-list li.selected {
            background: var(--primary);
            color: #fff;
            font-weight: 600;
        }
        .dropdown-list li.selected:hover {
            background: var(--primary-dark);
        }
        /* Scrollbar dropdown */
        .dropdown-list::-webkit-scrollbar { width: 4px; }
        .dropdown-list::-webkit-scrollbar-track { background: transparent; }
        .dropdown-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        /* Book Grid & Cards — Premium */
        .book-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .book-card {
            background: var(--bg-card);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            border: 1px solid var(--border-light);
            position: relative;
        }
        .book-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border-color: var(--primary);
        }
        .cover-wrap {
            position: relative;
            aspect-ratio: 3/4;
            background: linear-gradient(145deg, var(--primary-light) 0%, var(--bg-warm) 50%, var(--bg-elevated) 100%);
            overflow: hidden;
        }
        .cover-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .book-card:hover .cover-wrap img { transform: scale(1.08); }
        .cover-wrap::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.03) 100%);
            pointer-events: none;
        }
        .cover-placeholder {
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            font-size: 3rem; color: var(--primary);
            background: linear-gradient(145deg, var(--primary-light) 0%, var(--bg-warm) 50%, var(--bg-elevated) 100%);
        }
        .access-badge {
            position: absolute;
            top: 10px; right: 10px;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 0.62rem;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .access-badge.internal { background: #ef4444; color: white; }
        .access-badge.public { background: #10b981; color: white; }
        
        .info { padding: 14px; flex: 1; display: flex; flex-direction: column; }
        .info h3 {
            font-size: 0.95rem; margin: 0 0 4px;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            overflow: hidden; line-height: 1.4; color: var(--text-heading);
            font-weight: 600;
        }
        .info .author {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-bottom: 10px;
            flex: 1;
            font-style: italic;
        }
        .meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 0.75rem;
            border-top: 1px solid var(--border-light);
            padding-top: 10px;
        }
        .meta-badge {
            background: var(--bg-elevated);
            padding: 3px 8px;
            border-radius: 4px;
            color: var(--text-muted);
            font-weight: 500;
            display: inline-block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 0.7rem;
        }
        .meta-stat {
            display: flex;
            align-items: center;
            gap: 4px;
            color: var(--text-dim);
            white-space: nowrap;
        }
        .meta-stat svg { width: 13px; height: 13px; }
        
        /* Catalog Section Header */
        .catalog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 14px;
            border-bottom: 2px solid var(--border-light);
        }
        .catalog-header h2 {
            font-size: 1.15rem;
            color: var(--text-heading);
            font-family: var(--font-heading);
            font-weight: 600;
        }
        .catalog-total {
            background: var(--bg-elevated);
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--text-muted);
            border: 1px solid var(--border-light);
        }
        
        /* Pagination */
        .pagination {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            margin: 36px 0 20px;
            flex-wrap: wrap;
        }
        .pagination .btn {
            padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 0.85rem;
            border: 1.5px solid var(--border); color: var(--text);
            text-decoration: none; transition: all 0.2s;
            display: inline-flex; align-items: center; gap: 6px;
        }
        .pagination .btn:hover {
            background: var(--primary);
            border-color: var(--primary);
            color: #fff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px var(--primary-glow);
        }
        .page-info {
            font-size: 0.85rem;
            color: var(--text-muted);
            font-weight: 500;
            padding: 0 12px;
        }

        /* Modal Premium */
        .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 9999;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; visibility: hidden;
            transition: all 0.3s ease;
            padding: 20px;
        }
        .modal-overlay.show { opacity: 1; visibility: visible; }
        .modal-card {
            background: var(--bg-card);
            border-radius: 20px;
            width: 100%; max-width: 960px;
            max-height: min(88vh, 720px);
            overflow-y: auto;
            position: relative;
            transform: scale(0.95) translateY(20px);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 25px 60px rgba(0,0,0,0.3);
            border: 1px solid var(--border-light);
            display: flex;
            flex-direction: column;
        }
        .modal-overlay.show .modal-card { transform: scale(1) translateY(0); }
        .modal-card::-webkit-scrollbar { width: 6px; }
        .modal-card::-webkit-scrollbar-track { background: transparent; }
        .modal-card::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        .modal-close {
            position: absolute; top: 16px; right: 16px;
            background: var(--bg);
            border: 1px solid var(--border-light);
            width: 36px; height: 36px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s; z-index: 10;
            color: var(--text-muted);
        }
        .modal-close:hover {
            background: #fef2f2;
            border-color: #fecaca;
            color: #ef4444;
        }
        
        .book-modal-grid {
            display: grid;
            grid-template-columns: 240px 1fr;
            gap: 28px;
            padding: 28px 32px 32px;
            overflow: hidden;
            flex: 1;
            align-content: start;
        }
        .book-modal-left {
            display: flex;
            flex-direction: column;
            gap: 40px;
            align-self: start;
        }
        .book-modal-cover {
            max-height: 360px;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .book-modal-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .modal-nav {
            display: flex;
            gap: 6px;
        }
        .modal-nav button {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 7px 10px !important;
            font-size: 0.78rem !important;
            border-radius: 8px !important;
        }
        .modal-nav button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            pointer-events: none;
        }
        .book-modal-info {
            overflow-y: auto;
            padding-right: 6px;
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        .book-modal-info > *:last-child {
            margin-bottom: 0;
        }
        .book-modal-info h2 {
            font-size: 1.5rem;
            margin-bottom: 2px;
            line-height: 1.25;
            font-family: var(--font-heading);
            padding-right: 32px; /* hindari overlap tombol close */
        }
        .book-modal-info .author {
            font-size: 0.95rem;
            color: var(--text-muted);
            margin-bottom: 16px;
        }
        
        .meta-grid-detail {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 12px;
            background: var(--bg-elevated);
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 16px;
        }
        .meta-grid-detail > span {
            display: flex;
            flex-direction: column;
            font-size: 0.85rem;
            color: var(--text-muted);
        }
        .meta-grid-detail strong {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-dim);
            margin-bottom: 2px;
        }
        
        .description-box {
            line-height: 1.6;
            color: var(--text-muted);
            margin-bottom: 20px;
            font-size: 0.9rem;
        }
        .description-box h3 {
            font-size: 1rem;
            margin-bottom: 8px;
            color: var(--text-heading);
        }
        
        .modal-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            padding-top: 4px;
            border-top: 1px solid var(--border-light);
        }
        .modal-actions .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 11px 22px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.9rem;
            text-decoration: none;
            transition: 0.2s;
            border: none;
            cursor: pointer;
        }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
        .btn-outline { background: transparent; border: 2px solid var(--border); color: var(--text); }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
        
        @media (max-width: 768px) {
            .modal-card {
                width: 96%;
                max-height: 90vh;
                border-radius: 16px;
            }
            .book-modal-grid {
                grid-template-columns: 1fr;
                padding: 20px;
                gap: 16px;
                overflow-y: auto;
            }
            .book-modal-left {
                align-items: center;
            }
            .book-modal-cover {
                max-width: 160px;
                max-height: none;
            }
            .book-modal-info { overflow-y: visible; }
            .book-modal-info h2 { font-size: 1.2rem; text-align: center; padding-right: 0; }
            .book-modal-info .author { text-align: center; }
            .modal-actions { flex-direction: column; }
            .modal-actions .btn { width: 100%; justify-content: center; }
        }
    </style>
    <script>
        // Client-side scripts untuk Katalog
        document.addEventListener('DOMContentLoaded', () => {
            // Dropdown Logic
            const dropdowns = document.querySelectorAll('.custom-dropdown');
            
            document.addEventListener('click', (e) => {
                dropdowns.forEach(dd => {
                    if (!dd.contains(e.target)) {
                        dd.classList.remove('active');
                        dd.querySelector('.dropdown-trigger').setAttribute('aria-expanded', 'false');
                    }
                });
            });

            dropdowns.forEach(dd => {
                const trigger = dd.querySelector('.dropdown-trigger');
                const listItems = dd.querySelectorAll('.dropdown-list li');
                const hiddenInput = dd.querySelector('input[type="hidden"]');
                const triggerText = dd.querySelector('.dropdown-text');
                const searchInput = dd.querySelector('.dropdown-search input');

                trigger.addEventListener('click', () => {
                    const isActive = dd.classList.contains('active');
                    dropdowns.forEach(d => d.classList.remove('active'));
                    if (!isActive) {
                        dd.classList.add('active');
                        trigger.setAttribute('aria-expanded', 'true');
                        if (searchInput) setTimeout(() => searchInput.focus(), 100);
                    }
                });

                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        const term = e.target.value.toLowerCase();
                        listItems.forEach(item => {
                            const text = item.textContent.toLowerCase();
                            item.style.display = text.includes(term) ? 'block' : 'none';
                        });
                    });
                }

                listItems.forEach(item => {
                    item.addEventListener('click', () => {
                        listItems.forEach(li => li.classList.remove('selected'));
                        item.classList.add('selected');
                        hiddenInput.value = item.dataset.val;
                        
                        if (item.dataset.val === "0") {
                            triggerText.textContent = triggerText.dataset.placeholder;
                        } else {
                            triggerText.textContent = item.textContent;
                        }
                        
                        dd.classList.remove('active');
                        // Optional: Auto submit form on select
                        // dd.closest('form').submit(); 
                    });
                });
            });

            // Modal Logic (AJAX Fetch)
            const bookCards = document.querySelectorAll('.book-card');
            bookCards.forEach(card => {
                card.addEventListener('click', async () => {
                    const slug = card.dataset.slug;
                    openModalWithSlug(slug);
                });
            });
            
            // Delegate events for dynamic modal nav buttons
            document.body.addEventListener('click', (e) => {
                const navBtn = e.target.closest('button[data-nav]');
                if (navBtn) {
                    const slug = navBtn.dataset.slug;
                    openModalWithSlug(slug);
                }
                
                const closeBtn = e.target.closest('#closeBookModal');
                const overlay = e.target.closest('.modal-overlay');
                if (closeBtn || (overlay && e.target === overlay)) {
                    closeModal();
                }
            });

            async function openModalWithSlug(slug) {
                // Get current URL params to maintain context (search, faculty, etc)
                const urlParams = new URLSearchParams(window.location.search);
                const queryStr = urlParams.toString();
                
                try {
                    const reqUrl = '/buku/' + slug + (queryStr ? '?' + queryStr : '');
                    const res = await fetch(reqUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' }});
                    
                    if (!res.ok) {
                        console.error('Gagal memuat buku:', res.status);
                        return;
                    }
                    const html = await res.text();
                    
                    // Remove existing modal if any
                    const existing = document.getElementById('bookModal');
                    if (existing) existing.remove();
                    
                    // Append new modal
                    document.body.insertAdjacentHTML('beforeend', html);
                    
                    // Trigger animation
                    setTimeout(() => {
                        document.getElementById('bookModal').classList.add('show');
                        document.body.style.overflow = 'hidden';
                    }, 10);
                    
                    // Update URL without reload (History API)
                    window.history.pushState({slug: slug}, '', reqUrl);
                } catch (err) {
                    console.error("Gagal fetch detail buku:", err);
                    window.location.href = '/buku/' + slug; // Fallback
                }
            }
            
            function closeModal() {
                const modal = document.getElementById('bookModal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 300);
                    document.body.style.overflow = '';
                    
                    // Revert URL to catalog
                    const urlParams = new URLSearchParams(window.location.search);
                    window.history.pushState({}, '', '/buku?' + urlParams.toString());
                }
            }
            
            // Bookmark via AJAX
            document.body.addEventListener('submit', (e) => {
                const form = e.target.closest('form[data-bookmark-form]');
                if (!form) return;
                e.preventDefault();
                
                const url = form.getAttribute('action');
                const btn = form.querySelector('button');
                const isAdding = !btn.textContent.includes('Hapus');
                
                fetch(url, { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                    .then(r => {
                        if (r.ok || r.redirected) {
                            if (isAdding) {
                                btn.innerHTML = \`${ICONS.bookmark} Hapus Bookmark\`;
                                btn.style.borderColor = '#eab308';
                                btn.style.color = '#eab308';
                                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Berhasil ditambahkan ke bookmark!', showConfirmButton: false, timer: 2000 });
                            } else {
                                btn.innerHTML = \`${ICONS.bookmark} Simpan\`;
                                btn.style.borderColor = '';
                                btn.style.color = '';
                                Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Bookmark dihapus.', showConfirmButton: false, timer: 2000 });
                            }
                        }
                    })
                    .catch(() => {
                        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Gagal memproses bookmark.', showConfirmButton: false, timer: 2000 });
                    });
            });

            // Handle browser back button
            window.addEventListener('popstate', (e) => {
                if (window.location.pathname === '/buku') {
                    closeModal();
                } else if (window.location.pathname.startsWith('/buku/')) {
                    const slug = window.location.pathname.split('/').pop();
                    if(slug) openModalWithSlug(slug);
                }
            });
        });
    </script>
    `;
}

// ============================================================================
// 1. KONTROLER: KATALOG BUKU
// ============================================================================

/**
 * Menampilkan daftar buku dengan fitur pencarian, filter fakultas/prodi, dan paginasi.
 */
export async function catalog(c: Context) {
    const user = getUser(c);
    const flash = getFlash(c);
    
    // Parameter Query
    const search = c.req.query("q")?.trim() || "";
    const facultyId = Number(c.req.query("faculty")) || 0;
    const programId = Number(c.req.query("program")) || 0;
    const page = Math.max(1, Number(c.req.query("page")) || 1);
    
    // Cek Privilege Akses (Apakah bisa melihat buku internal)
    const isPrivileged = user && ["mahasiswa", "admin", "super_admin", "pustakawan"].includes(user.roleName);

    // Build Kueri
    let where = "b.status = 'active'";
    const params: unknown[] = [];
    
    if (!isPrivileged) {
        where += " AND b.access_type = 'public'";
    }
    
    if (search) {
        // FULLTEXT SEARCH: Lebih cepat dari LIKE untuk database besar
        where += " AND MATCH (b.title, b.author, b.description) AGAINST (? IN BOOLEAN MODE)";
        params.push(search.replace(/[\-+*~"()<>]/g, " ").trim() + "*");
    }
    
    if (programId > 0) {
        where += " AND b.program_id = ?";
        params.push(programId);
    } else if (facultyId > 0) {
        where += " AND pr.faculty_id = ?";
        params.push(facultyId);
    }

    // Eksekusi Kueri Total
    const totalQuery = `
        SELECT COUNT(*) AS cnt 
        FROM books b 
        LEFT JOIN programs pr ON pr.id = b.program_id 
        LEFT JOIN faculties f ON f.id = pr.faculty_id 
        WHERE ${where}
    `;
    const total = await queryOne<{ cnt: number }>(totalQuery, params);
    const totalPages = Math.ceil((total?.cnt || 0) / ITEMS_PER_PAGE);

    // Eksekusi Kueri Data
    const dataQuery = `
        SELECT b.id, b.title, b.slug, b.author, b.access_type,
               b.cover_image, b.page_count, b.views,
               pr.name AS program_name, f.name AS faculty_name
        FROM books b
        LEFT JOIN programs pr ON pr.id = b.program_id
        LEFT JOIN faculties f ON f.id = pr.faculty_id
        WHERE ${where} 
        ORDER BY b.created_at DESC 
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${(page - 1) * ITEMS_PER_PAGE}
    `;
    const books = await query<Book[]>(dataQuery, params);

    // Ambil Data Referensi untuk Filter
    const faculties = await query<Faculty[]>("SELECT id, name FROM faculties ORDER BY name");
    let programs: Program[] = [];
    
    if (facultyId > 0) {
        programs = await query<Program[]>("SELECT id, name FROM programs WHERE faculty_id = ? ORDER BY name", [facultyId]);
    } else {
        programs = await query<Program[]>("SELECT id, name FROM programs ORDER BY name");
    }

    // Render HTML Cards
    let bookCards = "";
    if (books.length === 0) {
        bookCards = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Buku Tidak Ditemukan</h3>
                <p>Coba ubah kata kunci pencarian atau sesuaikan filter fakultas/prodi.</p>
                <a href="/buku" class="btn" style="margin-top:20px;display:inline-flex;align-items:center;gap:8px;padding:10px 24px;border-radius:10px;background:var(--primary);color:#fff;text-decoration:none;font-weight:600;font-size:0.9rem;transition:all 0.2s">Reset Filter</a>
            </div>
        `;
    } else {
        for (const b of books) {
            const cover = b.cover_image 
                ? `<img src="/uploads/covers/${esc(b.cover_image)}" alt="Cover ${esc(b.title)}" loading="lazy">` 
                : `<div class="cover-placeholder">${ICONS.book}</div>`;
                
            const badge = b.access_type === "internal" 
                ? `<span class="access-badge internal">Internal</span>` 
                : `<span class="access-badge public">Publik</span>`;

            const prodiTag = b.program_name ? `<span class="meta-badge">${esc(b.program_name)}</span>` : "";

            bookCards += `
            <div class="book-card" data-slug="${esc(b.slug)}">
                <div class="cover-wrap">
                    ${cover}
                    ${badge}
                </div>
                <div class="info">
                    <h3 title="${esc(b.title)}">${esc(b.title)}</h3>
                    <p class="author">${esc(b.author)}</p>
                    <div class="meta">
                        ${prodiTag}
                        <span class="meta-stat">
                            ${ICONS.page} ${b.page_count} hlm &nbsp;&middot;&nbsp; 
                            ${ICONS.eye} ${b.views}
                        </span>
                    </div>
                </div>
            </div>`;
        }
    }

    // Siapkan List Dropdown
    let facItems = `<li data-val="0" class="${facultyId === 0 ? "selected" : ""}">Semua Fakultas</li>`;
    for (const f of faculties) {
        facItems += `<li data-val="${f.id}" class="${f.id === facultyId ? "selected" : ""}">${esc(f.name)}</li>`;
    }

    let progItems = `<li data-val="0" class="${programId === 0 ? "selected" : ""}">Semua Prodi</li>`;
    for (const p of programs) {
        progItems += `<li data-val="${p.id}" class="${p.id === programId ? "selected" : ""}">${esc(p.name)}</li>`;
    }

    // Siapkan Paginasi
    let paginationHtml = "";
    if (totalPages > 1) {
        const qs = new URLSearchParams();
        if (search) qs.set("q", search);
        if (facultyId) qs.set("faculty", String(facultyId));
        if (programId) qs.set("program", String(programId));
        const baseQs = qs.toString();
        const getLink = (p: number) => `/buku${baseQs ? "?" + baseQs + "&" : "?"}page=${p}`;

        paginationHtml = `<nav class="pagination" aria-label="Navigasi Halaman">`;
        if (page > 1) {
            paginationHtml += `<a href="${getLink(page - 1)}" class="btn">${ICONS.chevronLeft} Sebelumnya</a>`;
        }
        paginationHtml += `<span class="page-info">Halaman ${page} dari ${totalPages}</span>`;
        if (page < totalPages) {
            paginationHtml += `<a href="${getLink(page + 1)}" class="btn">Selanjutnya ${ICONS.chevronRight}</a>`;
        }
        paginationHtml += `</nav>`;
    }

    // Susun Body HTML
    const body = `
        ${getCatalogStyles()}
        
        <section class="hero-catalog">
            <div class="container">
                <h1>${search ? `Hasil untuk: "${esc(search)}"` : "Katalog Perpustakaan Digital"}</h1>
                <p>Jelajahi ribuan literatur, jurnal, dan buku di Universitas Sari Mulia</p>
                
                <form method="GET" action="/buku" class="filter-form">
                    <div class="search-box">
                        <span class="icon">${ICONS.search}</span>
                        <input type="text" name="q" placeholder="Cari judul buku, nama penulis, atau ISBN..." value="${esc(search)}">
                        <button type="submit">Temukan</button>
                    </div>
                    <div class="filter-row">
                        ${buildDropdown("faculty", "Semua Fakultas", facultyId, facItems)}
                        ${buildDropdown("program", "Semua Prodi", programId, progItems)}
                    </div>
                </form>
            </div>
        </section>

        <section class="container">
            <div class="catalog-header">
                <h2>
                    ${search ? "Hasil Pencarian" : "Koleksi Terbaru"}
                </h2>
                <span class="catalog-total">
                    Total: ${total?.cnt || 0} Buku
                </span>
            </div>
            
            <div class="book-grid">
                ${bookCards}
            </div>
            
            ${paginationHtml}
        </section>
    `;

    return c.html(layout("Katalog Buku | Perpustakaan SARI", body, user, flash));
}

// ============================================================================
// 2. KONTROLER: MODAL / HALAMAN DETAIL BUKU
// ============================================================================

/**
 * Endpoint yang menangani request detail buku.
 * Mengembalikan Partial HTML (Modal) jika diminta via AJAX, atau Full HTML Layout jika diakses langsung.
 */
export async function detail(c: Context) {
    const user = getUser(c);
    const slug = c.req.param("slug");
    
    // Cek apakah request berasal dari AJAX (Fetch di frontend katalog)
    const isAjax = c.req.header('X-Requested-With') === 'XMLHttpRequest';
    
    // Ambil parameter query untuk mempertahankan state "Prev/Next"
    const search = c.req.query("q")?.trim() || "";
    const facultyId = Number(c.req.query("faculty")) || 0;
    const programId = Number(c.req.query("program")) || 0;
    
    const isPrivileged = user && ["mahasiswa", "admin", "super_admin", "pustakawan"].includes(user.roleName);

    // Kueri Utama untuk Buku
    let baseWhere = "b.status = 'active'";
    const params: unknown[] = [];
    if (!isPrivileged) baseWhere += " AND b.access_type = 'public'";

    // Ambil Buku Saat Ini
    const currentQuery = `
        SELECT b.*, pr.name AS program_name, f.name AS faculty_name
        FROM books b
        LEFT JOIN programs pr ON pr.id = b.program_id
        LEFT JOIN faculties f ON f.id = pr.faculty_id
        WHERE ${baseWhere} AND b.slug = ?
        LIMIT 1
    `;
    const current = await queryOne<Book>(currentQuery, [...params, slug]);

    if (!current) {
        if (isAjax) return c.text("Not Found", 404);
        return c.html(errorPage(404, "Tidak Ditemukan", "Buku tidak ditemukan di sistem kami.", user), 404);
    }

    if (current.access_type === "internal" && !isPrivileged) {
        if (isAjax) return c.text("Forbidden", 403);
        return c.html(errorPage(403, "Akses Ditolak", "Buku ini bersifat internal. Silakan login menggunakan akun mahasiswa/dosen.", user), 403);
    }

    // Tambah View Count secara Asynchronous
    query("UPDATE books SET views = views + 1 WHERE id = ?", [current.id]).catch(console.error);

    // Logika Prev/Next (Hanya dihitung jika requested via AJAX / dari Katalog)
    let prevSlug = "", nextSlug = "";
    if (isAjax) {
        let navWhere = "status = 'active'";
        const navParams: unknown[] = [];
        if (!isPrivileged) navWhere += " AND access_type = 'public'";
        
        if (search) {
            navWhere += " AND MATCH (title, author, description) AGAINST (? IN BOOLEAN MODE)";
            navParams.push(search.replace(/[\-+*~"()<>]/g, " ").trim() + "*");
        }
        if (programId > 0) {
            navWhere += " AND program_id = ?";
            navParams.push(programId);
        } else if (facultyId > 0) {
            navWhere += " AND program_id IN (SELECT id FROM programs WHERE faculty_id = ?)";
            navParams.push(facultyId);
        }

        const prev = await queryOne<{slug: string}>(`SELECT slug FROM books WHERE ${navWhere} AND id < ? ORDER BY id DESC LIMIT 1`, [...navParams, current.id]);
        const next = await queryOne<{slug: string}>(`SELECT slug FROM books WHERE ${navWhere} AND id > ? ORDER BY id ASC LIMIT 1`, [...navParams, current.id]);
        
        if (prev) prevSlug = prev.slug;
        if (next) nextSlug = next.slug;
    }

    // Cek Reading History dan Bookmarks
    let lastPage = 0;
    let isBookmarked = false;
    if (user) {
        const rh = await queryOne<{last_page: number}>("SELECT last_page FROM reading_history WHERE user_id = ? AND book_id = ?", [user.userId, current.id]);
        if (rh && rh.last_page > 0) lastPage = rh.last_page;
        
        const bm = await queryOne("SELECT id FROM bookmarks WHERE user_id = ? AND book_id = ?", [user.userId, current.id]);
        if (bm) isBookmarked = true;
        
        // Catat di History
        query("INSERT INTO reading_history (user_id, book_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP", [user.userId, current.id]).catch(console.error);
    }

    // Persiapkan Variabel HTML
    const coverHtml = current.cover_image 
        ? `<img src="/uploads/covers/${esc(current.cover_image)}" alt="Cover ${esc(current.title)}">` 
        : `<div class="cover-placeholder" style="aspect-ratio:3/4; display:flex; align-items:center; justify-content:center; background:#f1f5f9; border-radius:12px; font-size:4rem; color:#cbd5e1;">${ICONS.book}</div>`;

    const descriptionHtml = current.description 
        ? `<div class="description-box">
             <h3>Sinopsis</h3>
             <p>${esc(current.description).replace(/\n/g, "<br>")}</p>
           </div>`
        : `<div class="description-box">
             <h3>Sinopsis</h3>
             <p style="color: var(--text-dim); font-style: italic;">Tidak ada sinopsis untuk buku ini.</p>
           </div>`;

    // Render HTML Konten Dalam
    const contentHtml = `
        <div class="book-modal-grid">
            <div class="book-modal-left">
                <div class="book-modal-cover">
                    ${coverHtml}
                </div>
                ${isAjax ? `
                <div class="modal-nav">
                    <button class="btn btn-outline" data-nav="prev" data-slug="${prevSlug}" ${!prevSlug ? 'disabled' : ''}>${ICONS.chevronLeft} Prev</button>
                    <button class="btn btn-outline" data-nav="next" data-slug="${nextSlug}" ${!nextSlug ? 'disabled' : ''}>Next ${ICONS.chevronRight}</button>
                </div>` : ''}
            </div>
            <div class="book-modal-info">
                <h2 id="bookModalTitle">${esc(current.title)}</h2>
                <p class="author">oleh <strong>${esc(current.author)}</strong></p>
                
                <div class="meta-grid-detail">
                    ${current.faculty_name ? `<span><strong>Fakultas / Prodi</strong>${esc(current.faculty_name)}<br>${current.program_name ? esc(current.program_name) : ''}</span>` : ''}
                    ${current.publisher ? `<span><strong>Penerbit</strong>${esc(current.publisher)}</span>` : ''}
                    ${current.publication_year ? `<span><strong>Tahun</strong>${current.publication_year}</span>` : ''}
                    ${current.isbn ? `<span><strong>ISBN</strong>${esc(current.isbn)}</span>` : ''}
                    <span><strong>Total Halaman</strong>${current.page_count || "—"} Halaman</span>
                    <span><strong>Total Dilihat</strong>${current.views} Kali</span>

                </div>
                
                ${descriptionHtml}
                
                <div class="modal-actions">
                    <a href="/baca/${esc(current.slug)}" class="btn btn-primary">
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                        Baca Sekarang
                    </a>
                    ${lastPage > 0 ? `
                    <a href="/baca/${esc(current.slug)}#page=${lastPage}" class="btn btn-outline">
                        Lanjut Hal. ${lastPage}
                    </a>` : ''}
                    ${user ? `
                    <form method="POST" action="/bookmark/${current.id}/toggle" style="margin:0;" data-bookmark-form>
                        <button type="submit" class="btn btn-outline" style="${isBookmarked ? 'border-color:#eab308; color:#eab308;' : ''}">
                            ${ICONS.bookmark} ${isBookmarked ? 'Hapus Bookmark' : 'Simpan'}
                        </button>
                    </form>` : ''}
                </div>
            </div>
        </div>
    `;

    // Jika Request AJAX, kembalikan Partial Modal
    if (isAjax) {
        return c.html(`
        <div class="modal-overlay" id="bookModal" role="dialog" aria-modal="true" aria-labelledby="bookModalTitle">
            <div class="modal-card">
                <button class="modal-close" id="closeBookModal" aria-label="Tutup Modal">${ICONS.close}</button>
                <div class="modal-body">
                    ${contentHtml}
                </div>
            </div>
        </div>
        `);
    }

    // Jika Akses Langsung URL, kembalikan Full Page Layout (SEO Friendly)
    const fullBody = `
        ${getCatalogStyles()}
        <section class="container" style="max-width: 1000px; margin: 40px auto; padding: 0 20px;">
            <nav style="margin-bottom: 24px; font-size: 0.9rem;">
                <a href="/" style="color: var(--primary); text-decoration: none;">Beranda</a> &rsaquo; 
                <a href="/buku" style="color: var(--primary); text-decoration: none;">Katalog</a> &rsaquo; 
                <span style="color: var(--text-muted);">${esc(current.title)}</span>
            </nav>
            <div style="background: #fff; border-radius: 24px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
                ${contentHtml}
            </div>
        </section>
    `;

    const seoMeta = {
        description: current.description ? current.description.slice(0, 160) : `Baca buku ${current.title} karya ${current.author}.`,
        ogImage: current.cover_image ? `/uploads/covers/${current.cover_image}` : `/assets/images/og-default.jpg`,
        ogType: "book"
    };

    return c.html(layout(`${esc(current.title)} | Detail`, fullBody, user, null, seoMeta));
}

// ============================================================================
// 3. KONTROLER: HTML5 PDF FLIP BOOK READER
// ============================================================================

/**
 * Merender aplikasi PDF Viewer dengan efek membalik halaman (Flip Book).
 * Terisolasi penuh (tidak menggunakan layout master).
 */
export async function reader(c: Context) {
    const user = getUser(c);
    const slug = c.req.param("slug");

    const book = await queryOne<Book>(
        "SELECT id, title, slug, access_type, file_path, page_count FROM books WHERE slug = ? AND status = ?",
        [slug, "active"],
    );

    if (!book) {
        return c.html(errorPage(404, "Buku Tidak Ditemukan", "File PDF buku tidak ada atau telah dihapus.", user), 404);
    }

    if (book.access_type === "internal" && (!user || !["mahasiswa", "admin", "super_admin", "pustakawan"].includes(user.roleName))) {
        return c.html(errorPage(403, "Akses Terbatas", "Anda harus login dengan akun mahasiswa/dosen untuk membaca buku ini.", user), 403);
    }

    // UI/UX untuk PDF Reader dengan Glassmorphism, Fitur Input Halaman, dan Skalabilitas
    return c.html(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Membaca: ${esc(book.title)}</title>
    
    <!-- PDF.js Core -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";</script>
    
    <style>
        :root {
            --bg-dark: #121214;
            --bg-canvas: #1e1e24;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #3b82f6;
            --glass-bg: rgba(30, 30, 36, 0.75);
            --glass-border: rgba(255, 255, 255, 0.08);
            --shadow-soft: 0 20px 50px rgba(0,0,0,0.5);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: var(--bg-dark);
            background-image: radial-gradient(circle at 50% 0%, #2a2a35 0%, var(--bg-dark) 80%);
            font-family: system-ui, -apple-system, sans-serif;
            overflow: hidden;
            height: 100dvh;
            user-select: none;
            color: var(--text-main);
        }

        /* Toolbar / Topbar Melayang */
        #toolbar {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            background: var(--glass-bg);
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 100px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            width: 95%;
            max-width: 900px;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Auto-hide toolbar saat scroll/baca */
        body.reading-mode #toolbar { transform: translate(-50%, -150%); }

        .btn-icon {
            background: transparent;
            color: var(--text-main);
            border: none;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .btn-icon:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); color: #fff; }
        .btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .divider { width: 1px; height: 24px; background: var(--glass-border); margin: 0 4px; }
        .spacer { flex: 1; }
        
        /* Fitur Input Halaman Custom */
        .page-control {
            display: flex;
            align-items: center;
            background: rgba(0,0,0,0.2);
            border-radius: 20px;
            padding: 2px 12px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .page-control input {
            background: transparent;
            border: none;
            color: #fff;
            width: 40px;
            text-align: right;
            font-size: 14px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }
        .page-control input:focus { outline: none; }
        .page-control input::-webkit-outer-spin-button, 
        .page-control input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .page-control span {
            color: var(--text-muted);
            font-size: 13px;
            margin-left: 4px;
        }

        .book-title {
            font-weight: 500;
            font-size: 14px;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .btn-close {
            text-decoration: none;
            color: var(--text-main);
            font-size: 13px;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: 100px;
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            transition: 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .btn-close:hover { background: rgba(239, 68, 68, 0.4); }

        /* Area PDF Reader */
        #reader-wrapper {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 50px; /* Space for toolbar */
        }

        #book {
            position: relative;
            display: flex;
            perspective: 3000px;
            filter: drop-shadow(var(--shadow-soft));
        }

        .page-slot { position: relative; background: #fff; cursor: pointer; }
        .page-slot canvas { display: block; }
        
        #page-left { border-radius: 6px 0 0 6px; }
        #page-right { border-radius: 0 6px 6px 0; }

        /* Gradasi Tulang Buku (Spine) */
        #book::after {
            content: '';
            position: absolute;
            top: 0; bottom: 0; left: 50%;
            width: 40px;
            transform: translateX(-50%);
            background: linear-gradient(90deg, 
                rgba(0,0,0,0.2) 0%, 
                rgba(0,0,0,0.02) 25%, 
                rgba(0,0,0,0.0) 50%, 
                rgba(0,0,0,0.02) 75%, 
                rgba(0,0,0,0.2) 100%);
            pointer-events: none;
            z-index: 10;
        }

        /* Animasi Membalik Halaman 3D */
        .flip-container {
            position: absolute; top: 0; height: 100%; width: 50%;
            z-index: 20; pointer-events: none; perspective: 3000px;
        }
        #flip-container-next { left: 50%; }
        #flip-container-prev { right: 50%; }

        .flip-page {
            position: absolute; top: 0; width: 100%; height: 100%;
            background: #fff;
            transform-style: preserve-3d;
            transition: transform 0.7s cubic-bezier(0.25, 1, 0.5, 1);
            backface-visibility: hidden;
            overflow: hidden;
        }
        #flip-page-next { left: 0; transform-origin: left center; border-radius: 0 6px 6px 0; }
        #flip-page-prev { right: 0; transform-origin: right center; border-radius: 6px 0 0 6px; }

        #flip-page-next.flipping { transform: rotateY(-180deg); box-shadow: -15px 0 30px rgba(0,0,0,0.2); }
        #flip-page-prev.flipping { transform: rotateY(180deg); box-shadow: 15px 0 30px rgba(0,0,0,0.2); }
        
        .flip-page canvas { display: block; }

        /* Hint Shadow saat hover */
        .page-slot::after {
            content: ''; position: absolute; top: 0; bottom: 0; width: 40px;
            pointer-events: none; opacity: 0; transition: opacity 0.3s;
        }
        #page-left::after { right: 0; background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1)); }
        #page-right::after { left: 0; background: linear-gradient(270deg, transparent, rgba(0,0,0,0.1)); }
        .page-slot:hover::after { opacity: 1; }

        /* Loading Screen UI */
        #loading-overlay {
            position: fixed; inset: 0;
            background: var(--bg-dark);
            z-index: 999;
            display: flex; align-items: center; justify-content: center;
            flex-direction: column; gap: 20px;
            transition: opacity 0.8s ease;
        }
        #loading-overlay.hidden { opacity: 0; pointer-events: none; }
        
        .loader-ring {
            width: 60px; height: 60px;
            border: 4px solid rgba(255,255,255,0.05);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .loading-text { font-size: 1.1rem; font-weight: 500; letter-spacing: 1px; color: var(--text-muted); }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
            #toolbar { width: 92%; padding: 6px 8px; border-radius: 12px; }
            .book-title, .btn-close span { display: none; }
            .btn-close { padding: 8px; border-radius: 8px; }
            .divider { display: none; }
            .page-control { background: transparent; border: none; padding: 0; }
            #book::after { width: 10px; } /* Hide heavy spine on mobile */
        }
    </style>
</head>
<body>

    <!-- Loading Screen -->
    <div id="loading-overlay">
        <div class="loader-ring"></div>
        <div class="loading-text">Menyiapkan Dokumen PDF...</div>
        <div id="loading-progress" style="font-size:0.85rem; color:#64748b; margin-top:-10px;">0%</div>
    </div>

    <!-- Floating Topbar -->
    <div id="toolbar" role="toolbar" aria-label="PDF Reader Tools">
        <button id="btn-prev" class="btn-icon" onclick="prevPage()" title="Halaman Sebelumnya" aria-label="Previous Page">
            ${ICONS.chevronLeft}
        </button>
        
        <div class="page-control" title="Ketik untuk lompat halaman">
            <input type="number" id="page-input" value="1" min="1" aria-label="Nomor Halaman">
            <span id="page-total">/ 0</span>
        </div>
        
        <button id="btn-next" class="btn-icon" onclick="nextPage()" title="Halaman Selanjutnya" aria-label="Next Page">
            ${ICONS.chevronRight}
        </button>
        
        <div class="divider"></div>
        
        <button id="btn-zoomin" class="btn-icon" onclick="zoomIn()" title="Perbesar Ukuran">
            ${ICONS.zoomIn}
        </button>
        <button id="btn-zoomout" class="btn-icon" onclick="zoomOut()" title="Perkecil Ukuran">
            ${ICONS.zoomOut}
        </button>
        
        <span class="spacer"></span>
        <span class="book-title" title="${esc(book.title)}">${esc(book.title)}</span>
        <span class="spacer"></span>
        
        <a href="/buku/${esc(book.slug)}" class="btn-close" aria-label="Keluar">
            ${ICONS.close}
            <span>Tutup</span>
        </a>
    </div>

    <!-- Area Kanvas PDF -->
    <div id="reader-wrapper">
        <div id="book">
            <div id="page-left" class="page-slot"></div>
            <div id="page-right" class="page-slot"></div>
            
            <div id="flip-container-next" class="flip-container">
                <div id="flip-page-next" class="flip-page"></div>
            </div>
            
            <div id="flip-container-prev" class="flip-container">
                <div id="flip-page-prev" class="flip-page"></div>
            </div>
        </div>
    </div>

    <!-- Script Utama PDF.js -->
    <script>
        // Konfigurasi & State
        const PDF_URL = "/pdf/${esc(book.slug)}";
        const BOOK_ID = ${book.id};
        
        let pdfDoc = null;
        let currentPage = 1;
        let totalPages = 0;
        let currentScale = 1.0;
        let isFlipping = false;
        let isMobile = window.innerWidth < 768;
        let autoHideTimer = null;

        // Elemen DOM
        const elLeft = document.getElementById("page-left");
        const elRight = document.getElementById("page-right");
        
        const flipContNext = document.getElementById("flip-container-next");
        const flipPageNext = document.getElementById("flip-page-next");
        
        const flipContPrev = document.getElementById("flip-container-prev");
        const flipPagePrev = document.getElementById("flip-page-prev");
        
        const inputPage = document.getElementById("page-input");
        const txtTotal = document.getElementById("page-total");
        
        const btnPrev = document.getElementById("btn-prev");
        const btnNext = document.getElementById("btn-next");

        // Parse Fragment Hash (Misal buka URL: #page=5)
        const hashMatch = window.location.hash.match(/page=(\\d+)/);
        if (hashMatch) {
            currentPage = Math.max(1, parseInt(hashMatch[1], 10));
        }

        /**
         * Kalkulasi skala dinamis berdasarkan ukuran layar
         */
        function calculateScale() {
            // Padding untuk toolbar dan jarak estetika
            const paddingY = isMobile ? 80 : 120; 
            const paddingX = isMobile ? 20 : 100;
            
            // Asumsi rasio umum buku letter (612x792)
            const baseW = 612, baseH = 792;
            
            const availableW = window.innerWidth - paddingX;
            const availableH = window.innerHeight - paddingY;
            
            if (isMobile) {
                // Tampilan 1 halaman di mobile
                return Math.min(availableW / baseW, availableH / baseH, 2.5);
            } else {
                // Tampilan 2 halaman berdampingan (spread) di desktop
                return Math.min((availableW / 2) / baseW, availableH / baseH, 2.5);
            }
        }

        /**
         * Render spesifik halaman ke elemen div (membuat elemen canvas)
         */
        async function renderPageToDiv(container, pageNum) {
            container.innerHTML = '';
            if (pageNum < 1 || pageNum > totalPages) return null;
            
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: currentScale });
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Dukungan layar Retina / High DPI
                const dpr = window.devicePixelRatio || 1;
                canvas.style.width = Math.floor(viewport.width) + 'px';
                canvas.style.height = Math.floor(viewport.height) + 'px';
                canvas.width = Math.floor(viewport.width * dpr);
                canvas.height = Math.floor(viewport.height * dpr);
                
                ctx.scale(dpr, dpr);
                
                container.appendChild(canvas);
                
                await page.render({
                    canvasContext: ctx,
                    viewport: viewport
                }).promise;
                
                return canvas;
            } catch (err) {
                console.error("Gagal render hal " + pageNum, err);
                return null;
            }
        }

        /**
         * Simpan riwayat baca ke server via Beacon API (Background sync)
         */
        function saveReadingProgress() {
            if (!BOOK_ID) return;
            const data = new URLSearchParams();
            data.set('book_id', BOOK_ID.toString());
            data.set('page', currentPage.toString());
            navigator.sendBeacon('/baca/save-page', data);
        }

        /**
         * Render tata letak buku saat ini (1 atau 2 halaman)
         */
        async function renderLayout() {
            btnPrev.disabled = currentPage <= 1;
            btnNext.disabled = currentPage >= totalPages;
            inputPage.value = currentPage;
            
            // Hapus elemen flip sementara
            flipContNext.style.display = 'none';
            flipContPrev.style.display = 'none';
            flipPageNext.classList.remove('flipping');
            flipPagePrev.classList.remove('flipping');
            
            if (isMobile) {
                // Tampilan single page
                await renderPageToDiv(elLeft, currentPage);
                elRight.style.display = 'none';
                elRight.innerHTML = '';
            } else {
                // Tampilan 2 halaman (Spread)
                elRight.style.display = 'block';
                // Jika genap, halaman kiri adalah genap, kanan ganjil. Tapi biasanya buku mulai ganjil di kanan.
                // Untuk kesederhanaan logika ini: kiri genap/sebelumnya, kanan = ganjil.
                let leftNum = currentPage % 2 === 0 ? currentPage - 1 : currentPage;
                // Jika halaman pertama, paksakan di sebelah kanan, kiri kosong (opsional, tapi memakan logika).
                // Logika Halaman Berdampingan:
                await Promise.all([
                    renderPageToDiv(elLeft, leftNum),
                    renderPageToDiv(elRight, leftNum + 1)
                ]);
            }
            
            window.location.hash = 'page=' + currentPage;
            saveReadingProgress();
        }

        /**
         * Navigasi Maju (Animasi Flip)
         */
        async function nextPage() {
            if (isFlipping || currentPage >= totalPages) return;
            isFlipping = true;
            
            const nextTarget = isMobile ? currentPage + 1 : currentPage + 2;
            if (nextTarget > totalPages) {
                if(!isMobile) currentPage = totalPages;
                isFlipping = false;
                return;
            }
            
            if (isMobile) {
                // Tanpa flip ribet di mobile, cukup ganti
                currentPage = nextTarget;
                await renderLayout();
                isFlipping = false;
                return;
            }
            
            // Animasi Desktop
            flipContNext.style.display = 'block';
            flipContNext.style.left = elRight.offsetLeft + 'px';
            flipContNext.style.width = elRight.offsetWidth + 'px';
            flipContNext.style.height = elRight.offsetHeight + 'px';
            
            // Siapkan halaman bayangan untuk di-flip
            await renderPageToDiv(flipPageNext, nextTarget);
            
            // Trigger CSS Transition
            setTimeout(() => {
                flipPageNext.classList.add('flipping');
                setTimeout(async () => {
                    currentPage = nextTarget;
                    await renderLayout();
                    isFlipping = false;
                }, 700); // durasi sama dengan CSS
            }, 50);
        }

        /**
         * Navigasi Mundur (Animasi Flip)
         */
        async function prevPage() {
            if (isFlipping || currentPage <= 1) return;
            isFlipping = true;
            
            const prevTarget = isMobile ? currentPage - 1 : currentPage - 2;
            if (prevTarget < 1) {
                if(!isMobile) currentPage = 1;
                isFlipping = false;
                return;
            }
            
            if (isMobile) {
                currentPage = prevTarget;
                await renderLayout();
                isFlipping = false;
                return;
            }
            
            flipContPrev.style.display = 'block';
            flipContPrev.style.right = (elLeft.parentElement.offsetWidth - elLeft.offsetLeft - elLeft.offsetWidth) + 'px';
            flipContPrev.style.width = elLeft.offsetWidth + 'px';
            flipContPrev.style.height = elLeft.offsetHeight + 'px';
            
            await renderPageToDiv(flipPagePrev, prevTarget);
            
            setTimeout(() => {
                flipPagePrev.classList.add('flipping');
                setTimeout(async () => {
                    currentPage = Math.max(1, prevTarget);
                    await renderLayout();
                    isFlipping = false;
                }, 700);
            }, 50);
        }

        // Fitur Input Manual
        inputPage.addEventListener('change', (e) => {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < 1) val = 1;
            if (val > totalPages) val = totalPages;
            
            // Normalisasi ganjil untuk spread (jika lompat manual)
            if (!isMobile && val % 2 === 0) val = val - 1; 
            
            currentPage = val;
            renderLayout();
        });

        // Zoom Controls
        function zoomIn() { 
            currentScale = Math.min(currentScale + 0.2, 3.5); 
            renderLayout(); 
        }
        function zoomOut() { 
            currentScale = Math.max(currentScale - 0.2, 0.5); 
            renderLayout(); 
        }

        // Event Listener Mouse Click pada Kanvas Halaman
        elLeft.addEventListener('click', e => {
            const rect = elLeft.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width * 0.4) prevPage();
            else if (x > rect.width * 0.6) isMobile ? nextPage() : null;
        });
        elRight.addEventListener('click', e => {
            const rect = elRight.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width * 0.6) nextPage();
        });

        // Keyboard Navigation (Arrow Keys)
        window.addEventListener('keydown', e => {
            if(e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); nextPage(); }
            if(e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prevPage(); }
            if(e.key === 'Home') { e.preventDefault(); currentPage = 1; renderLayout(); }
            if(e.key === 'End') { e.preventDefault(); currentPage = isMobile ? totalPages : (totalPages % 2 === 0 ? totalPages - 1 : totalPages); renderLayout(); }
        });

        // Handle Resize dengan Debounce
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const newIsMobile = window.innerWidth < 768;
                // Jika berpindah orientasi/mode, sesuaikan ulang halaman
                if(newIsMobile !== isMobile) {
                    isMobile = newIsMobile;
                    if(!isMobile && currentPage % 2 === 0) currentPage -= 1;
                }
                currentScale = calculateScale();
                renderLayout();
            }, 250);
        });

        // Auto-hide toolbar (Opsional UX improvement)
        function triggerAutoHide() {
            clearTimeout(autoHideTimer);
            document.body.classList.remove('reading-mode');
            autoHideTimer = setTimeout(() => {
                document.body.classList.add('reading-mode');
            }, 3500); // Sembunyikan setelah diam 3.5 detik
        }
        window.addEventListener('mousemove', triggerAutoHide);
        window.addEventListener('touchstart', triggerAutoHide);

        // INISIALISASI PDF
        const loadingTask = pdfjsLib.getDocument(PDF_URL);
        
        // Progress Listener
        loadingTask.onProgress = function(progressData) {
            const elProgress = document.getElementById('loading-progress');
            if (elProgress && progressData.total > 0) {
                const percent = Math.round((progressData.loaded / progressData.total) * 100);
                elProgress.textContent = percent + '%';
            }
        };

        loadingTask.promise.then(pdf => {
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            txtTotal.textContent = "/ " + totalPages;
            inputPage.max = totalPages;
            
            // Validasi currentPage yang diambil dari Hash URL
            if(currentPage > totalPages) currentPage = totalPages;
            
            currentScale = calculateScale();
            renderLayout();
            
            // Hilangkan loading screen
            const overlay = document.getElementById('loading-overlay');
            overlay.classList.add('hidden');
            setTimeout(() => overlay.remove(), 1000);
            
            triggerAutoHide();
            
        }).catch(err => {
            console.error(err);
            document.querySelector('.loader-ring').style.display = 'none';
            document.querySelector('.loading-text').textContent = 'Gagal memuat Dokumen PDF. Silakan muat ulang halaman.';
            document.getElementById('loading-progress').textContent = err.message || '';
        });
    </script>
</body>
</html>`);
}
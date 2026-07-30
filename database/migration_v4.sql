-- =====================================================
-- Migration v4: Many-to-Many Buku <-> Program Studi
-- 1. Create pivot table book_program
-- 2. Migrate existing data from books.program_id to book_program
-- 3. Drop column program_id from books
-- =====================================================

CREATE TABLE IF NOT EXISTS book_program (
    book_id     INT UNSIGNED NOT NULL,
    program_id  INT UNSIGNED NOT NULL,
    PRIMARY KEY (book_id, program_id),
    CONSTRAINT fk_bp_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_bp_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Migrate existing one-to-many data to pivot
INSERT IGNORE INTO book_program (book_id, program_id)
SELECT id, program_id FROM books WHERE program_id IS NOT NULL;

-- Remove old FK and column
ALTER TABLE books DROP FOREIGN KEY fk_books_program;
ALTER TABLE books DROP COLUMN program_id;

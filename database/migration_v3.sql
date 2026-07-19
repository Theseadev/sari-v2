-- =====================================================
-- SARI v2 - Migration v3
-- Adds: password_resets, bookmarks, reading_history
-- Engine: InnoDB | Charset: utf8mb4_unicode_ci
-- =====================================================

USE sari_v2;

-- -----------------------------------------------------
-- Tabel password_resets: forgot password flow
-- -----------------------------------------------------
CREATE TABLE password_resets (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED    NOT NULL,
    token       VARCHAR(64)     NOT NULL UNIQUE,
    expires_at  DATETIME        NOT NULL,
    used        TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_password_resets_user ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);

-- -----------------------------------------------------
-- Tabel bookmarks: simpan buku oleh user
-- -----------------------------------------------------
CREATE TABLE bookmarks (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED    NOT NULL,
    book_id     INT UNSIGNED    NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_bookmarks_book FOREIGN KEY (book_id) REFERENCES books(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_bookmarks_user_book UNIQUE KEY (user_id, book_id)
) ENGINE=InnoDB;

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_book ON bookmarks(book_id);

-- -----------------------------------------------------
-- Tabel reading_history: tracking buku dibaca user
-- -----------------------------------------------------
CREATE TABLE reading_history (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED    NOT NULL,
    book_id     INT UNSIGNED    NOT NULL,
    last_page   INT UNSIGNED    NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reading_history_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reading_history_book FOREIGN KEY (book_id) REFERENCES books(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_reading_history_user_book UNIQUE KEY (user_id, book_id)
) ENGINE=InnoDB;

CREATE INDEX idx_reading_history_user ON reading_history(user_id);

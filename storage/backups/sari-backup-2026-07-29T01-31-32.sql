-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: sari_v2
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_logs_user` (`user_id`),
  KEY `idx_logs_action` (`action`),
  KEY `idx_logs_created` (`created_at`),
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,NULL,'logout','Logout: Ahmad Pustakawan','local',NULL,'2026-07-19 07:36:33'),(2,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 07:36:47'),(3,1,'delete_user','Menghapus user: Muhammad Fahrul Bahri','local',NULL,'2026-07-19 07:41:14'),(4,1,'delete_user','Menghapus user: Muhammad Fahrul Bahri','local',NULL,'2026-07-19 07:47:33'),(5,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 07:47:44'),(6,NULL,'register','Register: Fahrul','unknown',NULL,'2026-07-19 07:50:07'),(7,NULL,'logout','Logout: Fahrul','local',NULL,'2026-07-19 08:09:12'),(8,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:09:33'),(9,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 08:10:06'),(10,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:10:15'),(11,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 08:11:39'),(12,NULL,'login','Login: Ahmad Pustakawan','unknown',NULL,'2026-07-19 08:11:52'),(13,NULL,'logout','Logout: Ahmad Pustakawan','local',NULL,'2026-07-19 08:29:51'),(14,NULL,'login','Login: Ahmad Pustakawan','unknown',NULL,'2026-07-19 08:30:07'),(15,NULL,'login','Login: Muhammad Fahrul Bahri','unknown',NULL,'2026-07-19 08:33:49'),(16,NULL,'logout','Logout: Muhammad Fahrul Bahri','local',NULL,'2026-07-19 08:34:02'),(17,13,'register','Register: Muhammad Fahrul Bahri','unknown',NULL,'2026-07-19 08:34:31'),(18,13,'logout','Logout: Muhammad Fahrul Bahri','local',NULL,'2026-07-19 08:34:41'),(19,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:34:56'),(20,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 08:46:49'),(21,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:48:28'),(22,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 08:55:24'),(23,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:57:53'),(24,1,'update_book','Mengedit buku: Asuhan Kebidanan pada Ibu Hamil Patologi','local',NULL,'2026-07-19 09:15:36'),(25,1,'update_book','Mengedit buku: Asuhan Kebidanan pada Ibu Hamil Patologi','local',NULL,'2026-07-19 09:15:44'),(26,1,'add_bookmark','Tambah bookmark: Asuhan Kebidanan pada Ibu Hamil Patologi','local',NULL,'2026-07-19 09:15:58'),(27,1,'remove_bookmark','Hapus bookmark: Asuhan Kebidanan pada Ibu Hamil Patologi','local',NULL,'2026-07-19 09:16:21'),(28,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:42:18'),(29,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:44:12'),(30,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:44:14'),(31,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:44:33'),(32,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:45:41'),(33,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:46:00'),(34,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:46:19'),(35,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:47:07'),(36,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:47:09'),(37,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:47:25'),(38,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:49:46'),(39,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:49:47'),(40,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:50:36'),(41,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:52:29'),(42,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:52:31'),(43,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 09:57:41'),(44,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 09:59:14'),(45,1,'create_user','Menambah user: Muhammad Rama Alfiannur','local',NULL,'2026-07-19 10:00:09'),(46,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 10:00:24'),(47,14,'login','Login: Muhammad Rama Alfiannur','unknown',NULL,'2026-07-19 10:00:33'),(48,14,'logout','Logout: Muhammad Rama Alfiannur','local',NULL,'2026-07-19 10:01:22'),(49,14,'login','Login: Muhammad Rama Alfiannur','unknown',NULL,'2026-07-19 10:34:00'),(50,14,'login','Login: Muhammad Rama Alfiannur','unknown',NULL,'2026-07-23 01:22:16'),(51,14,'login','Login: Muhammad Rama Alfiannur','unknown',NULL,'2026-07-23 01:25:25'),(52,14,'login','Login: Muhammad Rama Alfiannur','unknown',NULL,'2026-07-29 01:10:43'),(53,14,'backup_export','Export SQL: sari-backup-2026-07-29T01-22-03.sql','local',NULL,'2026-07-29 01:22:03'),(54,14,'backup_delete','Hapus backup: sari-backup-2026-07-29T01-22-03.sql','local',NULL,'2026-07-29 01:22:27'),(55,14,'backup_delete','Hapus backup: sari-backup-2026-07-28T07-53-40.sql','local',NULL,'2026-07-29 01:22:29'),(56,14,'backup_export','Export SQL: sari-backup-2026-07-29T01-22-30.sql','local',NULL,'2026-07-29 01:22:31'),(57,14,'backup_delete','Hapus backup: sari-backup-2026-07-29T01-22-38.sql','local',NULL,'2026-07-29 01:22:43'),(58,14,'backup_delete','Hapus backup: sari-backup-2026-07-29T01-22-33.sql','local',NULL,'2026-07-29 01:22:45'),(59,14,'backup_delete','Hapus backup: sari-backup-2026-07-29T01-22-30.sql','local',NULL,'2026-07-29 01:22:48'),(60,14,'backup_delete','Hapus backup: sari-backup-2026-07-29T01-22-51.sql','local',NULL,'2026-07-29 01:30:57');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookmarks`
--

DROP TABLE IF EXISTS `bookmarks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookmarks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `book_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bookmarks_user_book` (`user_id`,`book_id`),
  KEY `idx_bookmarks_user` (`user_id`),
  KEY `idx_bookmarks_book` (`book_id`),
  CONSTRAINT `fk_bookmarks_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookmarks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookmarks`
--

LOCK TABLES `bookmarks` WRITE;
/*!40000 ALTER TABLE `bookmarks` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookmarks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int unsigned DEFAULT NULL,
  `program_id` int unsigned DEFAULT NULL,
  `uploaded_by` int unsigned NOT NULL,
  `title` varchar(300) NOT NULL,
  `slug` varchar(350) NOT NULL,
  `author` varchar(250) NOT NULL DEFAULT '',
  `publisher` varchar(200) DEFAULT NULL,
  `publication_year` year DEFAULT NULL,
  `isbn` varchar(30) DEFAULT NULL,
  `description` text,
  `access_type` enum('public','internal') NOT NULL DEFAULT 'public',
  `file_path` varchar(500) NOT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `page_count` smallint unsigned DEFAULT '0',
  `file_size` int unsigned DEFAULT '0',
  `views` int unsigned DEFAULT '0',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_books_access` (`access_type`,`status`),
  KEY `idx_books_category` (`category_id`),
  KEY `idx_books_uploader` (`uploaded_by`),
  KEY `fk_books_program` (`program_id`),
  FULLTEXT KEY `ft_books_search` (`title`,`author`,`description`),
  CONSTRAINT `fk_books_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_books_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_books_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (6,4,1,1,'Asuhan Kebidanan pada Ibu Hamil Patologi','asuhan-kebidanan-ibu-hamil-patologi','Dr. Siti Rahayu, M.Keb','Penerbit Buku Kedokteran EGC',2023,'978-623-7123-45-6','Buku ajar lengkap mengenai asuhan kebidanan komprehensif pada ibu hamil dengan patologi (hipertensi, diabetes, anemia, infeksi). Mencakup assessment, diagnosis, perencanaan, implementasi, dan evaluasi berbasis bukti terkini. Dilengkapi studi kasus dan soal latihan.','internal','skripsi/asuhan-kebidanan-ibu-hamil.pdf','asuhan-kebidanan-ibu-hamil-patologi-1784452544285.jpg',312,8420000,1250,'active','2026-07-19 01:36:15','2026-07-19 09:15:56'),(7,4,2,1,'Dasar-Dasar Keperawatan Medikal Bedah','dasar-keperawatan-medikal-bedah','Nursalam, S.Kp., M.Kes., Ph.D.','Salemba Medika',2022,'978-623-8912-33-1','Referensi standar keperawatan medikal bedah untuk mahasiswa dan praktisi. Membahas konsep dasar, assessment pre-operatif, perawatan intra-operatif, post-operatif, serta manajemen komplikasi. Disertai ilustrasi prosedur dan tabel obat.','public','buku-ajar/keperawatan-medikal-bedah.pdf','keperawatan-medbed-cover.svg',428,12560000,3902,'active','2026-07-19 01:36:15','2026-07-19 10:01:31'),(8,5,3,1,'Farmakologi Klinis untuk Praktisi Kesehatan','farmakologi-klinis-praktisi-kesehatan','Prof. Dr. apt. Andi Wijaya, M.Si.','CV. Trans Info Media',2024,'978-623-9011-77-4','Buku referensi farmakologi klinis dengan pendekatan evidence-based. Mencakup farmakokinetik, farmakodinamik, interaksi obat, efek samping, dan pedoman pemakaian khusus (ibu hamil, lansia, gagal ginjal/hepatik). Dilengkapi monograf 200 obat essential.','internal','referensi/farmakologi-klinis.pdf','farmakologi-klinis-cover.svg',580,15800000,2163,'active','2026-07-19 01:36:15','2026-07-19 08:27:07'),(9,4,9,1,'Pemrograman Web Modern dengan Laravel dan Vue.js','pemrograman-web-laravel-vuejs','Rizki Pratama, S.Kom., M.Cs.','Andi Publisher',2024,'978-623-4567-89-2','Panduan praktis membangun aplikasi full-stack modern menggunakan Laravel 11 (backend API) dan Vue 3 (frontend SPA). Mencakup: REST API, Sanctum authentication, Inertia.js, Tailwind CSS, testing (Pest), deployment (Docker, CI/CD). Cocok untuk mahasiswa Sistem Informasi.','public','skripsi/laravel-vue-modern.pdf','laravel-vue-cover.svg',356,9200000,5454,'active','2026-07-19 01:36:15','2026-07-19 10:35:50'),(10,6,1,1,'Jurnal Ilmu Kesehatan Vol. 12 No. 1','jurnal-ilmu-kesehatan-vol12-no1','Tim Editor JIK','LPPM Universitas Sari Mulia',2024,'ISSN 2541-7890','Edisi khusus: Inovasi Teknologi Kesehatan. Artikel: (1) Telemedicine di Era Pasca-Pandemi, (2) AI untuk Deteksi Dini Kanker Serviks, (3) Aplikasi Mobile Monitoring Ibu Hamil, (4) Robotika Rehabilitasi Stroke, (5) Big Data Analisis Epidemiologi DBD. Peer-reviewed, terindeks SINTA 2.','public','journals/jik-vol12-no1.pdf','jik-vol12-cover.svg',144,4500000,917,'active','2026-07-19 01:36:15','2026-07-19 08:55:28');
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (3,'Disertasi','disertasi','Karya ilmiah mahasiswa S3','2026-07-17 06:42:48'),(4,'Buku Ajar','buku-ajar','Materi perkuliahan resmi','2026-07-17 06:42:48'),(5,'Referensi Umum','referensi-umum','Buku referensi untuk publik','2026-07-17 06:42:48'),(6,'Jurnal','jurnal','Jurnal ilmiah internal kampus','2026-07-17 06:42:48');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculties`
--

DROP TABLE IF EXISTS `faculties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculties` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculties`
--

LOCK TABLES `faculties` WRITE;
/*!40000 ALTER TABLE `faculties` DISABLE KEYS */;
INSERT INTO `faculties` VALUES (1,'Kesehatan','kesehatan','Fakultas Ilmu Kesehatan','2026-07-17 08:23:01'),(2,'Humaniora','humaniora','Fakultas Humaniora','2026-07-17 08:23:01'),(3,'Sains dan Teknologi','sains-dan-teknologi','Fakultas Sains dan Teknologi','2026-07-17 08:23:01'),(4,'Kedokteran Hewan','kedokteran-hewan','Fakultas Kedokteran Hewan','2026-07-17 08:23:01');
/*!40000 ALTER TABLE `faculties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_password_resets_user` (`user_id`),
  KEY `idx_password_resets_token` (`token`),
  CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (1,13,'40092a51781765aba1d58c854988e62b718eb3a6e41acce526eb5735db320583','2026-07-19 09:55:41',0,'2026-07-19 08:55:41');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `programs`
--

DROP TABLE IF EXISTS `programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `programs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `faculty_id` int unsigned NOT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `faculty_id` (`faculty_id`),
  CONSTRAINT `programs_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programs`
--

LOCK TABLES `programs` WRITE;
/*!40000 ALTER TABLE `programs` DISABLE KEYS */;
INSERT INTO `programs` VALUES (1,1,'Kebidanan','kebidanan','2026-07-17 08:23:01'),(2,1,'Keperawatan','keperawatan','2026-07-17 08:23:01'),(3,1,'Farmasi','farmasi','2026-07-17 08:23:01'),(4,1,'Terapan Promosi Kesehatan','terapan-promosi-kesehatan','2026-07-17 08:23:01'),(5,2,'Sarjana Akuntansi','sarjana-akuntansi','2026-07-17 08:23:01'),(6,2,'Sarjana Hukum','sarjana-hukum','2026-07-17 08:23:01'),(7,2,'Sarjana Manajemen','sarjana-manajemen','2026-07-17 08:23:01'),(8,2,'Pendidikan Bahasa Inggris','pendidikan-bahasa-inggris','2026-07-17 08:23:01'),(9,3,'Sistem Informasi','sistem-informasi','2026-07-17 08:23:01'),(10,3,'Teknik Industri','teknik-industri','2026-07-17 08:23:01'),(11,3,'Teknologi Informasi','teknologi-informasi','2026-07-17 08:23:01'),(12,4,'Kedokteran Hewan','kedokteran-hewan','2026-07-17 08:23:01');
/*!40000 ALTER TABLE `programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reading_history`
--

DROP TABLE IF EXISTS `reading_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reading_history` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `book_id` int unsigned NOT NULL,
  `last_page` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reading_history_user_book` (`user_id`,`book_id`),
  KEY `fk_reading_history_book` (`book_id`),
  KEY `idx_reading_history_user` (`user_id`),
  CONSTRAINT `fk_reading_history_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reading_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reading_history`
--

LOCK TABLES `reading_history` WRITE;
/*!40000 ALTER TABLE `reading_history` DISABLE KEYS */;
INSERT INTO `reading_history` VALUES (19,1,6,0,'2026-07-19 09:15:49','2026-07-19 09:15:56'),(22,1,7,0,'2026-07-19 09:54:20','2026-07-19 09:54:20'),(23,14,9,0,'2026-07-19 10:35:50','2026-07-19 10:35:50');
/*!40000 ALTER TABLE `reading_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'super_admin','Kontrol penuh sistem & manajemen admin','2026-07-17 06:42:48'),(2,'admin','Pustakawan — CRUD buku, kategori, user','2026-07-17 06:42:48'),(3,'mahasiswa','Mahasiswa — akses semua buku publik & internal','2026-07-17 06:42:48'),(4,'tamu','Masyarakat umum — hanya buku publik','2026-07-17 06:42:48');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `role_id` tinyint unsigned NOT NULL,
  `username` varchar(100) NOT NULL,
  `name` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nim_nip` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'super','Super Administrator','superadmin@sarimulia.banjarmasin','$2a$10$RRE7wuN1b3Pgx..R/w1gZOL9Aj4CKeN0dQKwt895cxYkK7pOBFK1m','196001012010011001','active',NULL,'2026-07-17 06:42:48','2026-07-19 10:11:15'),(5,4,'tamu01','Masyarakat Umum','umum@contoh.com','$2a$10$RRE7wuN1b3Pgx..R/w1gZOL9Aj4CKeN0dQKwt895cxYkK7pOBFK1m',NULL,'active',NULL,'2026-07-17 06:42:48','2026-07-17 07:27:37'),(13,4,'fahrulbahri0520','Muhammad Fahrul Bahri','fahrulbahri0520@gmail.com','$2a$10$.t8scP31J7R3c6qmsGYod.dzWIdkfXi9rWIRqrTenGPdhgZHrcTz.',NULL,'active',NULL,'2026-07-19 08:34:31','2026-07-19 08:34:31'),(14,1,'Rama Alfiannur','Muhammad Rama Alfiannur','Rama@gmail.com','$2a$10$X0gMThzbkZPwtvzRwXN.z.Cp1v6BgKdBivR0etgP2BBOXwodYHvbC',NULL,'active',NULL,'2026-07-19 10:00:09','2026-07-19 10:10:10'),(15,1,'fahrul_admin','Fahrul Bahri','Fahrul@gmail.com','$2a$10$VZiAGC5h3WLfaqPoF6SsieUxNrffuCi0Z2ZDWbEMVqq2CQ8b/2hDS','NIP001','active',NULL,'2026-07-19 10:10:10','2026-07-19 10:10:10'),(16,2,'pustakawan01','Pustakawan 01','Pustakawan01@gmail.com','$2a$10$d6PWcBFatVMrx9/dwuzxseeNAX8Dj.vD5srVdygaP9V/tTeEB8O1O','NIP002','active',NULL,'2026-07-19 10:10:10','2026-07-19 10:10:10'),(17,3,'mahasiswa01','Mahasiswa 01','Mahasiswa01@gmail.com','$2a$10$MvNQFVbU376Tut7EVe//quKK4ua6yUYJgXjHEit8wyOn9zQbHobpq','NIM001','active',NULL,'2026-07-19 10:10:10','2026-07-19 10:10:10');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-29  9:31:33

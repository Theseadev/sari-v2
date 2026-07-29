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
) ENGINE=InnoDB AUTO_INCREMENT=150 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (7,NULL,'logout','Logout: Fahrul','local',NULL,'2026-07-19 08:09:12'),(8,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:09:33'),(9,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 08:10:06'),(10,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:10:15'),(11,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 08:11:39'),(12,NULL,'login','Login: Ahmad Pustakawan','unknown',NULL,'2026-07-19 08:11:52'),(13,NULL,'logout','Logout: Ahmad Pustakawan','local',NULL,'2026-07-19 08:29:51'),(14,NULL,'login','Login: Ahmad Pustakawan','unknown',NULL,'2026-07-19 08:30:07'),(15,NULL,'login','Login: Muhammad Fahrul Bahri','unknown',NULL,'2026-07-19 08:33:49'),(16,NULL,'logout','Logout: Muhammad Fahrul Bahri','local',NULL,'2026-07-19 08:34:02'),(17,13,'register','Register: Muhammad Fahrul Bahri','unknown',NULL,'2026-07-19 08:34:31'),(18,13,'logout','Logout: Muhammad Fahrul Bahri','local',NULL,'2026-07-19 08:34:41'),(19,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:34:56'),(20,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 08:46:49'),(21,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:48:28'),(22,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 08:55:24'),(23,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 08:57:53'),(24,1,'update_book','Mengedit buku: Asuhan Kebidanan pada Ibu Hamil Patologi','local',NULL,'2026-07-19 09:15:36'),(25,1,'update_book','Mengedit buku: Asuhan Kebidanan pada Ibu Hamil Patologi','local',NULL,'2026-07-19 09:15:44'),(26,1,'add_bookmark','Tambah bookmark: Asuhan Kebidanan pada Ibu Hamil Patologi','local',NULL,'2026-07-19 09:15:58'),(27,1,'remove_bookmark','Hapus bookmark: Asuhan Kebidanan pada Ibu Hamil Patologi','local',NULL,'2026-07-19 09:16:21'),(28,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:42:18'),(29,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:44:12'),(30,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:44:14'),(31,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:44:33'),(32,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:45:41'),(33,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:46:00'),(34,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:46:19'),(35,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:47:07'),(36,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:47:09'),(37,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:47:25'),(38,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:49:46'),(39,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:49:47'),(40,1,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-19 09:50:36'),(41,1,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-19 09:52:29'),(42,1,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-19 09:52:31'),(43,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 09:57:41'),(44,1,'login','Login: Super Administrator','unknown',NULL,'2026-07-19 09:59:14'),(45,1,'create_user','Menambah user: Muhammad Rama Alfiannur','local',NULL,'2026-07-19 10:00:09'),(46,1,'logout','Logout: Super Administrator','local',NULL,'2026-07-19 10:00:24'),(47,14,'login','Login: Muhammad Rama Alfiannur','unknown',NULL,'2026-07-19 10:00:33'),(48,14,'logout','Logout: Muhammad Rama Alfiannur','local',NULL,'2026-07-19 10:01:22'),(49,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-19 10:13:50'),(50,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-19 10:14:01'),(51,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-19 10:19:03'),(52,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-19 10:19:14'),(53,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-20 00:41:00'),(54,15,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-20 00:42:15'),(55,15,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-20 00:47:38'),(56,15,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-20 00:47:40'),(57,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-20 00:48:46'),(58,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-20 01:02:29'),(59,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-20 01:13:02'),(60,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-20 02:31:34'),(61,15,'bulk_upload','Upload bulk 2 buku dari Excel','local',NULL,'2026-07-20 02:33:37'),(62,15,'delete_book','Menghapus buku: Buku Ajar Matematika','local',NULL,'2026-07-20 02:33:53'),(63,15,'delete_book','Menghapus buku: Tesis Analisis Data','local',NULL,'2026-07-20 02:33:55'),(64,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-20 02:36:07'),(65,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-20 05:54:06'),(66,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-20 08:24:53'),(67,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-20 08:25:25'),(68,15,'add_bookmark','Tambah bookmark: Buku Ajar Jaringan Komputer','local',NULL,'2026-07-20 08:25:44'),(69,15,'remove_bookmark','Hapus bookmark: Buku Ajar Jaringan Komputer','local',NULL,'2026-07-20 08:25:54'),(70,15,'add_bookmark','Tambah bookmark: Buku Ajar Basis Data','local',NULL,'2026-07-20 08:26:09'),(71,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-20 08:27:40'),(72,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-20 08:30:45'),(73,15,'add_bookmark','Tambah bookmark: Buku Ajar Jaringan Komputer','local',NULL,'2026-07-21 02:05:09'),(74,15,'remove_bookmark','Hapus bookmark: Buku Ajar Jaringan Komputer','local',NULL,'2026-07-21 02:05:12'),(75,15,'add_bookmark','Tambah bookmark: Buku Ajar Jaringan Komputer','local',NULL,'2026-07-21 02:05:13'),(76,15,'remove_bookmark','Hapus bookmark: Buku Ajar Jaringan Komputer','local',NULL,'2026-07-21 02:06:19'),(77,15,'add_bookmark','Tambah bookmark: Buku Ajar Jaringan Komputer','local',NULL,'2026-07-21 02:08:41'),(78,15,'remove_bookmark','Hapus bookmark: Buku Ajar Jaringan Komputer','local',NULL,'2026-07-21 02:08:42'),(79,15,'add_bookmark','Tambah bookmark: Farmakologi Klinis untuk Praktisi Kesehatan','local',NULL,'2026-07-21 02:08:49'),(80,15,'remove_bookmark','Hapus bookmark: Farmakologi Klinis untuk Praktisi Kesehatan','local',NULL,'2026-07-21 02:08:50'),(81,15,'add_bookmark','Tambah bookmark: Buku Ajar Data Mining','local',NULL,'2026-07-21 02:43:20'),(82,15,'unblock_user','Membuka blokir user: Pustakawan 01','local',NULL,'2026-07-21 07:09:22'),(83,16,'login','Login: Pustakawan 01','unknown',NULL,'2026-07-21 07:09:45'),(84,16,'logout','Logout: Pustakawan 01','local',NULL,'2026-07-21 07:09:49'),(85,15,'unblock_user','Membuka blokir user: Pustakawan 01','local',NULL,'2026-07-21 07:11:46'),(86,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-22 01:19:58'),(87,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-22 01:34:14'),(88,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-22 01:51:12'),(89,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-22 01:53:00'),(90,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-22 02:02:05'),(91,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-22 02:06:07'),(92,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-22 02:47:38'),(93,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-22 03:25:19'),(94,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-22 03:35:16'),(95,15,'create_book','Menambah buku: The Grapes of Wrath','local',NULL,'2026-07-22 06:56:36'),(96,15,'delete_book','Menghapus buku: The Grapes of Wrath','local',NULL,'2026-07-22 06:56:39'),(97,15,'create_book','Menambah buku: To Kill a Mockingbird','local',NULL,'2026-07-22 07:01:01'),(98,15,'delete_book','Menghapus buku: To Kill a Mockingbird','local',NULL,'2026-07-22 07:01:10'),(99,15,'delete_book','Menghapus buku: Asuhan Kebidanan pada Ibu Hamil Patologi','local',NULL,'2026-07-22 07:31:53'),(100,15,'delete_book','Menghapus buku: Buku Ajar Pemrograman Web','local',NULL,'2026-07-22 07:32:33'),(101,15,'delete_book','Menghapus buku: Buku Ajar Algoritma','local',NULL,'2026-07-22 07:32:35'),(102,15,'delete_book','Menghapus buku: Buku Ajar Data Mining','local',NULL,'2026-07-22 07:32:37'),(103,15,'delete_book','Menghapus buku: Buku Ajar Jaringan Komputer','local',NULL,'2026-07-22 07:32:38'),(104,15,'delete_book','Menghapus buku: Buku Ajar Basis Data','local',NULL,'2026-07-22 07:32:40'),(105,15,'delete_book','Menghapus buku: Buku Ajar Statistika','local',NULL,'2026-07-22 07:32:41'),(106,15,'delete_book','Menghapus buku: Buku Ajar Kecerdasan Buatan','local',NULL,'2026-07-22 07:32:44'),(107,15,'delete_book','Menghapus buku: Buku Ajar Sistem Operasi','local',NULL,'2026-07-22 07:32:46'),(108,15,'delete_book','Menghapus buku: Buku Ajar Rekayasa Perangkat Lunak','local',NULL,'2026-07-22 07:32:47'),(109,15,'delete_book','Menghapus buku: Buku Ajar Grafika Komputer','local',NULL,'2026-07-22 07:32:49'),(110,15,'delete_book','Menghapus buku: Buku Ajar Komputasi Awan','local',NULL,'2026-07-22 07:32:50'),(111,15,'delete_book','Menghapus buku: Buku Ajar Keamanan Siber','local',NULL,'2026-07-22 07:33:29'),(112,15,'delete_book','Menghapus buku: Dasar-Dasar Keperawatan Medikal Bedah','local',NULL,'2026-07-22 07:33:31'),(113,15,'delete_book','Menghapus buku: Farmakologi Klinis untuk Praktisi Kesehatan','local',NULL,'2026-07-22 07:33:32'),(114,15,'delete_book','Menghapus buku: Pemrograman Web Modern dengan Laravel dan Vue.js','local',NULL,'2026-07-22 07:33:34'),(115,15,'delete_book','Menghapus buku: Jurnal Ilmu Kesehatan Vol. 12 No. 1','local',NULL,'2026-07-22 07:33:36'),(116,15,'create_book','Menambah buku: To Kill a Mockingbird','local',NULL,'2026-07-23 01:55:13'),(117,15,'add_bookmark','Tambah bookmark: To Kill a Mockingbird','local',NULL,'2026-07-23 01:56:10'),(118,15,'remove_bookmark','Hapus bookmark: To Kill a Mockingbird','local',NULL,'2026-07-23 01:56:13'),(119,15,'add_bookmark','Tambah bookmark: To Kill a Mockingbird','local',NULL,'2026-07-23 01:56:15'),(120,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-23 02:09:37'),(121,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-23 02:10:53'),(122,15,'remove_bookmark','Hapus bookmark: To Kill a Mockingbird','local',NULL,'2026-07-23 07:35:15'),(123,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-25 06:25:58'),(124,15,'create_book','Menambah buku: The Grapes of Wrath','local',NULL,'2026-07-25 06:26:33'),(125,15,'update_book','Mengedit buku: To Kill a Mockingbird','local',NULL,'2026-07-25 06:28:30'),(126,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-27 02:35:30'),(127,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-27 06:30:00'),(128,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-27 06:48:43'),(129,15,'logout','Logout: Fahrul Bahri','local',NULL,'2026-07-27 07:37:30'),(130,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-27 07:38:19'),(131,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T03-47-46.sql','local',NULL,'2026-07-28 03:50:44'),(132,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T03-52-30.sql','local',NULL,'2026-07-28 03:52:33'),(133,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T03-52-26.sql','local',NULL,'2026-07-28 03:52:35'),(134,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T03-50-51.sql','local',NULL,'2026-07-28 03:52:36'),(135,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T03-55-50.sql','local',NULL,'2026-07-28 03:55:59'),(136,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T03-55-28.sql','local',NULL,'2026-07-28 03:56:02'),(137,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T03-58-04.sql','local',NULL,'2026-07-28 03:59:17'),(138,15,'backup_export','Export SQL: sari-backup-2026-07-28T04-02-28.sql','local',NULL,'2026-07-28 04:02:29'),(139,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T04-02-28.sql','local',NULL,'2026-07-28 04:02:46'),(140,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T04-02-29.sql','local',NULL,'2026-07-28 04:02:48'),(141,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T04-02-26.sql','local',NULL,'2026-07-28 04:02:54'),(142,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T04-02-16.sql','local',NULL,'2026-07-28 04:02:59'),(143,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T04-03-00.sql','local',NULL,'2026-07-28 06:04:19'),(144,15,'backup_export','Export SQL: sari-backup-2026-07-28T06-19-53.sql','local',NULL,'2026-07-28 06:19:53'),(145,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T06-19-53.sql','local',NULL,'2026-07-28 06:19:59'),(146,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T06-19-21.sql','local',NULL,'2026-07-28 06:20:01'),(147,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T06-19-21_tmp.sql','local',NULL,'2026-07-28 06:20:02'),(148,15,'backup_delete','Hapus backup: sari-backup-2026-07-28T07-31-17.sql','local',NULL,'2026-07-28 07:36:49'),(149,15,'login','Login: Fahrul Bahri','unknown',NULL,'2026-07-28 07:38:50');
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (39,NULL,3,15,'To Kill a Mockingbird','to-kill-a-mockingbird','Harper Lee','Harper Perennial Modern Classics',2006,'9780061120084','Salah satu cerita yang paling dicintai sepanjang masa, To Kill a Mockingbird telah diterjemahkan ke lebih dari empat puluh bahasa, terjual lebih dari tiga puluh juta kopi di seluruh dunia, menjadi dasar film yang sangat populer, dan terpilih sebagai salah satu novel terbaik abad kedua puluh oleh pustakawan di seluruh negeri. Sebuah kisah yang mencekam, menyayat hati, dan sangat luar biasa tentang masa dewasa di wilayah Selatan yang diracuni oleh prasangka jahat, film ini memandang dunia yang sangat indah dan ketidakadilan yang kejam dari sudut pandang seorang gadis muda, ketika ayahnya - seorang pengacara lokal yang berjuang keras - mempertaruhkan segalanya untuk membela seorang pria kulit hitam yang dituduh melakukan kejahatan mengerikan secara tidak adil.','public','to-kill-a-mockingbird-1784771713376.pdf','ol-9780061120084.jpg',4,0,54,'active','2026-07-23 01:55:13','2026-07-27 07:31:26'),(40,NULL,2,15,'The Grapes of Wrath','the-grapes-of-wrath','John Steinbeck','Penguin Books',2006,'9780143039433','Menggambarkan kesulitan dan penderitaan yang dialami keluarga Joad saat mereka melakukan perjalanan dari Oklahoma ke California selama masa Depresi.','public','the-grapes-of-wrath-1784960793452.pdf','ol-9780143039433.jpg',6,0,15,'active','2026-07-25 06:26:33','2026-07-27 07:31:27');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=226 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reading_history`
--

LOCK TABLES `reading_history` WRITE;
/*!40000 ALTER TABLE `reading_history` DISABLE KEYS */;
INSERT INTO `reading_history` VALUES (163,15,39,0,'2026-07-23 01:56:01','2026-07-27 07:31:26'),(178,15,40,0,'2026-07-25 06:26:39','2026-07-27 07:31:27');
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
  `failed_login_attempts` int unsigned NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
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
INSERT INTO `users` VALUES (1,1,'super','Super Administrator','superadmin@sarimulia.banjarmasin','$2a$10$RRE7wuN1b3Pgx..R/w1gZOL9Aj4CKeN0dQKwt895cxYkK7pOBFK1m','196001012010011001','active',0,NULL,NULL,'2026-07-17 06:42:48','2026-07-19 10:11:15'),(5,4,'tamu01','Masyarakat Umum','umum@contoh.com','$2a$10$RRE7wuN1b3Pgx..R/w1gZOL9Aj4CKeN0dQKwt895cxYkK7pOBFK1m',NULL,'active',0,NULL,NULL,'2026-07-17 06:42:48','2026-07-17 07:27:37'),(13,4,'fahrulbahri0520','Muhammad Fahrul Bahri','fahrulbahri0520@gmail.com','$2a$10$.t8scP31J7R3c6qmsGYod.dzWIdkfXi9rWIRqrTenGPdhgZHrcTz.',NULL,'active',0,NULL,NULL,'2026-07-19 08:34:31','2026-07-19 08:34:31'),(14,1,'Rama Alfiannur','Muhammad Rama Alfiannur','Rama@gmail.com','$2a$10$X0gMThzbkZPwtvzRwXN.z.Cp1v6BgKdBivR0etgP2BBOXwodYHvbC',NULL,'active',0,NULL,NULL,'2026-07-19 10:00:09','2026-07-19 10:10:10'),(15,1,'fahrul_admin','Fahrul Bahri','Fahrul@gmail.com','$2a$10$VZiAGC5h3WLfaqPoF6SsieUxNrffuCi0Z2ZDWbEMVqq2CQ8b/2hDS','NIP001','active',0,NULL,NULL,'2026-07-19 10:10:10','2026-07-19 10:10:10'),(16,2,'pustakawan01','Pustakawan 01','Pustakawan01@gmail.com','$2a$10$d6PWcBFatVMrx9/dwuzxseeNAX8Dj.vD5srVdygaP9V/tTeEB8O1O','NIP002','active',0,NULL,NULL,'2026-07-19 10:10:10','2026-07-21 07:11:46'),(17,3,'mahasiswa01','Mahasiswa 01','Mahasiswa01@gmail.com','$2a$10$MvNQFVbU376Tut7EVe//quKK4ua6yUYJgXjHEit8wyOn9zQbHobpq','NIM001','active',0,NULL,NULL,'2026-07-19 10:10:10','2026-07-19 10:10:10');
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

-- Dump completed on 2026-07-28 15:42:42

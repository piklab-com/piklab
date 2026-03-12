-- =========================================
-- Teras Medya - MySQL Veritabanı Kurulum Scripti
-- Sunucunuzdaki phpMyAdmin üzerinden ya da terminal ile çalıştırın:
-- mysql -u KULLANICI -p VERITABANI_ADI < database.sql
-- =========================================

SET NAMES utf8mb4;
SET time_zone = '+03:00';

-- ─── USERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','editor','client') NOT NULL DEFAULT 'client',
  `company_details` JSON DEFAULT NULL,
  `onboarded` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Varsayılan Admin Kullanıcısı (şifre: admin123)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password`, `role`, `onboarded`)
VALUES (1, 'Admin', 'admin@terasmedya.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- ─── PACKAGES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `packages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `features` JSON DEFAULT NULL,
  `period` VARCHAR(50) DEFAULT 'aylık',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `highlighted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `packages` (`id`, `name`, `price`, `features`, `period`, `highlighted`) VALUES
(1, 'Başlangıç', 4999.00, '["4 Sosyal Medya Tasarımı","1 Tanıtım Videosu (15sn)","Temel SEO Desteği","E-Posta Desteği"]', 'aylık', 0),
(2, 'Profesyonel', 12499.00, '["12 Sosyal Medya Tasarımı","3 Tanıtım Videosu (30sn)","Gelişmiş SEO & ADS","7/24 Destek","Marka Sesi Klonlama"]', 'aylık', 1),
(3, 'Enterprise', 29999.00, '["Sınırsız Tasarım","Sınırsız Video Prodüksiyon","Özel Hesap Yöneticisi","Stratejik Danışmanlık","7/24 Teknik Destek"]', 'aylık', 0);

-- ─── PROJECTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `status` ENUM('onboarding','production','review','done') NOT NULL DEFAULT 'onboarding',
  `service_type` VARCHAR(100) DEFAULT NULL,
  `deadline` DATE DEFAULT NULL,
  `budget` DECIMAL(12,2) DEFAULT 0,
  `brief` TEXT DEFAULT NULL,
  `package_id` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── TASKS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED DEFAULT NULL,
  `client_id` INT UNSIGNED DEFAULT NULL,
  `assigned_to` INT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `column_status` ENUM('brief','todo','progress','qa','done','review','revision','approved') NOT NULL DEFAULT 'brief',
  `type` VARCHAR(50) DEFAULT 'other',
  `priority` ENUM('low','medium','high') DEFAULT 'medium',
  `asset_url` VARCHAR(500) DEFAULT NULL,
  `scheduled_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── MESSAGES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED DEFAULT NULL,
  `task_id` INT UNSIGNED DEFAULT NULL,
  `sender_id` INT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL,
  `attachment_url` VARCHAR(500) DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── INVOICES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT UNSIGNED NOT NULL,
  `project_id` INT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `status` ENUM('paid','pending','overdue') NOT NULL DEFAULT 'pending',
  `payment_method` ENUM('cc','eft','cash','current') DEFAULT NULL,
  `due_date` DATE DEFAULT NULL,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── NOTIFICATIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `type` VARCHAR(50) DEFAULT 'info',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `is_seen` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SETTINGS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `settings` (`key`, `value`) VALUES
('heroTitle', 'TERAS MEDYA: YENİ NESİL REKLAMCILIK'),
('heroSubtitle', 'EN İYİLER İÇİN EN İYİSİ.'),
('heroDescription', 'Reklamcılığın zirvesinde, Teras Medya ile markanızın hikayesini yeniden yazıyoruz.'),
('contactEmail', 'info@terasmedya.com'),
('contactPhone', '+90 540 005 25 20'),
('address', 'Enntepe Mall, Konya'),
('instagram', 'https://instagram.com/terasmedya'),
('facebook', 'https://facebook.com/terasmedya'),
('satisfactionRate', '98');

-- ─── SERVICES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT 'Activity',
  `features` JSON DEFAULT NULL,
  `content` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `services` (`title`, `slug`, `description`, `icon`, `content`) VALUES
('Sosyal Medya Yönetimi','sosyal-medya-yonetimi','Markanızın dijital dünyadaki sesini profesyonelce yönetiyoruz.','Share2','Yaratıcı içerikler, etkileşim odaklı stratejiler ve detaylı raporlama ile fark yaratın.'),
('Video Prodüksiyon','video-produksiyon','Etkileyici ve profesyonel video içerikleri üretiyoruz.','Video','Tanıtım filmleri, sosyal medya videoları ve reklam prodüksiyonları.'),
('Grafik Tasarım','grafik-tasarim','Görsel kimliğinizi modern ve çarpıcı tasarımlarla güçlendiriyoruz.','Palette','Logo tasarımı, kurumsal kimlik ve dijital reklam görselleri.'),
('Dijital Strateji','dijital-strateji-danismanlik','İş süreçlerinizi optimize eden dijital yol haritaları.','Target','Veri analizi, pazar araştırması ve dijital dönüşüm stratejileri.'),
('FPV Drone','fpv-drone','FPV drone çekimleriyle markanızı zirveye taşıyın.','Activity',''),
('Kurumsal Kimlik','kurumsal-kimlik','Kurumsal kimliğinizi sıfırdan tasarlıyoruz.','Activity',''),
('SEO & ADS','seo-ads','Arama motoru ve reklam yönetimi.','Activity',''),
('Performans Pazarlama','performans-pazarlama','ROI odaklı reklam kampanyaları.','Activity','');

-- ─── PORTFOLIO ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `portfolio` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `type` ENUM('image','video','link') DEFAULT 'image',
  `url` VARCHAR(500) DEFAULT NULL,
  `thumbnail` VARCHAR(500) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── REFERENCES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `brand_references` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `brand_references` (`name`, `logo_url`) VALUES
('Tesla','https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png'),
('Nike','https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg'),
('SpaceX','https://upload.wikimedia.org/wikipedia/commons/2/2e/SpaceX_logo_black.svg'),
('Apple','https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg');

-- ─── TASK COMMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `task_comments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CONTACT SUBMISSIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `contact_submissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(255) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

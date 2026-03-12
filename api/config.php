<?php
/**
 * Teras Medya - Veritabanı Konfigürasyonu
 * ─────────────────────────────────────────
 * Hosting panelinizdeki (cPanel vb.) MySQL bilgilerini buraya girin.
 * Daha güvenli kullanım için .env.local dosyası da oluşturabilirsiniz.
 */

// .env.local dosyası varsa yükle (opsiyonel)
$envFile = __DIR__ . '/../.env.local';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            [$key, $val] = array_map('trim', explode('=', $line, 2));
            $_ENV[$key] = $val;
        }
    }
}

// ─── MySQL Bağlantı Bilgileri ────────────────────────────────────────
// Bu değerleri hosting panelinizden alın.
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'terasmedya');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');
define('DB_PORT', $_ENV['DB_PORT'] ?? '3306');

// ─── JWT Secret ──────────────────────────────────────────────────────
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'teras-medya-super-secret-2025');

// ─── Dosya Yükleme ───────────────────────────────────────────────────
define('UPLOADS_DIR', __DIR__ . '/../uploads/');
define('UPLOADS_URL', '/uploads/');

// ─── Uygulama Modu ───────────────────────────────────────────────────
// 'mysql' veya 'json' — MySQL kurulamazsa json ile devam et
define('DB_MODE', $_ENV['DB_MODE'] ?? 'mysql');

// ─── MySQL Bağlantı Fonksiyonu ───────────────────────────────────────
function getDB(): ?PDO {
    if (DB_MODE !== 'mysql') return null;
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        // MySQL bağlantısı başarısız — JSON moduna düş
        return null;
    }
}

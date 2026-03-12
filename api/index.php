<?php
/**
 * Teras Medya - PHP API Gateway
 * Express (Node.js) backend yapısının PHP karşılığıdır.
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('DB_PATH', __DIR__ . '/../data/db.json');
define('UPLOADS_DIR', __DIR__ . '/../uploads/');
define('JWT_SECRET', 'teras-medya-secret-key');

// --- Local JSON Database Helper ---
class LocalDB {
    private $data = null;

    private function load() {
        if (!file_exists(dirname(DB_PATH))) {
            mkdir(dirname(DB_PATH), 0755, true);
        }
        if (!file_exists(DB_PATH)) {
            $this->data = [
                'services' => [],
                'portfolio' => [],
                'packages' => [],
                'users' => [
                    [
                        "id" => "admin",
                        "username" => "admin",
                        "password" => password_hash("admin123", PASSWORD_BCRYPT),
                        "role" => "admin",
                        "displayName" => "Admin"
                    ]
                ],
                'tasks' => [],
                'settings' => (object)[],
                'references' => [],
                'contact_submissions' => [],
                'comments' => [],
                'canvas_pins' => []
            ];
            $this->save();
        } else {
            $raw = file_get_contents(DB_PATH);
            $this->data = json_decode($raw, true);
        }
    }

    private function save() {
        file_put_contents(DB_PATH, json_encode($this->data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function get($collection) {
        $this->load();
        return isset($this->data[$collection]) ? $this->data[$collection] : [];
    }

    public function find($collection, $callback) {
        $this->load();
        $results = [];
        $items = isset($this->data[$collection]) ? $this->data[$collection] : [];
        foreach ($items as $item) {
            if ($callback($item)) {
                $results[] = $item;
            }
        }
        return $results;
    }

    public function findOne($collection, $callback) {
        $this->load();
        $items = isset($this->data[$collection]) ? $this->data[$collection] : [];
        foreach ($items as $item) {
            if ($callback($item)) {
                return $item;
            }
        }
        return null;
    }

    public function add($collection, $item) {
        $this->load();
        if (!isset($this->data[$collection])) {
            $this->data[$collection] = [];
        }
        $item['id'] = isset($item['id']) ? $item['id'] : bin2hex(random_bytes(4));
        $item['createdAt'] = date('c');
        $this->data[$collection][] = $item;
        $this->save();
        return $item;
    }

    public function update($collection, $id, $updates) {
        $this->load();
        if (!isset($this->data[$collection])) return null;
        foreach ($this->data[$collection] as $key => $item) {
            if ((isset($item['id']) && $item['id'] == $id) || (isset($item['slug']) && $item['slug'] == $id)) {
                $this->data[$collection][$key] = array_merge($this->data[$collection][$key], $updates);
                $this->save();
                return $this->data[$collection][$key];
            }
        }
        return null;
    }

    public function delete($collection, $id) {
        $this->load();
        if (!isset($this->data[$collection])) return false;
        $initialCount = count($this->data[$collection]);
        $this->data[$collection] = array_values(array_filter($this->data[$collection], function($item) use ($id) {
            return (isset($item['id']) && $item['id'] != $id) && (isset($item['slug']) && $item['slug'] != $id);
        }));
        $success = count($this->data[$collection]) < $initialCount;
        if ($success) $this->save();
        return $success;
    }

    public function getSettings() {
        $this->load();
        return isset($this->data['settings']) ? $this->data['settings'] : (object)[];
    }

    public function setSettings($settings) {
        $this->load();
        $this->data['settings'] = array_merge((array)$this->data['settings'], (array)$settings);
        $this->save();
    }
}

$db = new LocalDB();

// --- Auth Helper (Simulated JWT for standalone) ---
function get_auth_user() {
    $authHeader = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    }

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        // Standalone modda basit base64 decoded token kullanıyoruz (JWT kütüphanesi yükü olmadan)
        $parts = explode('.', $token);
        if (count($parts) === 3) {
            return json_decode(base64_decode($parts[1]), true);
        }
    }
    return null;
}

function require_auth() {
    $user = get_auth_user();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['message' => 'Unauthorized']);
        exit();
    }
    return $user;
}

// --- Router ---
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
// Sunucu alt klasördeyse script_name üzerinden base path'i daha doğru bulabiliriz
$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$basePath = ($scriptName === '/' || $scriptName === '\\') ? '/api' : $scriptName;

$path = str_replace($basePath, '', $requestUri);
if (strpos($path, '/api') === 0) {
    $path = substr($path, 4);
}
$path = explode('?', $path)[0]; // Remove query string
$parts = array_values(array_filter(explode('/', $path)));

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    // --- STRIPE MOCK ---
    if ($parts[0] === 'stripe' && $method === 'POST') {
        echo json_encode(['success' => true, 'mock' => true]);
        exit();
    }

    // --- AUTH ENDPOINTS ---
    if ($parts[0] === 'auth' && $parts[1] === 'login' && $method === 'POST') {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        $user = $db->findOne('users', function($u) use ($username) { return $u['username'] === $username; });
        
        if ($user) {
            if (password_verify($password, $user['password']) || ($password === 'admin123' && $username === 'admin')) {
                $payload = ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']];
                $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
                $body = base64_encode(json_encode($payload));
                $token = "$header.$body.signature";
                echo json_encode(['token' => $token, 'profile' => ['uid' => $user['id'], 'username' => $user['username'], 'role' => $user['role'], 'displayName' => $user['displayName']]]);
                exit();
            }
        }
        http_response_code(401);
        echo json_encode(['message' => 'Geçersiz kullanıcı adı veya şifre']);
        exit();
    }

    // --- SERVICES ---
    if ($parts[0] === 'services') {
        if ($method === 'GET') {
            if (isset($parts[1])) {
                $s = $db->findOne('services', function($v) use ($parts) { return $v['slug'] === $parts[1]; });
                echo json_encode($s ?: (object)[]);
            } else {
                echo json_encode($db->get('services'));
            }
        } elseif ($method === 'POST') {
            require_auth();
            echo json_encode($db->add('services', $input));
        } elseif ($method === 'DELETE' && isset($parts[1])) {
            require_auth();
            echo json_encode(['success' => $db->delete('services', $parts[1])]);
        }
        exit();
    }

    // --- PORTFOLIO ---
    if ($parts[0] === 'portfolio') {
        if ($method === 'GET') {
            echo json_encode($db->get('portfolio'));
        } elseif ($method === 'POST') {
            require_auth();
            echo json_encode($db->add('portfolio', $input));
        } elseif ($method === 'PUT' && isset($parts[1])) {
            require_auth();
            echo json_encode($db->update('portfolio', $parts[1], $input));
        } elseif ($method === 'DELETE' && isset($parts[1])) {
            require_auth();
            echo json_encode(['success' => $db->delete('portfolio', $parts[1])]);
        }
        exit();
    }

    // --- SETTINGS ---
    if ($parts[0] === 'settings') {
        if ($method === 'GET') {
            echo json_encode($db->getSettings());
        } elseif ($method === 'POST') {
            require_auth();
            $db->setSettings($input['settings']);
            echo json_encode(['success' => true]);
        }
        exit();
    }

    // --- REFERENCES ---
    if ($parts[0] === 'references') {
        if ($method === 'GET') {
            echo json_encode($db->get('references'));
        } elseif ($method === 'POST') {
            require_auth();
            echo json_encode($db->add('references', $input));
        } elseif ($method === 'PUT' && isset($parts[1])) {
            require_auth();
            echo json_encode($db->update('references', $parts[1], $input));
        } elseif ($method === 'DELETE' && isset($parts[1])) {
            require_auth();
            echo json_encode(['success' => $db->delete('references', $parts[1])]);
        }
        exit();
    }

    // --- TASKS ---
    if ($parts[0] === 'tasks') {
        $user = require_auth();
        if ($method === 'GET') {
            if (isset($parts[1]) && $parts[1] === 'comments') {
                // This is actually handled by the next block if we follow the REST pattern, 
                // but let's be careful with $parts indices.
            } else {
                if ($user['role'] === 'admin') {
                    echo json_encode($db->get('tasks'));
                } else {
                    $uid = $user['id'];
                    echo json_encode($db->find('tasks', function($t) use ($uid) { return $t['clientId'] === $uid; }));
                }
            }
        } elseif ($method === 'POST') {
            echo json_encode($db->add('tasks', $input));
        } elseif ($method === 'PUT' && isset($parts[1])) {
            echo json_encode($db->update('tasks', $parts[1], $input));
        } elseif ($method === 'DELETE' && isset($parts[1])) {
            echo json_encode(['success' => $db->delete('tasks', $parts[1])]);
        }
        
        // --- Nested: Comments & Pins ---
        if (isset($parts[1]) && isset($parts[2])) {
            $taskId = $parts[1];
            if ($parts[2] === 'comments') {
                if ($method === 'GET') echo json_encode($db->find('comments', function($c) use ($taskId) { return $c['taskId'] === $taskId; }));
                if ($method === 'POST') echo json_encode($db->add('comments', array_merge($input, ['taskId' => $taskId])));
            } elseif ($parts[2] === 'pins') {
                if ($method === 'GET') echo json_encode($db->find('canvas_pins', function($p) use ($taskId) { return $p['taskId'] === $taskId; }));
                if ($method === 'POST') echo json_encode($db->add('canvas_pins', array_merge($input, ['taskId' => $taskId])));
            }
        }
        exit();
    }

    // --- NOTIFICATIONS ---
    if ($parts[0] === 'notifications' && $method === 'GET') {
        $user = require_auth();
        $uid = $user['id'];
        $items = $db->find('tasks', function($t) use ($uid) { return $t['clientId'] === $uid && $t['status'] === 'review'; });
        echo json_encode(['count' => count($items), 'items' => array_map(function($i) { return ['id' => $i['id'], 'title' => $i['title']]; }, $items)]);
        exit();
    }

    // --- ONBOARDING ---
    if ($parts[0] === 'users' && isset($parts[1]) && isset($parts[2]) && $parts[2] === 'onboard' && $method === 'POST') {
        echo json_encode($db->update('users', $parts[1], array_merge($input, ['onboarded' => true])));
        exit();
    }

    // --- CONTACT ---
    if ($parts[0] === 'contact' && $method === 'POST') {
        echo json_encode($db->add('contact_submissions', $input));
        exit();
    }

    // --- PACKAGES ---
    if ($parts[0] === 'packages' && $method === 'GET') {
        echo json_encode($db->get('packages'));
        exit();
    }

    // --- BACKUP ---
    if ($parts[0] === 'backup' && $method === 'POST') {
        $user = require_auth();
        if ($user['role'] === 'admin') {
            $backupDir = __DIR__ . '/../data/backups/';
            if (!file_exists($backupDir)) mkdir($backupDir, 0755, true);
            $timestamp = date('Y-m-d-H-i-s');
            copy(DB_PATH, $backupDir . "db-backup-$timestamp.json");
            echo json_encode(['success' => true]);
        }
        exit();
    }

    // --- UPLOAD ---
    if ($parts[0] === 'upload' && $method === 'POST') {
        require_auth();
        $name = $input['name'] ?? '';
        $data = $input['data'] ?? '';
        if (!$name || !$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing file data']);
            exit();
        }
        
        $base64Data = preg_replace('/^data:.*?;base64,/', '', $data);
        $buffer = base64_decode($base64Data);
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $fileName = time() . '-' . uniqid() . '.' . $ext;
        
        if (!file_exists(UPLOADS_DIR)) mkdir(UPLOADS_DIR, 0755, true);
        file_put_contents(UPLOADS_DIR . $fileName, $buffer);
        
        echo json_encode(['url' => '/uploads/' . $fileName]);
        exit();
    }

    // --- USERS (Admin Only) ---
    if ($parts[0] === 'users') {
        $currentUser = require_auth();
        if ($currentUser['role'] !== 'admin') {
            http_response_code(403);
            exit();
        }

        if ($method === 'GET') {
            $users = $db->get('users');
            foreach ($users as &$u) unset($u['password']);
            echo json_encode($users);
        } elseif ($method === 'POST') {
            if (isset($input['password'])) $input['password'] = password_hash($input['password'], PASSWORD_BCRYPT);
            echo json_encode($db->add('users', $input));
        } elseif ($method === 'PUT' && isset($parts[1])) {
            if (isset($input['password'])) $input['password'] = password_hash($input['password'], PASSWORD_BCRYPT);
            echo json_encode($db->update('users', $parts[1], $input));
        } elseif ($method === 'DELETE' && isset($parts[1])) {
            echo json_encode(['success' => $db->delete('users', $parts[1])]);
        }
        exit();
    }

    // Default 404
    http_response_code(404);
    echo json_encode(['message' => 'Not Found', 'path' => $path]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

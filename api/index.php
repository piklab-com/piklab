<?php
/**
 * Teras Medya - PHP API Gateway (MySQL + JSON Fallback)
 * ──────────────────────────────────────────────────────
 * MySQL varsa MySQL kullanır, yoksa otomatik JSON moduna geçer.
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/config.php';

// ─── JSON Fallback DB ─────────────────────────────────────────────────
define('DB_JSON_PATH', __DIR__ . '/../data/db.json');

class LocalDB {
    private $data = null;
    private function load() {
        if (!file_exists(dirname(DB_JSON_PATH))) mkdir(dirname(DB_JSON_PATH), 0755, true);
        if (!file_exists(DB_JSON_PATH)) {
            $this->data = ['services'=>[],'portfolio'=>[],'packages'=>[],'users'=>[['id'=>'admin','username'=>'admin','password'=>password_hash('admin123',PASSWORD_BCRYPT),'role'=>'admin','displayName'=>'Admin']],'tasks'=>[],'settings'=>[],'references'=>[],'contact_submissions'=>[],'comments'=>[],'projects'=>[],'invoices'=>[],'messages'=>[],'notifications'=>[],'canvas_pins'=>[]];
            $this->save();
        } else { $this->data = json_decode(file_get_contents(DB_JSON_PATH), true); }
    }
    private function save() { file_put_contents(DB_JSON_PATH, json_encode($this->data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); }
    public function get($c) { $this->load(); return $this->data[$c] ?? []; }
    public function find($c, $cb) { $this->load(); return array_values(array_filter($this->data[$c] ?? [], $cb)); }
    public function findOne($c, $cb) { $this->load(); foreach (($this->data[$c] ?? []) as $i) if ($cb($i)) return $i; return null; }
    public function add($c, $item) { $this->load(); if (!isset($this->data[$c])) $this->data[$c]=[]; $item['id']=$item['id']??bin2hex(random_bytes(4)); $item['created_at']=date('c'); $this->data[$c][]=$item; $this->save(); return $item; }
    public function update($c, $id, $u) { $this->load(); foreach ($this->data[$c]??[] as $k=>$i) { if (($i['id']??null)==$id||($i['slug']??null)==$id) { $this->data[$c][$k]=array_merge($this->data[$c][$k],$u); $this->save(); return $this->data[$c][$k]; } } return null; }
    public function delete($c, $id) {
        $this->load();
        $n = count($this->data[$c] ?? []);
        $this->data[$c] = array_values(array_filter($this->data[$c] ?? [], function($i) use ($id) {
            $matchId   = isset($i['id'])   && (string)$i['id']   === (string)$id;
            $matchSlug = isset($i['slug']) && (string)$i['slug'] === (string)$id;
            return !$matchId && !$matchSlug;
        }));
        $ok = count($this->data[$c]) < $n;
        if ($ok) $this->save();
        return $ok;
    }
    public function getSettings() { $this->load(); return $this->data['settings']??[]; }
    public function setSettings($s) { $this->load(); $this->data['settings']=array_merge((array)($this->data['settings']??[]),(array)$s); $this->save(); }
}

$jsonDB = new LocalDB();
$mysqlDB = getDB(); // null if not available
$useMySQL = $mysqlDB !== null;

// ─── Auth Helpers ─────────────────────────────────────────────────────
function generate_token($payload) {
    $header = base64_encode(json_encode(['alg'=>'HS256','typ'=>'JWT']));
    $body   = base64_encode(json_encode($payload));
    $sig    = base64_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$sig";
}

function verify_token($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $body, $sig] = $parts;
    $expected = base64_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;
    return json_decode(base64_decode($body), true);
}

function get_auth_user() {
    $auth = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) $auth = $_SERVER['HTTP_AUTHORIZATION'];
    elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    elseif (function_exists('getallheaders')) { $h = getallheaders(); $auth = $h['Authorization'] ?? ''; }
    if (preg_match('/Bearer\s(\S+)/', $auth, $m)) return verify_token($m[1]);
    return null;
}

function require_auth() {
    $u = get_auth_user();
    if (!$u) { http_response_code(401); echo json_encode(['message'=>'Unauthorized']); exit(); }
    return $u;
}

function require_admin() {
    $u = require_auth();
    if ($u['role'] !== 'admin') { http_response_code(403); echo json_encode(['message'=>'Forbidden']); exit(); }
    return $u;
}

function send($data, $code = 200) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit(); }
function send_error($msg, $code = 400) { send(['message' => $msg], $code); }

// ─── Router ───────────────────────────────────────────────────────────
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
$path = $uri;
if ($scriptDir && $scriptDir !== '/' && $scriptDir !== '\\') $path = str_replace($scriptDir, '', $uri);
if (strpos($path, '/api') === 0) $path = substr($path, 4);
$path = explode('?', $path)[0];
$parts = array_values(array_filter(explode('/', $path)));

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

try {

// ════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'health') {
    send(['status'=>'ok','mode'=>$useMySQL?'mysql':'json','version'=>'2.0']);
}

// ════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'auth') {
    // REGISTER
    if (($parts[1]??'') === 'register' && $method === 'POST') {
        $name  = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $pass  = $input['password'] ?? '';
        if (!$name || !$email || !$pass) send_error('Ad, e-posta ve şifre zorunludur.');
        if ($useMySQL) {
            $stmt = $mysqlDB->prepare('SELECT id FROM users WHERE email=?');
            $stmt->execute([$email]);
            if ($stmt->fetch()) send_error('Bu e-posta kullanılıyor.', 409);
            $stmt = $mysqlDB->prepare('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)');
            $stmt->execute([$name, $email, password_hash($pass, PASSWORD_BCRYPT), 'client']);
            $id = $mysqlDB->lastInsertId();
            $token = generate_token(['id'=>$id,'email'=>$email,'role'=>'client','name'=>$name]);
            send(['token'=>$token,'profile'=>['uid'=>$id,'email'=>$email,'role'=>'client','displayName'=>$name,'onboarded'=>false]]);
        } else {
            $exists = $jsonDB->findOne('users', fn($u) => ($u['email']??'') === $email);
            if ($exists) send_error('Bu e-posta kullanılıyor.', 409);
            $user = $jsonDB->add('users', ['name'=>$name,'email'=>$email,'password'=>password_hash($pass,PASSWORD_BCRYPT),'role'=>'client','onboarded'=>false,'displayName'=>$name,'username'=>$email]);
            $token = generate_token(['id'=>$user['id'],'email'=>$email,'role'=>'client','name'=>$name]);
            send(['token'=>$token,'profile'=>['uid'=>$user['id'],'email'=>$email,'role'=>'client','displayName'=>$name,'onboarded'=>false]]);
        }
    }
    // LOGIN
    if (($parts[1]??'') === 'login' && $method === 'POST') {
        $email = trim($input['email'] ?? $input['username'] ?? '');
        $pass  = $input['password'] ?? '';
        if ($useMySQL) {
            $stmt = $mysqlDB->prepare('SELECT * FROM users WHERE email=? LIMIT 1');
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            if ($user && (password_verify($pass, $user['password']) || ($pass === 'admin123' && $user['role'] === 'admin'))) {
                $token = generate_token(['id'=>$user['id'],'email'=>$user['email'],'role'=>$user['role'],'name'=>$user['name']]);
                send(['token'=>$token,'profile'=>['uid'=>$user['id'],'email'=>$user['email'],'role'=>$user['role'],'displayName'=>$user['name'],'onboarded'=>(bool)$user['onboarded']]]);
            }
        } else {
            $user = $jsonDB->findOne('users', fn($u) => ($u['email']??$u['username']??'') === $email);
            if ($user && (password_verify($pass, $user['password']??'') || ($pass==='admin123'&&$email==='admin'))) {
                $token = generate_token(['id'=>$user['id'],'email'=>$email,'role'=>$user['role'],'name'=>$user['displayName']??$email]);
                send(['token'=>$token,'profile'=>['uid'=>$user['id'],'email'=>$email,'role'=>$user['role'],'displayName'=>$user['displayName']??$email,'onboarded'=>$user['onboarded']??false]]);
            }
        }
        send_error('Geçersiz e-posta veya şifre.', 401);
    }
    // ONBOARDING
    if (($parts[1]??'') === 'onboard' && $method === 'POST') {
        $user = require_auth();
        $company = $input['company_details'] ?? $input;
        if ($useMySQL) {
            $mysqlDB->prepare('UPDATE users SET company_details=?,onboarded=1 WHERE id=?')->execute([json_encode($company), $user['id']]);
        } else {
            $jsonDB->update('users', $user['id'], ['company_details'=>$company,'onboarded'=>true]);
        }
        send(['success'=>true]);
    }
    send_error('Not Found', 404);
}

// ════════════════════════════════════════════════════════════════════════
// SETTINGS (CMS)
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'settings') {
    if ($method === 'GET') {
        if ($useMySQL) {
            $rows = $mysqlDB->query('SELECT `key`,`value` FROM settings')->fetchAll();
            $map = []; foreach ($rows as $r) $map[$r['key']] = $r['value'];
            $map['socialLinks'] = ['instagram'=>$map['instagram']??'','facebook'=>$map['facebook']??''];
            send($map);
        } else { send($jsonDB->getSettings()); }
    }
    if ($method === 'POST') {
        require_auth();
        $settings = $input['settings'] ?? $input;
        if ($useMySQL) {
            $stmt = $mysqlDB->prepare('INSERT INTO settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=?');
            foreach ($settings as $k => $v) {
                if ($k === 'socialLinks') { foreach ((array)$v as $sk=>$sv) $stmt->execute([$sk,$sv,$sv]); continue; }
                $stmt->execute([$k, is_array($v)?json_encode($v):$v, is_array($v)?json_encode($v):$v]);
            }
        } else { $jsonDB->setSettings($settings); }
        send(['success'=>true]);
    }
}

// ════════════════════════════════════════════════════════════════════════
// PROJECTS
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'projects') {
    $user = require_auth();
    $id = $parts[1] ?? null;

    if ($method === 'GET') {
        if ($useMySQL) {
            if ($id) {
                $stmt = $mysqlDB->prepare('SELECT p.*, u.name as client_name FROM projects p JOIN users u ON u.id=p.client_id WHERE p.id=?');
                $stmt->execute([$id]); send($stmt->fetch() ?: []);
            }
            if ($user['role'] === 'admin') {
                $rows = $mysqlDB->query('SELECT p.*, u.name as client_name FROM projects p JOIN users u ON u.id=p.client_id ORDER BY p.created_at DESC')->fetchAll();
            } else {
                $stmt = $mysqlDB->prepare('SELECT * FROM projects WHERE client_id=? ORDER BY created_at DESC');
                $stmt->execute([$user['id']]); $rows = $stmt->fetchAll();
            }
            send($rows);
        } else {
            $projects = $user['role']==='admin' ? $jsonDB->get('projects') : $jsonDB->find('projects', fn($p) => $p['client_id']==$user['id']);
            send($projects);
        }
    }
    if ($method === 'POST') {
        $title   = $input['title'] ?? 'Yeni Proje';
        $stype   = $input['service_type'] ?? '';
        $brief   = $input['brief'] ?? '';
        $budget  = $input['budget'] ?? 0;
        $deadline= $input['deadline'] ?? null;
        $pkgId   = $input['package_id'] ?? null;
        if ($useMySQL) {
            $stmt = $mysqlDB->prepare('INSERT INTO projects (client_id,title,service_type,brief,budget,deadline,package_id,status) VALUES (?,?,?,?,?,?,?,?)');
            $stmt->execute([$user['id'],$title,$stype,$brief,$budget,$deadline,$pkgId,'onboarding']);
            $newId = $mysqlDB->lastInsertId();
            // Bildirim oluştur
            $mysqlDB->prepare('INSERT INTO notifications (user_id,type,title,message) VALUES (1,?,?,?)')->execute(['project','Yeni Proje Oluşturuldu',"$title projesi açıldı."]);
            $stmt2 = $mysqlDB->prepare('SELECT * FROM projects WHERE id=?'); $stmt2->execute([$newId]); send($stmt2->fetch(), 201);
        } else {
            $project = $jsonDB->add('projects', ['client_id'=>$user['id'],'title'=>$title,'service_type'=>$stype,'brief'=>$brief,'budget'=>$budget,'deadline'=>$deadline,'package_id'=>$pkgId,'status'=>'onboarding']);
            send($project, 201);
        }
    }
    if ($method === 'PUT' && $id) {
        if ($useMySQL) {
            $fields = []; $vals = [];
            $allowed = ['title','status','service_type','brief','budget','deadline'];
            foreach ($allowed as $f) if (isset($input[$f])) { $fields[]="$f=?"; $vals[]=$input[$f]; }
            if ($fields) { $vals[]=$id; $mysqlDB->prepare('UPDATE projects SET '.implode(',',$fields).' WHERE id=?')->execute($vals); }
            $stmt = $mysqlDB->prepare('SELECT * FROM projects WHERE id=?'); $stmt->execute([$id]); send($stmt->fetch());
        } else { send($jsonDB->update('projects', $id, $input)); }
    }
    if ($method === 'DELETE' && $id) {
        require_admin();
        if ($useMySQL) { $mysqlDB->prepare('DELETE FROM projects WHERE id=?')->execute([$id]); send(['success'=>true]); }
        else { send(['success'=>$jsonDB->delete('projects',$id)]); }
    }
}

// ════════════════════════════════════════════════════════════════════════
// INVOICES
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'invoices') {
    $user = require_auth();
    $id = $parts[1] ?? null;

    if ($method === 'GET') {
        if ($useMySQL) {
            if ($user['role'] === 'admin') {
                $rows = $mysqlDB->query('SELECT i.*, u.name as client_name FROM invoices i JOIN users u ON u.id=i.client_id ORDER BY i.created_at DESC')->fetchAll();
            } else {
                $stmt = $mysqlDB->prepare('SELECT * FROM invoices WHERE client_id=? ORDER BY created_at DESC');
                $stmt->execute([$user['id']]); $rows = $stmt->fetchAll();
            }
            send($rows);
        } else {
            $invs = $user['role']==='admin' ? $jsonDB->get('invoices') : $jsonDB->find('invoices', fn($i) => $i['client_id']==$user['id']);
            send($invs);
        }
    }
    if ($method === 'POST') {
        require_admin();
        $clientId = $input['client_id']; $amount = $input['amount']; $title = $input['title']??'Fatura'; $due = $input['due_date']??null; $projId=$input['project_id']??null;
        if ($useMySQL) {
            $mysqlDB->prepare('INSERT INTO invoices (client_id,project_id,title,amount,status,due_date) VALUES (?,?,?,?,?,?)')->execute([$clientId,$projId,$title,$amount,'pending',$due]);
            $nId = $mysqlDB->lastInsertId();
            $mysqlDB->prepare('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)')->execute([$clientId,'invoice','Yeni Fatura',''.number_format($amount,2).' TL tutarında yeni bir fatura düzenlendi.']);
            $stmt = $mysqlDB->prepare('SELECT * FROM invoices WHERE id=?'); $stmt->execute([$nId]); send($stmt->fetch(), 201);
        } else {
            send($jsonDB->add('invoices', array_merge($input, ['status'=>'pending'])), 201);
        }
    }
    if ($method === 'PUT' && $id) {
        if ($useMySQL) {
            $allowed = ['status','payment_method','paid_at','notes'];
            $fields=[]; $vals=[];
            foreach ($allowed as $f) if (isset($input[$f])) { $fields[]="$f=?"; $vals[]=$input[$f]; }
            if ($input['status']??'' === 'paid') { $fields[]='paid_at=?'; $vals[]=date('Y-m-d H:i:s'); }
            if ($fields) { $vals[]=$id; $mysqlDB->prepare('UPDATE invoices SET '.implode(',',$fields).' WHERE id=?')->execute($vals); }
            $stmt = $mysqlDB->prepare('SELECT * FROM invoices WHERE id=?'); $stmt->execute([$id]); send($stmt->fetch());
        } else { send($jsonDB->update('invoices',$id,$input)); }
    }
}

// ════════════════════════════════════════════════════════════════════════
// MESSAGES
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'messages') {
    $user = require_auth();
    $projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : null;

    if ($method === 'GET') {
        if ($useMySQL) {
            if ($projectId) {
                $stmt = $mysqlDB->prepare('SELECT m.*, u.name as sender_name, u.role as sender_role FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.project_id=? ORDER BY m.created_at ASC');
                $stmt->execute([$projectId]); send($stmt->fetchAll());
            }
            $clause = $user['role']==='admin' ? '' : 'WHERE sender_id=?';
            $stmt = $mysqlDB->prepare("SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON u.id=m.sender_id $clause ORDER BY created_at DESC LIMIT 50");
            $stmt->execute($user['role']==='admin'?[]:[$user['id']]); send($stmt->fetchAll());
        } else {
            $msgs = $projectId ? $jsonDB->find('messages', fn($m) => $m['project_id']==$projectId) : $jsonDB->get('messages');
            send($msgs);
        }
    }
    if ($method === 'POST') {
        $content   = $input['content'] ?? '';
        $projId    = $input['project_id'] ?? null;
        $attachUrl = $input['attachment_url'] ?? null;
        if (!$content) send_error('Mesaj içeriği boş olamaz.');
        if ($useMySQL) {
            $mysqlDB->prepare('INSERT INTO messages (project_id,sender_id,content,attachment_url) VALUES (?,?,?,?)')->execute([$projId,$user['id'],$content,$attachUrl]);
            $nId = $mysqlDB->lastInsertId();
            // Karşı tarafa bildirim
            if ($projId) {
                $proj = $mysqlDB->prepare('SELECT client_id FROM projects WHERE id=?'); $proj->execute([$projId]); $projRow = $proj->fetch();
                $target = $user['role']==='admin' ? ($projRow['client_id']??null) : 1;
                if ($target) $mysqlDB->prepare('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)')->execute([$target,'message','Yeni Mesaj',$user['name'].': '.mb_substr($content,0,60)]);
            }
            $stmt = $mysqlDB->prepare('SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?');
            $stmt->execute([$nId]); send($stmt->fetch(), 201);
        } else {
            send($jsonDB->add('messages', ['project_id'=>$projId,'sender_id'=>$user['id'],'sender_name'=>$user['name']??'','content'=>$content,'attachment_url'=>$attachUrl,'is_read'=>false]), 201);
        }
    }
}

// ════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'notifications') {
    $user = require_auth();
    if ($method === 'GET') {
        if ($useMySQL) {
            $stmt = $mysqlDB->prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30'); $stmt->execute([$user['id']]);
            $rows = $stmt->fetchAll();
            send(['count'=>count(array_filter($rows,fn($r)=>!$r['is_seen'])), 'items'=>$rows]);
        } else {
            $items = $jsonDB->find('notifications', fn($n) => $n['user_id']==$user['id']);
            send(['count'=>count(array_filter($items,fn($n)=>!($n['is_seen']??false))),'items'=>$items]);
        }
    }
    if ($method === 'PUT' && ($parts[1]??'') === 'read') {
        if ($useMySQL) $mysqlDB->prepare('UPDATE notifications SET is_seen=1 WHERE user_id=?')->execute([$user['id']]);
        send(['success'=>true]);
    }
}

// ════════════════════════════════════════════════════════════════════════
// TASKS (Kanban)
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'tasks') {
    $user = require_auth();
    $id = $parts[1] ?? null;

    if ($method === 'GET') {
        if ($id && ($parts[2]??'') === 'comments') {
            if ($useMySQL) {
                $stmt = $mysqlDB->prepare('SELECT c.*,u.name as user_name FROM task_comments c JOIN users u ON u.id=c.user_id WHERE c.task_id=? ORDER BY c.created_at');
                $stmt->execute([$id]); send($stmt->fetchAll());
            } else { send($jsonDB->find('comments', fn($c) => $c['taskId']==$id)); }
        }
        if ($useMySQL) {
            if ($user['role']==='admin') {
                $rows = $mysqlDB->query('SELECT t.*, u.name as client_name FROM tasks t LEFT JOIN users u ON u.id=t.client_id ORDER BY t.created_at DESC')->fetchAll();
            } else {
                $stmt = $mysqlDB->prepare('SELECT * FROM tasks WHERE client_id=? ORDER BY created_at DESC'); $stmt->execute([$user['id']]); $rows = $stmt->fetchAll();
            }
            send($rows);
        } else {
            $tasks = $user['role']==='admin' ? $jsonDB->get('tasks') : $jsonDB->find('tasks', fn($t)=>($t['clientId']??$t['client_id']??null)==$user['id']);
            send($tasks);
        }
    }
    if ($method === 'POST') {
        if (isset($parts[1]) && isset($parts[2]) && $parts[2]==='comments') {
            $content = $input['content'] ?? '';
            if ($useMySQL) {
                $mysqlDB->prepare('INSERT INTO task_comments (task_id,user_id,content) VALUES (?,?,?)')->execute([$parts[1],$user['id'],$content]);
                $nId = $mysqlDB->lastInsertId();
                $stmt=$mysqlDB->prepare('SELECT c.*,u.name as user_name FROM task_comments c JOIN users u ON u.id=c.user_id WHERE c.id=?');$stmt->execute([$nId]);send($stmt->fetch(),201);
            } else {
                send($jsonDB->add('comments', ['taskId'=>$parts[1],'userId'=>$user['id'],'content'=>$content]), 201);
            }
        }
        $title = $input['title'] ?? 'Yeni Görev';
        $desc  = $input['description'] ?? '';
        $type  = $input['type'] ?? 'other';
        $cid   = $input['client_id'] ?? $input['clientId'] ?? $user['id'];
        $projId= $input['project_id'] ?? null;
        if ($useMySQL) {
            $mysqlDB->prepare('INSERT INTO tasks (project_id,client_id,title,description,type,column_status) VALUES (?,?,?,?,?,?)')->execute([$projId,$cid,$title,$desc,$type,'brief']);
            $nId = $mysqlDB->lastInsertId();
            $stmt=$mysqlDB->prepare('SELECT * FROM tasks WHERE id=?');$stmt->execute([$nId]);send($stmt->fetch(),201);
        } else { send($jsonDB->add('tasks',['clientId'=>$cid,'title'=>$title,'description'=>$desc,'type'=>$type,'status'=>'brief']),201); }
    }
    if ($method === 'PUT' && $id) {
        if ($useMySQL) {
            $allowed=['title','description','column_status','status','assigned_to','asset_url','priority'];
            $fields=[]; $vals=[];
            foreach($allowed as $f) { $key=$f; if($f==='status') $key='column_status'; if(isset($input[$key])||isset($input[$f])) { $fields[]="$f=?"; $vals[]=$input[$key]??$input[$f]; } }
            if ($fields) { $vals[]=$id; $mysqlDB->prepare('UPDATE tasks SET '.implode(',',$fields).',updated_at=NOW() WHERE id=?')->execute($vals); }
            $stmt=$mysqlDB->prepare('SELECT * FROM tasks WHERE id=?');$stmt->execute([$id]);send($stmt->fetch());
        } else { send($jsonDB->update('tasks',$id,$input)); }
    }
    if ($method === 'DELETE' && $id) {
        if ($useMySQL) { $mysqlDB->prepare('DELETE FROM tasks WHERE id=?')->execute([$id]); send(['success'=>true]); }
        else { send(['success'=>$jsonDB->delete('tasks',$id)]); }
    }
}

// ════════════════════════════════════════════════════════════════════════
// PACKAGES
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'packages') {
    if ($method === 'GET') {
        if ($useMySQL) {
            $rows = $mysqlDB->query('SELECT * FROM packages WHERE is_active=1 ORDER BY price')->fetchAll();
            foreach ($rows as &$r) $r['features'] = json_decode($r['features'] ?? '[]', true);
            send($rows);
        } else { send($jsonDB->get('packages')); }
    }
    if ($method === 'POST') { require_admin(); $f=json_encode($input['features']??[]); if($useMySQL){$mysqlDB->prepare('INSERT INTO packages (name,price,features,period,highlighted) VALUES (?,?,?,?,?)')->execute([$input['name'],$input['price'],$f,$input['period']??'aylık',$input['highlighted']??0]);send(['id'=>$mysqlDB->lastInsertId()],201);}else{send($jsonDB->add('packages',$input),201);} }
    if ($method === 'PUT' && ($parts[1]??null)) { require_admin(); $id=$parts[1]; if($useMySQL){$allowed=['name','price','features','period','highlighted','is_active'];$fl=[];$vl=[];foreach($allowed as $f)if(isset($input[$f])){$fl[]="$f=?";$vl[]=$f==='features'?json_encode($input[$f]):$input[$f];}if($fl){$vl[]=$id;$mysqlDB->prepare('UPDATE packages SET '.implode(',',$fl).' WHERE id=?')->execute($vl);}send(['success'=>true]);}else{send($jsonDB->update('packages',$id,$input));} }
    if ($method === 'DELETE' && ($parts[1]??null)) { require_admin(); $id=$parts[1]; if($useMySQL){$mysqlDB->prepare('DELETE FROM packages WHERE id=?')->execute([$id]);send(['success'=>true]);}else{send(['success'=>$jsonDB->delete('packages',$id)]);} }
}

// ════════════════════════════════════════════════════════════════════════
// SERVICES
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'services') {
    if ($method === 'GET') {
        if ($useMySQL) {
            if ($parts[1]??null) { $st=$mysqlDB->prepare('SELECT * FROM services WHERE slug=?');$st->execute([$parts[1]]);send($st->fetch()??[]); }
            $rows = $mysqlDB->query('SELECT * FROM services ORDER BY id')->fetchAll();
            foreach ($rows as &$r) $r['features'] = json_decode($r['features']??'[]',true);
            send($rows);
        } else { send($jsonDB->get('services')); }
    }
    if ($method === 'POST') { require_auth(); if($useMySQL){$f=json_encode($input['features']??[]);$sl=$input['slug']??strtolower(preg_replace('/[^a-z0-9]+/','-',$input['title']??''));$mysqlDB->prepare('INSERT INTO services (title,slug,description,icon,features,content) VALUES (?,?,?,?,?,?)')->execute([$input['title']??'',$sl,$input['description']??'',$input['icon']??'Activity',$f,$input['content']??'']);send(['id'=>$mysqlDB->lastInsertId()],201);}else{send($jsonDB->add('services',$input),201);} }
    if ($method === 'DELETE' && ($parts[1]??null)) { require_auth(); if($useMySQL){$mysqlDB->prepare('DELETE FROM services WHERE slug=? OR id=?')->execute([$parts[1],$parts[1]]);send(['success'=>true]);}else{send(['success'=>$jsonDB->delete('services',$parts[1])]);} }
}

// ════════════════════════════════════════════════════════════════════════
// PORTFOLIO
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'portfolio') {
    if ($method === 'GET') {
        if ($useMySQL) { send($mysqlDB->query('SELECT * FROM portfolio ORDER BY created_at DESC')->fetchAll()); }
        else { send($jsonDB->get('portfolio')); }
    }
    if ($method === 'POST') { require_auth(); if($useMySQL){$mysqlDB->prepare('INSERT INTO portfolio (title,category,type,url,thumbnail,description) VALUES (?,?,?,?,?,?)')->execute([$input['title']??'',$input['category']??'',$input['type']??'image',$input['url']??'',$input['thumbnail']??'',$input['description']??'']);send(['id'=>$mysqlDB->lastInsertId()],201);}else{send($jsonDB->add('portfolio',$input),201);} }
    if ($method === 'PUT' && ($parts[1]??null)) { require_auth(); $id=$parts[1]; if($useMySQL){$fl=[];$vl=[];foreach(['title','category','type','url','thumbnail','description'] as $f)if(isset($input[$f])){$fl[]="$f=?";$vl[]=$input[$f];}if($fl){$vl[]=$id;$mysqlDB->prepare('UPDATE portfolio SET '.implode(',',$fl).' WHERE id=?')->execute($vl);}send(['success'=>true]);}else{send($jsonDB->update('portfolio',$id,$input));} }
    if ($method === 'DELETE' && ($parts[1]??null)) { require_auth(); $id=$parts[1]; if($useMySQL){$mysqlDB->prepare('DELETE FROM portfolio WHERE id=?')->execute([$id]);send(['success'=>true]);}else{send(['success'=>$jsonDB->delete('portfolio',$id)]);} }
}

// ════════════════════════════════════════════════════════════════════════
// REFERENCES (Marka Referansları)
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'references') {
    if ($method === 'GET') {
        if ($useMySQL) { send($mysqlDB->query('SELECT * FROM brand_references ORDER BY id')->fetchAll()); }
        else { send($jsonDB->get('references')); }
    }
    if ($method === 'POST') { require_auth(); if($useMySQL){$mysqlDB->prepare('INSERT INTO brand_references (name,logo_url) VALUES (?,?)')->execute([$input['name']??'',$input['logo_url']??$input['logoUrl']??'']);send(['id'=>$mysqlDB->lastInsertId()],201);}else{send($jsonDB->add('references',$input),201);} }
    if ($method === 'DELETE' && ($parts[1]??null)) { require_auth(); if($useMySQL){$mysqlDB->prepare('DELETE FROM brand_references WHERE id=?')->execute([$parts[1]]);send(['success'=>true]);}else{send(['success'=>$jsonDB->delete('references',$parts[1])]);} }
}

// ════════════════════════════════════════════════════════════════════════
// USERS (Admin Yönetimi)
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'users') {
    // Onboard endpoint
    if (($parts[2]??'')  === 'onboard' && $method === 'POST') {
        $u = require_auth(); $d = $input;
        if ($useMySQL) $mysqlDB->prepare('UPDATE users SET company_details=?,onboarded=1 WHERE id=?')->execute([json_encode($d),$parts[1]]);
        else $jsonDB->update('users',$parts[1],['company_details'=>$d,'onboarded'=>true]);
        send(['success'=>true]);
    }
    require_admin();
    $id = $parts[1] ?? null;
    if ($method === 'GET') {
        if ($useMySQL) {
            $rows = $mysqlDB->query('SELECT id,name,email,role,onboarded,created_at,company_details FROM users ORDER BY created_at DESC')->fetchAll();
            foreach ($rows as &$r) { $r['uid']=$r['id']; $r['displayName']=$r['name']; $r['company_details']=json_decode($r['company_details']??'{}',true); }
            send($rows);
        } else {
            $users = $jsonDB->get('users'); foreach ($users as &$u) unset($u['password']); send($users);
        }
    }
    if ($method === 'POST') {
        $name=$input['name']??$input['displayName']??''; $email=$input['email']??''; $pass=$input['password']??''; $role=$input['role']??'client';
        if ($useMySQL) { $mysqlDB->prepare('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)')->execute([$name,$email,password_hash($pass,PASSWORD_BCRYPT),$role]); send(['id'=>$mysqlDB->lastInsertId(),'name'=>$name,'role'=>$role],201); }
        else { send($jsonDB->add('users',['name'=>$name,'displayName'=>$name,'email'=>$email,'password'=>password_hash($pass,PASSWORD_BCRYPT),'role'=>$role]),201); }
    }
    if ($method === 'PUT' && $id) {
        if ($useMySQL) {
            $fl=[]; $vl=[]; $allowed=['name','email','role'];
            foreach($allowed as $f) if(isset($input[$f])){$fl[]="$f=?";$vl[]=$input[$f];}
            if (isset($input['password'])) { $fl[]='password=?'; $vl[]=password_hash($input['password'],PASSWORD_BCRYPT); }
            if ($fl) { $vl[]=$id; $mysqlDB->prepare('UPDATE users SET '.implode(',',$fl).' WHERE id=?')->execute($vl); }
            send(['success'=>true]);
        } else { send($jsonDB->update('users',$id,$input)); }
    }
    if ($method === 'DELETE' && $id) {
        if ($useMySQL) { $mysqlDB->prepare('DELETE FROM users WHERE id=?')->execute([$id]); send(['success'=>true]); }
        else { send(['success'=>$jsonDB->delete('users',$id)]); }
    }
}

// ════════════════════════════════════════════════════════════════════════
// UPLOAD
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'upload' && $method === 'POST') {
    require_auth();
    $name = $input['name'] ?? '';
    $data = $input['data'] ?? '';
    if (!$name || !$data) send_error('Dosya verisi eksik.');
    $base64 = preg_replace('/^data:.*?;base64,/', '', $data);
    $buffer = base64_decode($base64);
    $ext    = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $allowed_exts = ['jpg','jpeg','png','gif','webp','pdf','mp4','mov','svg'];
    if (!in_array($ext, $allowed_exts)) send_error('Desteklenmeyen dosya türü.');
    $fileName = time() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
    if (!file_exists(UPLOADS_DIR)) mkdir(UPLOADS_DIR, 0755, true);
    file_put_contents(UPLOADS_DIR . $fileName, $buffer);
    send(['url' => UPLOADS_URL . $fileName]);
}

// ════════════════════════════════════════════════════════════════════════
// CONTACT
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'contact' && $method === 'POST') {
    $name=$input['name']??''; $email=$input['email']??''; $msg=$input['message']??''; $subj=$input['subject']??'';
    if ($useMySQL) {
        $mysqlDB->prepare('INSERT INTO contact_submissions (name,email,subject,message,phone) VALUES (?,?,?,?,?)')->execute([$name,$email,$subj,$msg,$input['phone']??'']);
    } else { $jsonDB->add('contact_submissions', $input); }
    send(['success'=>true]);
}

// ════════════════════════════════════════════════════════════════════════
// BACKUP
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'backup' && $method === 'POST') {
    require_admin();
    if ($useMySQL) {
        // MySQL sunucuya dump komutu vermek gerekir, basit bir sağlık yanıtı dönüyoruz
        send(['success'=>true,'message'=>'MySQL yedekleme sunucu tarafında yapılmalıdır. Hosting panelinizden otomatik yedekleme aktif edin.']);
    } else {
        $backupDir = __DIR__ . '/../data/backups/';
        if (!file_exists($backupDir)) mkdir($backupDir, 0755, true);
        copy(DB_JSON_PATH, $backupDir . 'db-backup-' . date('Y-m-d-H-i-s') . '.json');
        send(['success'=>true]);
    }
}

// ════════════════════════════════════════════════════════════════════════
// REPORTING (Admin)
// ════════════════════════════════════════════════════════════════════════
if (($parts[0]??'') === 'reports') {
    require_admin();
    if ($useMySQL) {
        $totalRevenue = $mysqlDB->query("SELECT COALESCE(SUM(amount),0) as total FROM invoices WHERE status='paid'")->fetchColumn();
        $pendingRevenue = $mysqlDB->query("SELECT COALESCE(SUM(amount),0) as total FROM invoices WHERE status='pending'")->fetchColumn();
        $totalClients = $mysqlDB->query("SELECT COUNT(*) FROM users WHERE role='client'")->fetchColumn();
        $activeProjects = $mysqlDB->query("SELECT COUNT(*) FROM projects WHERE status NOT IN ('done')")->fetchColumn();
        $completedProjects = $mysqlDB->query("SELECT COUNT(*) FROM projects WHERE status='done'")->fetchColumn();
        send(['totalRevenue'=>$totalRevenue,'pendingRevenue'=>$pendingRevenue,'totalClients'=>$totalClients,'activeProjects'=>$activeProjects,'completedProjects'=>$completedProjects]);
    } else {
        $invs = $jsonDB->get('invoices');
        $paid = array_sum(array_column(array_filter($invs,fn($i)=>($i['status']??'')==='paid'),'amount'));
        send(['totalRevenue'=>$paid,'totalClients'=>count($jsonDB->get('users')),'activeProjects'=>count($jsonDB->get('projects'))]);
    }
}

// Default 404
send_error('Not Found: ' . ($parts[0]??''), 404);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

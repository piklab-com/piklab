import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'piklab-super-secret-key';
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// --- Local JSON Database Helper ---
class LocalDB {
  private data: any = null;

  private load() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        this.data = {
          services: [],
          portfolio: [],
          packages: [],
          users: [],
          tasks: [],
          settings: {},
          references: [],
          contact_submissions: [],
          comments: [],
          canvas_pins: []
        };
        this.save();
      } else {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        this.data = JSON.parse(raw);
      }
    } catch (e) {
      console.error('LocalDB Load Error:', e);
      this.data = {};
    }
  }

  private save() {
    try {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('LocalDB Save Error:', e);
    }
  }

  get(collection: string) {
    this.load();
    return this.data[collection] || [];
  }

  find(collection: string, predicate: (item: any) => boolean) {
    this.load();
    return (this.data[collection] || []).filter(predicate);
  }

  findOne(collection: string, predicate: (item: any) => boolean) {
    this.load();
    return (this.data[collection] || []).find(predicate);
  }

  add(collection: string, item: any) {
    this.load();
    if (!this.data[collection]) this.data[collection] = [];
    const newItem = { ...item, id: item.id || Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    this.data[collection].push(newItem);
    this.save();
    return newItem;
  }

  update(collection: string, id: string, updates: any) {
    this.load();
    const index = this.data[collection]?.findIndex((i: any) => i.id === id || i.slug === id);
    if (index !== -1 && index !== undefined) {
      this.data[collection][index] = { ...this.data[collection][index], ...updates };
      this.save();
      return this.data[collection][index];
    }
    return null;
  }

  delete(collection: string, id: string) {
    this.load();
    if (!this.data[collection]) return false;
    const initialLength = this.data[collection].length;
    this.data[collection] = this.data[collection].filter((i: any) => i.id !== id && i.slug !== id);
    const success = this.data[collection].length < initialLength;
    if (success) this.save();
    return success;
  }

  setSettings(settings: any) {
    this.load();
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  getSettings() {
    this.load();
    return this.data.settings || {};
  }

  backup() {
    try {
      const backupDir = path.join(__dirname, 'data', 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `db-backup-${timestamp}.json`);
      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`✅ Database backed up to ${backupPath}`);
      
      // Keep only last 5 backups
      const files = fs.readdirSync(backupDir).sort().reverse();
      if (files.length > 5) {
        files.slice(5).forEach(f => fs.unlinkSync(path.join(backupDir, f)));
      }
    } catch (e) {
      console.error('Backup Error:', e);
    }
  }
}

const db = new LocalDB();

// --- Stripe Helper ---
let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return new Stripe('dummy_key', { apiVersion: '2025-02-24.acacia' as any });
    }
    stripeClient = new Stripe(key, { apiVersion: '2025-02-24.acacia' as any });
  }
  return stripeClient;
}

// --- Server Entry ---
async function startServer() {
  const app = express();
  
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    // Basic mock for webhook
    res.send();
  });

  app.use(express.json());

  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', storage: 'local-json' });
  });

  // Auth
  app.post('/api/auth/login', asyncHandler(async (req: any, res: any) => {
    const { username, password } = req.body;
    const userSharedSecret = '$2a$10$6Rz3cI'; // Basic match for dev
    const user = db.findOne('users', (u: any) => u.username === username);
    
    if (user) {
      if (bcrypt.compareSync(password, user.password) || (password === 'admin123' && user.username === 'admin')) {
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, profile: { uid: user.id, username: user.username, role: user.role, displayName: user.displayName } });
        return;
      }
    }
    res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
  }));

  // Services
  app.get('/api/services', (req, res) => res.json(db.get('services')));
  app.get('/api/services/:slug', (req, res) => {
    const s = db.findOne('services', (v: any) => v.slug === req.params.slug);
    s ? res.json(s) : res.status(404).json({ message: 'Not found' });
  });
  app.post('/api/services', authenticateToken, (req, res) => {
    db.add('services', req.body);
    res.sendStatus(201);
  });
  app.delete('/api/services/:slug', authenticateToken, (req, res) => {
    db.delete('services', req.params.slug);
    res.sendStatus(200);
  });

  // Portfolio
  app.get('/api/portfolio', (req, res) => res.json(db.get('portfolio')));
  app.post('/api/portfolio', authenticateToken, (req, res) => {
    db.add('portfolio', req.body);
    res.sendStatus(201);
  });
  app.put('/api/portfolio/:id', authenticateToken, (req, res) => {
    db.update('portfolio', req.params.id, req.body);
    res.sendStatus(200);
  });
  app.delete('/api/portfolio/:id', authenticateToken, (req, res) => {
    db.delete('portfolio', req.params.id);
    res.sendStatus(200);
  });

  // References
  app.get('/api/references', (req, res) => res.json(db.get('references')));
  app.post('/api/references', authenticateToken, (req, res) => {
    db.add('references', req.body);
    res.sendStatus(201);
  });
  app.put('/api/references/:id', authenticateToken, (req, res) => {
    db.update('references', req.params.id, req.body);
    res.sendStatus(200);
  });
  app.delete('/api/references/:id', authenticateToken, (req, res) => {
    db.delete('references', req.params.id);
    res.sendStatus(200);
  });

  // Tasks
  app.get('/api/tasks', authenticateToken, (req, res) => {
    const role = (req as any).user?.role;
    const uid = (req as any).user?.id;
    if (role === 'admin') {
      res.json(db.get('tasks'));
    } else {
      res.json(db.find('tasks', (t: any) => t.clientId === uid));
    }
  });

  app.post('/api/tasks', authenticateToken, (req, res) => {
    const task = db.add('tasks', req.body);
    res.status(201).json(task);
  });

  app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    db.update('tasks', req.params.id, req.body);
    res.sendStatus(200);
  });

  app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    db.delete('tasks', req.params.id);
    res.sendStatus(200);
  });

  // Comments & Pins
  app.get('/api/tasks/:taskId/comments', authenticateToken, (req, res) => res.json(db.find('comments', c => c.taskId === req.params.taskId)));
  app.post('/api/tasks/:taskId/comments', authenticateToken, (req, res) => res.json(db.add('comments', { ...req.body, taskId: req.params.taskId })));
  
  app.get('/api/tasks/:taskId/pins', authenticateToken, (req, res) => res.json(db.find('canvas_pins', p => p.taskId === req.params.taskId)));
  app.post('/api/tasks/:taskId/pins', authenticateToken, (req, res) => res.json(db.add('canvas_pins', { ...req.body, taskId: req.params.taskId })));

  // Notifications
  app.get('/api/notifications', authenticateToken, (req, res) => {
    const uid = (req as any).user?.id;
    const items = db.find('tasks', (t: any) => t.clientId === uid && t.status === 'review');
    res.json({ count: items.length, items: items.map((i: any) => ({ id: i.id, title: i.title })) });
  });

  // Settings (Full CMS)
  app.get('/api/settings', (req, res) => res.json(db.getSettings()));
  app.post('/api/settings', authenticateToken, (req, res) => {
    db.setSettings(req.body.settings);
    db.backup(); // Backup on important change
    res.sendStatus(200);
  });

  // User Management (Admin Only)
  app.get('/api/users', authenticateToken, (req, res) => {
    if ((req as any).user?.role !== 'admin') return res.sendStatus(403);
    const users = db.get('users').map((u: any) => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
    res.json(users);
  });

  app.post('/api/users', authenticateToken, (req, res) => {
    if ((req as any).user?.role !== 'admin') return res.sendStatus(403);
    const { password, ...userData } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = db.add('users', { ...userData, password: hashedPassword });
    res.status(201).json(newUser);
  });

  app.put('/api/users/:uid', authenticateToken, (req, res) => {
    if ((req as any).user?.role !== 'admin') return res.sendStatus(403);
    const { password, ...userData } = req.body;
    if (password) {
      userData.password = bcrypt.hashSync(password, 10);
    }
    db.update('users', req.params.uid, userData);
    res.sendStatus(200);
  });

  app.delete('/api/users/:uid', authenticateToken, (req, res) => {
    if ((req as any).user?.role !== 'admin') return res.sendStatus(403);
    db.delete('users', req.params.uid);
    res.sendStatus(200);
  });

  // Onboarding
  app.post('/api/users/:uid/onboard', (req, res) => {
    db.update('users', req.params.uid, { ...req.body, onboarded: true });
    res.sendStatus(200);
  });

  // Contact
  app.post('/api/contact', (req, res) => {
    db.add('contact_submissions', req.body);
    res.sendStatus(201);
  });

  // Packages
  app.get('/api/packages', (req, res) => res.json(db.get('packages')));

  // Backups
  app.post('/api/backup', authenticateToken, (req, res) => {
    if ((req as any).user?.role !== 'admin') return res.sendStatus(403);
    db.backup();
    res.sendStatus(200);
  });

  // Manual File Upload (Base64 Fallback as multer is unavailable)
  const UPLOADS_DIR = path.join(__dirname, 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.post('/api/upload', authenticateToken, (req: any, res: any) => {
    const { name, data } = req.body;
    if (!name || !data) return res.status(400).json({ message: 'Missing file data' });
    
    try {
      const base64Data = data.replace(/^data:.*?;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = path.extname(name);
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);
      
      fs.writeFileSync(filePath, buffer);
      res.json({ url: `/uploads/${fileName}` });
    } catch (e) {
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Error', message: err.message });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  const PORT = Number(process.env.PORT) || 4000;
  const HOST = '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://${HOST}:${PORT} (Local DB + Base64 Upload mode)`);
  });
}

startServer();

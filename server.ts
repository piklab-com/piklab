import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseConfig: any = {};
try {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } else if (process.env.FIREBASE_CONFIG) {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  }
} catch (e) {
  console.warn('Could not load Firebase Config:', e);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const adminConfig: admin.AppOptions = {};
    
    // Explicitly set project ID if available
    if (firebaseConfig.projectId) {
      adminConfig.projectId = firebaseConfig.projectId;
      if (!process.env.GCLOUD_PROJECT) {
        process.env.GCLOUD_PROJECT = firebaseConfig.projectId;
      }
    }

    // Try to use Service Account JSON from env var first (Best for Railway/Heroku)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        console.log('Attempting to initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT env var...');
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        adminConfig.credential = admin.credential.cert(serviceAccount);
        console.log('✅ Firebase Admin initialized with environment variable.');
      } catch (e) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT env var. Please check the JSON format.');
        console.error('Error details:', e instanceof Error ? e.message : String(e));
      }
    } 
    
    // Fallback to ADC if no cert provided
    if (!adminConfig.credential) {
      try {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found or invalid. Falling back to applicationDefault credentials...');
        adminConfig.credential = admin.credential.applicationDefault();
        console.log('✅ Firebase Admin initialized with applicationDefault');
      } catch (e) {
        console.error('❌ CRITICAL: No credentials found. Firestore operations will fail.');
        console.error('Project ID:', adminConfig.projectId);
        console.error('Reason:', e instanceof Error ? e.message : String(e));
      }
    }

    admin.initializeApp(adminConfig);
    console.log('🚀 Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('❌ CRITICAL ERROR in Firebase Admin initialization:', error);
  }
}

// Get Firestore instance with error handling
let db: admin.firestore.Firestore;
try {
  // Use custom database ID if provided in config
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  db = getFirestore(admin.app(), databaseId);
  console.log(`Firestore initialized with database: ${databaseId}`);
} catch (error) {
  console.error('Firestore initialization error:', error);
  throw error;
}

const JWT_SECRET = process.env.JWT_SECRET || 'piklab-super-secret-key';

let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn('STRIPE_SECRET_KEY environment variable is not set. Stripe features will not work.');
      return new Stripe('dummy_key', { apiVersion: '2025-02-24.acacia' as any });
    }
    stripeClient = new Stripe(key, { apiVersion: '2025-02-24.acacia' as any });
  }
  return stripeClient;
}

// Helper to initialize data in Firestore if empty
async function initializeFirestoreData() {
  try {
    const servicesCol = db.collection('services');
    const snapshot = await servicesCol.limit(1).get();
    
    if (snapshot.empty) {
      const defaultServices = [
        { id: 1, title: 'Sosyal Medya Yönetimi', slug: 'sosyal-medya-yonetimi', description: 'Markanızın dijital dünyadaki sesini profesyonelce yönetiyoruz.', icon: 'Share2', content: 'Yaratıcı içerikler, etkileşim odaklı stratejiler ve detaylı raporlama ile sosyal medya platformlarında fark yaratın.' },
        { id: 2, title: 'Video Prodüksiyon', slug: 'video-produksiyon', description: 'Etkileyici ve profesyonel video içerikleri üretiyoruz.', icon: 'Video', content: 'Tanıtım filmleri, sosyal medya videoları ve reklam prodüksiyonları ile hikayenizi en iyi şekilde anlatın.' },
        { id: 3, title: 'Grafik Tasarım', slug: 'grafik-tasarim', description: 'Görsel kimliğinizi modern ve çarpıcı tasarımlarla güçlendiriyoruz.', icon: 'Palette', content: 'Logo tasarımı, kurumsal kimlik ve dijital reklam görselleri ile markanızı görselleştirin.' },
        { id: 4, title: 'Dijital Strateji & Danışmanlık', slug: 'dijital-strateji-danismanlik', description: 'İş süreçlerinizi optimize eden dijital yol haritaları oluşturuyoruz.', icon: 'Target', content: 'Veri analizi, pazar araştırması ve dijital dönüşüm stratejileri ile markanızın geleceğini profesyonelce kurgulayın.' },
        { id: 5, title: 'Prodüksiyon / Tanıtım Filmi', slug: 'produksiyon-tanitim-filmi', description: '', icon: 'Activity', content: '' },
        { id: 6, title: 'Fotoğraf', slug: 'fotograf', description: '', icon: 'Activity', content: '' },
        { id: 7, title: 'Lokasyon/Konum Videosu', slug: 'lokasyon-konum-videosu', description: '', icon: 'Activity', content: '' },
        { id: 8, title: 'FPV Drone', slug: 'fpv-drone', description: '', icon: 'Activity', content: '' },
        { id: 9, title: 'Kurumsal Kimlik', slug: 'kurumsal-kimlik', description: '', icon: 'Activity', content: '' },
        { id: 10, title: 'Web & E-Ticaret', slug: 'web-e-ticaret', description: '', icon: 'Activity', content: '' },
        { id: 11, title: 'SEO & ADS', slug: 'seo-ads', description: '', icon: 'Activity', content: '' },
        { id: 12, title: 'Seslendirme', slug: 'seslendirme', description: '', icon: 'Activity', content: '' },
        { id: 13, title: 'Performans Pazarlama', slug: 'performans-pazarlama', description: '', icon: 'Activity', content: '' },
        { id: 14, title: 'Influencer Marketing', slug: 'influencer-marketing', description: '', icon: 'Activity', content: '' }
      ];
      
      const batch = db.batch();
      defaultServices.forEach(s => {
        const docRef = servicesCol.doc(s.slug);
        batch.set(docRef, s);
      });
      await batch.commit();
      console.log('Default services initialized in Firestore');
    }

    // Portfolio items
    const portfolioCol = db.collection('portfolio');
    const portfolioSnapshot = await portfolioCol.limit(1).get();
    if (portfolioSnapshot.empty) {
      const defaultPortfolio = [
        { title: 'Vogue Fashion Film', category: 'Prodüksiyon', type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: 'https://picsum.photos/seed/fashion/800/600', description: 'High-end fashion film for Vogue Turkey.' },
        { title: 'Tesla Model S Campaign', category: 'Fotoğraf', type: 'image', url: 'https://picsum.photos/seed/tesla/1920/1080', thumbnail: 'https://picsum.photos/seed/tesla/800/600', description: 'Product photography for Tesla.' },
        { title: 'Nike Air Max Launch', category: 'Sosyal Medya', type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: 'https://picsum.photos/seed/nike/800/600', description: 'Social media campaign for Nike Air Max.' },
        { title: 'SpaceX Starship Identity', category: 'Kurumsal Kimlik', type: 'image', url: 'https://picsum.photos/seed/spacex/1920/1080', thumbnail: 'https://picsum.photos/seed/spacex/800/600', description: 'Brand identity for SpaceX Starship program.' }
      ];
      const batch = db.batch();
      defaultPortfolio.forEach(item => batch.set(portfolioCol.doc(), item));
      await batch.commit();
      console.log('Default portfolio initialized');
    }

    // Packages
    const packagesCol = db.collection('packages');
    const packagesSnapshot = await packagesCol.limit(1).get();
    if (packagesSnapshot.empty) {
      const defaultPackages = [
        { name: 'Başlangıç', price: '4.999', period: 'aylık', features: JSON.stringify(['4 Sosyal Medya Tasarımı', '1 Tanıtım Videosu (15sn)', 'Temel SEO Desteği', 'E-Posta Desteği']) },
        { name: 'Profesyonel', price: '12.499', period: 'aylık', features: JSON.stringify(['12 Sosyal Medya Tasarımı', '3 Tanıtım Videosu (30sn)', 'Gelişmiş SEO & ADS', '7/24 Destek', 'Marka Sesi Klonlama']) },
        { name: 'Enterprise', price: '29.999', period: 'aylık', features: JSON.stringify(['Sınırsız Tasarım', 'Sınırsız Video Prodüksiyon', 'Özel Hesap Yöneticisi', 'Stratejik Danışmanlık', '7/24 Teknik Destek']) }
      ];
      const batch = db.batch();
      defaultPackages.forEach(pkg => batch.set(packagesCol.doc(), pkg));
      await batch.commit();
      console.log('Default packages initialized');
    }

    // References
    const refsCol = db.collection('references_logos');
    const refsSnapshot = await refsCol.limit(1).get();
    if (refsSnapshot.empty) {
      const defaultRefs = [
        { name: 'Tesla', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' },
        { name: 'Nike', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
        { name: 'SpaceX', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/SpaceX_logo_black.svg' },
        { name: 'Apple', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' }
      ];
      const batch = db.batch();
      defaultRefs.forEach(ref => batch.set(refsCol.doc(), ref));
      await batch.commit();
      console.log('Default references initialized');
    }

    // Admin user in Firestore
    const usersCol = db.collection('users');
    const adminDoc = await usersCol.doc('admin').get();
    if (!adminDoc.exists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await usersCol.doc('admin').set({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Default admin user initialized in Firestore');
    }
  } catch (error) {
    console.error('Error in initializeFirestoreData:', error);
  }
}

async function startServer() {
  const app = express();
  
  // Stripe webhook needs raw body
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return res.status(400).send('Webhook Error: Secret not set');
    }

    let event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout completed for user:', session.client_reference_id);
        break;
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.send();
  });

  app.use(express.json());

  // Auth Middleware
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

  // --- API Routes ---

  // Wrapper for async routes to catch errors
  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Health Check
  app.get('/api/health', asyncHandler(async (req: any, res: any) => {
    try {
      const test = await db.collection('test').limit(1).get();
      res.json({ 
        status: 'ok', 
        firestore: 'connected',
        project: firebaseConfig.projectId,
        database: firebaseConfig.firestoreDatabaseId
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error', 
        firestore: 'disconnected',
        error: error.message,
        code: error.code
      });
    }
  }));

  // Auth
  app.post('/api/auth/login', asyncHandler(async (req: any, res: any) => {
    const { username, password } = req.body;
    const userDoc = await db.collection('users').where('username', '==', username).limit(1).get();
    
    if (!userDoc.empty) {
      const user = userDoc.docs[0].data();
      if (bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: userDoc.docs[0].id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
        return;
      }
    }
    res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
  }));

  // Stripe Checkout
  app.post('/api/stripe/create-checkout-session', asyncHandler(async (req: any, res: any) => {
    const { priceId, userId, successUrl, cancelUrl } = req.body;
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      success_url: successUrl || `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/pricing`,
    });

    res.json({ url: session.url });
  }));

  // Services
  app.get('/api/services', asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('services').get();
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(services);
  }));

  app.get('/api/services/:slug', asyncHandler(async (req: any, res: any) => {
    const doc = await db.collection('services').doc(req.params.slug).get();
    if (doc.exists) {
      res.json({ id: doc.id, ...doc.data() });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  }));

  app.post('/api/services', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { title, slug, description, icon, content } = req.body;
    await db.collection('services').doc(slug).set({ title, slug, description, icon, content });
    res.sendStatus(201);
  }));

  app.delete('/api/services/:slug', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('services').doc(req.params.slug).delete();
    res.sendStatus(200);
  }));

  // Portfolio
  app.get('/api/portfolio', asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('portfolio').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  }));

  app.post('/api/portfolio', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { title, category, type, url, thumbnail, description } = req.body;
    await db.collection('portfolio').add({ title, category, type, url, thumbnail, description });
    res.sendStatus(201);
  }));

  app.put('/api/portfolio/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('portfolio').doc(req.params.id).update(req.body);
    res.sendStatus(200);
  }));

  app.delete('/api/portfolio/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('portfolio').doc(req.params.id).delete();
    res.sendStatus(200);
  }));

  // References
  app.get('/api/references', asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('references_logos').get();
    const logos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(logos);
  }));

  app.post('/api/references', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { name, logo_url } = req.body;
    await db.collection('references_logos').add({ name, logo_url });
    res.sendStatus(201);
  }));

  app.put('/api/references/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('references_logos').doc(req.params.id).update(req.body);
    res.sendStatus(200);
  }));

  app.delete('/api/references/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('references_logos').doc(req.params.id).delete();
    res.sendStatus(200);
  }));

  // Contact
  app.post('/api/contact', asyncHandler(async (req: any, res: any) => {
    const { name, email, phone, subject, message } = req.body;
    await db.collection('contact_submissions').add({ 
      name, email, phone, subject, message, 
      status: 'pending', 
      created_at: admin.firestore.FieldValue.serverTimestamp() 
    });
    res.sendStatus(201);
  }));

  app.get('/api/contact', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('contact_submissions').orderBy('created_at', 'desc').get();
    const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(submissions);
  }));

  // Notifications — review-status tasks for a given user
  app.get('/api/notifications', authenticateToken, asyncHandler(async (req: any, res: any) => {
    try {
      const uid = (req.user as any)?.id || req.query.uid;
      const snapshot = await db.collection('tasks')
        .where('clientId', '==', uid)
        .where('status', '==', 'review')
        .get();
      res.json({ count: snapshot.size, items: snapshot.docs.map(d => ({ id: d.id, title: d.data().title })) });
    } catch {
      res.json({ count: 0, items: [] });
    }
  }));

  // User Onboarding
  app.post('/api/users/:uid/onboard', asyncHandler(async (req: any, res: any) => {
    const { uid } = req.params;
    const { companyName, sector, packageInterest } = req.body;
    await db.collection('users').doc(uid).set({ companyName, sector, packageInterest, onboarded: true }, { merge: true });
    res.sendStatus(200);
  }));

  // Packages
  app.get('/api/packages', asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('packages').get();
    const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(packages);
  }));

  app.post('/api/packages', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('packages').add(req.body);
    res.sendStatus(201);
  }));

  app.put('/api/packages/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('packages').doc(req.params.id).update(req.body);
    res.sendStatus(200);
  }));

  app.delete('/api/packages/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('packages').doc(req.params.id).delete();
    res.sendStatus(200);
  }));

  // Settings
  app.get('/api/settings', asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('settings').get();
    const settingsObj = snapshot.docs.reduce((acc: any, doc) => {
      acc[doc.id] = doc.data().value;
      return acc;
    }, {});
    res.json(settingsObj);
  }));

  // Temporary route to populate data
  app.get('/api/populate', asyncHandler(async (req: any, res: any) => {
    const batch = db.batch();
    
    // Services
    const services = [
      { title: 'Sosyal Medya Yönetimi', slug: 'sosyal-medya-yonetimi', description: 'Markanızın dijital dünyadaki sesini profesyonelce yönetiyoruz.', icon: '📱', features: ['İçerik Stratejisi', 'Aylık Planlama', 'Topluluk Yönetimi', 'Raporlama'] },
      { title: 'Video Prodüksiyon', slug: 'video-produksiyon', description: 'Etkileyici ve profesyonel reklam filmleri üretiyoruz.', icon: '🎬', features: ['Tanıtım Filmi', 'Sosyal Medya Videoları', 'Kurgu & Montaj', 'Animasyon'] },
      { title: 'Kurumsal Kimlik', slug: 'kurumsal-kimlik', description: 'Görsel kimliğinizi modern tasarımlarla inşa ediyoruz.', icon: '🎨', features: ['Logo Tasarımı', 'Marka DNA\'sı', 'Katalog Tasarımı', 'Brand Book'] },
      { title: 'Web & E-Ticaret', slug: 'web-e-ticaret', description: 'Performans odaklı, dönüşüm getiren modern web siteleri.', icon: '💻', features: ['UI/UX Tasarım', 'Özel Yazılım', 'Shopify & WooCommerce', 'Hız Optimizasyonu'] },
      { title: 'Performans Pazarlama', slug: 'performans-pazarlama', description: 'İzlenebilir, ölçülebilir ve yatırım getirisi yüksek reklamlar.', icon: '📊', features: ['Meta Reklamları', 'Google Ads', 'SEO Optimizasyonu', 'Dönüşüm Takibi'] },
      { title: 'Fotoğraf Çekimi', slug: 'fotograf-cekimi', description: 'Ürünlerinizi ve markanızı en net şekilde yansıtın.', icon: '📷', features: ['Ürün Çekimi', 'Moda Çekimi', 'Mekan Çekimi', 'Gastronomi'] },
      { title: 'Seslendirme & Jingle', slug: 'seslendirme-jingle', description: 'Markanıza özel kurumsal ses ve müzik tasarımları.', icon: '🎙️', features: ['Reklam Seslendirmesi', 'Kurumsal Müzik', 'Podcat Prodüksiyon', 'Ses Efektleri'] },
      { title: 'Lokasyon & FPV Drone', slug: 'lokasyon-fpv-drone', description: 'Havadan eşsiz açılarla mekanlarınızı sergileyin.', icon: '🚁', features: ['FPV Çekimler', 'Klasik Drone Çekimi', '4K Havadan Video', 'Sanal Tur'] }
    ];
    services.forEach(s => batch.set(db.collection('services').doc(s.slug), s));

    // Portfolio
    const portfolio = [
      { title: 'LUXURY - Autumn Campaign', category: 'Moda & Tekstil', type: 'video', url: 'https://vimeo.com/123456789', thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800&h=600', description: 'Yeni sezon için hazırladığımız özel prodüksiyon.' },
      { title: 'Aesthetic Medical - Marka Kimliği', category: 'Kurumsal', type: 'image', url: 'https://cdn.example.com', thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800&h=600', description: 'Uluslararası medikal markanın baştan uca kurumsal kimlik tasarımı.' },
      { title: 'Urban Coffee - Sosyal Medya', category: 'Dijital', type: 'image', url: 'https://instagram.com/urbancoffee', thumbnail: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800&h=600', description: '3 aylık sosyal medya ve influencer marketing stratejisi.' },
      { title: 'The Grand Hotel - FPV Tour', category: 'Prodüksiyon', type: 'video', url: 'https://youtube.com', thumbnail: 'https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?auto=format&fit=crop&q=80&w=800&h=600', description: 'Otelin prestijli alanlarını öne çıkaran havadan çekim ve sanal tur.' }
    ];
    // Clear and override (simplistic approach: just add random IDs on top, better is to delete first, but we'll just insert newly. If needed we can clear).
    // Let's just create them. Actually, portfolio.forEach doesn't specify IDs. We might want to empty first if we were thorough, but this is fine.
    
    // Deleting old ones
    const oldPortfolio = await db.collection('portfolio').get();
    oldPortfolio.forEach(doc => batch.delete(doc.ref));
    portfolio.forEach(p => batch.set(db.collection('portfolio').doc(), p));

    // References
    const refs = [
      { name: 'Tesla', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png', toneOfVoice: 'Innovatif, Teknik', colors: ['#CC0000', '#000000'] },
      { name: 'Nike', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', toneOfVoice: 'Kararlı, Atletik, Motive Edici', colors: ['#000000', '#FFFFFF', '#FF6600'] },
      { name: 'Netflix', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', toneOfVoice: 'Eğlenceli, Samimi', colors: ['#E50914', '#221F1F'] },
      { name: 'Spotify', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg', toneOfVoice: 'Genç, Dinamik', colors: ['#1DB954', '#191414'] }
    ];
    const oldRefs = await db.collection('references_logos').get();
    oldRefs.forEach(doc => batch.delete(doc.ref));
    refs.forEach(r => batch.set(db.collection('references_logos').doc(), r));

    // Packages
    const packages = [
      { name: 'Başlangıç', price: '₺14.999', period: 'Aylık', features: JSON.stringify(['12 Sosyal Medya Tasarımı', 'Ayda 1 Kurgulu Reels', 'Temel Hedef Kitle Raporu', 'Hesap Kurulumları']), highlighted: false },
      { name: 'Büyüme (Pro)', price: '₺32.999', period: 'Aylık', features: JSON.stringify(['Sınırsız Grafik Tasarım', 'Haftada 2 Video İçerik (Reels/TikTok)', 'Meta & Google Ads Yönetimi (Reklam bütçesi hariç)', 'Aylık Check-in Toplantısı', 'Marka DNA Analizi']), highlighted: true },
      { name: 'Full-Stack Ajans', price: '₺75.000', period: 'Aylık', features: JSON.stringify(['Sınırsız Video Prodüksiyon', 'Özel Hesap Yöneticisi & Takım', 'Kapsamlı E-Ticaret Kampanyaları', 'AI Araçlarıyla Ölçeklendirme', 'Her ay 1 Tanıtım Filmi Formatı']), highlighted: false }
    ];
    const oldPackages = await db.collection('packages').get();
    oldPackages.forEach(doc => batch.delete(doc.ref));
    packages.forEach(p => batch.set(db.collection('packages').doc(), p));

    // Settings
    const settings = {
        heroTitle: "YENİ NESİL REKLAMCILIK AJANSI",
        heroSubtitle: "EN İYİLER İÇİN EN İYİSİ",
        heroDescription: "Biz sıradan içerikler üretmeyiz. Markanızın büyüme hedeflerine yönelik vizyoner kampanyalar, üst düzey prodüksiyonlar ve akıllı sistemler kurgularız.",
        contactEmail: "hello@piklab.com.tr",
        contactPhone: "+90 850 000 00 00",
        address: "Levent, İstanbul"
    };
    Object.entries(settings).forEach(([key, value]) => {
      const docRef = db.collection('settings').doc(key);
      batch.set(docRef, { value: String(value) });
    });

    await batch.commit();
    res.json({ message: 'Tüm Piklab içerikleri başarıyla veritabanına aktarıldı!' });
  }));

  app.post('/api/settings', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { settings } = req.body; // { key: value }
    const batch = db.batch();
    Object.entries(settings).forEach(([key, value]) => {
      const docRef = db.collection('settings').doc(key);
      batch.set(docRef, { value: String(value) });
    });
    await batch.commit();
    res.sendStatus(200);
  }));

  // Clients
  app.get('/api/clients', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('clients').get();
    const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(clients);
  }));

  app.post('/api/clients', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const docRef = await db.collection('clients').add(req.body);
    res.status(201).json({ id: docRef.id, ...req.body });
  }));

  // Tasks
  app.get('/api/tasks', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('tasks').get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  }));

  app.post('/api/tasks', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const docRef = await db.collection('tasks').add({
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: docRef.id, ...req.body, createdAt: new Date().toISOString() });
  }));

  app.put('/api/tasks/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('tasks').doc(req.params.id).update(req.body);
    res.sendStatus(200);
  }));

  app.delete('/api/tasks/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await db.collection('tasks').doc(req.params.id).delete();
    res.sendStatus(200);
  }));

  // Comments
  app.get('/api/tasks/:taskId/comments', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('comments').where('taskId', '==', req.params.taskId).get();
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(comments);
  }));

  app.post('/api/tasks/:taskId/comments', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const docRef = await db.collection('comments').add({
      ...req.body,
      taskId: req.params.taskId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: docRef.id, ...req.body, taskId: req.params.taskId, createdAt: new Date().toISOString() });
  }));

  // Canvas Pins
  app.get('/api/tasks/:taskId/pins', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const snapshot = await db.collection('canvas_pins').where('taskId', '==', req.params.taskId).get();
    const pins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(pins);
  }));

  app.post('/api/tasks/:taskId/pins', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const docRef = await db.collection('canvas_pins').add({
      ...req.body,
      taskId: req.params.taskId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: docRef.id, ...req.body, taskId: req.params.taskId, createdAt: new Date().toISOString() });
  }));

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message,
      code: err.code 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,   // Disable HMR WebSocket to avoid EPERM on macOS w/ Node 25
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 4000;
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

  const server = app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
    
    // Initialize data in background
    initializeFirestoreData().catch(err => {
      console.error('Failed to initialize Firestore data:', err);
    });
  });

  server.on('error', (err: any) => {
    console.error('Server error:', err.message);
    process.exit(1);
  });
}

startServer();


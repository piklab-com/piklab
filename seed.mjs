import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

async function seed() {
  const configStr = await readFile('./firebase-applet-config.json', 'utf8');
  const firebaseConfig = JSON.parse(configStr);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
  }

  const db = getFirestore(admin.app());
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
  console.log("SEEDED SUCCESSFULLY!");
}

seed().catch(console.error);

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle, Star, Users, BarChart3, CreditCard, Quote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginWithGoogle } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { api } from '../lib/api';
import { SEO } from '../components/SEO';

// ── Animated Counter ─────────────────────────────────────────────────
const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1200;
        const steps = 60;
        const step = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          setCount(Math.floor(current));
          if (current >= target) clearInterval(timer);
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// ── Hero ─────────────────────────────────────────────────────────────
const Hero = ({ settings }: { settings: any }) => (
  <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-accent">
    <div className="absolute top-20 right-10 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float"></div>
    <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed"></div>

    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-4 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-brutal-black font-bold uppercase tracking-widest text-sm mb-8 transform -rotate-2">
          <Sparkles size={16} className="text-primary" /> {settings?.heroSubtitle || "EN İYİLER İÇİN EN İYİSİ"}
        </div>
        <h1 className="text-fluid-hero font-display leading-[0.85] mb-8 text-brutal-black">
          {settings?.heroTitle ? (
            <span dangerouslySetInnerHTML={{ __html: settings.heroTitle.replace('REKLAMCILIK', '<span class="text-primary relative inline-block">REKLAMCILIK<svg class="absolute -bottom-2 left-0 w-full h-4 text-brutal-black" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="4" fill="transparent" /></svg></span>') }} />
          ) : (
            <>YENİ NESİL <br />
            <span className="text-primary relative inline-block">REKLAMCILIK
              <svg className="absolute -bottom-2 left-0 w-full h-4 text-brutal-black" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="4" fill="transparent" />
              </svg>
            </span> <br />AJANSI.</>
          )}
        </h1>
        <p className="text-gray-700 text-xl max-w-md mb-10 font-medium leading-relaxed border-l-4 border-primary pl-6">
          {settings?.heroDescription || "Her gün dünden biraz daha fazla çalışıyor, biraz daha fazla üretiyoruz. Markalarımızı hep bir adım yukarı taşımaktan keyif alıyoruz."}
        </p>
        <div className="flex flex-wrap gap-6">
          <button onClick={() => window.location.href='/portfolyo'} className="brutal-btn flex items-center gap-2">
            Projeleri İncele <ArrowRight size={24} />
          </button>
          <button onClick={() => window.location.href='/iletisim'} className="brutal-btn-secondary">
            Bizimle Tanışın
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative">
        <div className="aspect-[4/5] brutal-border bg-white overflow-hidden rotate-3 relative z-10">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&h=1000"
            alt="Piklab Creative Studio"
            className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal smooth-transition"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
        </div>
        <div className="absolute -bottom-10 -left-10 bg-white p-6 brutal-border -rotate-6 max-w-[240px] z-20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary border-4 border-brutal-black flex items-center justify-center text-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle size={32} />
            </div>
            <div>
              <p className="text-4xl font-display leading-none"><AnimatedCounter target={500} suffix="+" /></p>
              <p className="text-sm font-bold uppercase tracking-widest">Mutlu Marka</p>
            </div>
          </div>
        </div>
        <div className="absolute top-10 -right-10 w-24 h-24 bg-white border-4 border-brutal-black rounded-full flex items-center justify-center animate-float z-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Star className="text-primary" size={40} fill="currentColor" />
        </div>
      </motion.div>
    </div>

    {/* Marquee */}
    <div className="absolute bottom-0 left-0 w-full bg-brutal-black text-white py-4 overflow-hidden border-y-4 border-brutal-black z-30 transform rotate-1 scale-105">
      <div className="marquee-track flex gap-8 items-center">
        {[...Array(6)].map((_, i) => (
          <React.Fragment key={i}>
            <span className="text-2xl md:text-3xl font-display uppercase tracking-widest whitespace-nowrap">Estetik Bir Tercih, Performans Zorunluluktur</span>
            <Star size={24} className="text-primary flex-shrink-0" fill="currentColor" />
            <span className="text-2xl md:text-3xl font-display uppercase tracking-widest whitespace-nowrap">ROI Odaklı Büyüme</span>
            <Star size={24} className="text-primary flex-shrink-0" fill="currentColor" />
          </React.Fragment>
        ))}
      </div>
    </div>
  </section>
);

// ── Flow Section ──────────────────────────────────────────────────────
const FlowSection = () => (
  <section className="section-padding bg-brutal-black text-white border-b-4 border-brutal-black relative overflow-hidden">
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <div className="marquee-track flex gap-8 whitespace-nowrap text-8xl font-display translate-y-8">
        {[...Array(4)].map((_, i) => <span key={i} className="mx-8">PİKLAB FLOW •</span>)}
      </div>
    </div>
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10 mb-16">
        <div>
          <p className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-brutal-black border-4 border-brutal-black font-bold uppercase tracking-widest text-xs mb-6">
            <Sparkles size={16} /> Piklab Flow
          </p>
          <h2 className="text-fluid-title font-display leading-none mb-6">
            Süreç değil, <br /><span className="text-primary">sistem</span> tasarladık.
          </h2>
          <p className="text-gray-200 text-lg max-w-xl font-medium border-l-4 border-primary pl-6">
            Piklab, aboneliğini başlattığın andan itibaren; paket seçimi, brief, üretim, onay ve raporlama adımlarını senin için tek bir akışa dönüştürür.
          </p>
        </div>
        <div className="bg-accent text-brutal-black brutal-border px-6 py-4 max-w-sm rotate-1">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Gerçek Zamanlı Panel</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold mb-1">Onay bekleyen 2 içerik var</p>
              <p className="text-xs text-gray-600">Son teslim: Cuma • 17:30</p>
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary border-2 border-brutal-black flex items-center justify-center text-xs font-bold">M</div>
              <div className="w-8 h-8 rounded-full bg-white border-2 border-brutal-black flex items-center justify-center text-xs font-bold">D</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: CreditCard, step: '1. Adım', title: 'Sürprizsiz Net Fiyat', desc: 'Gizli masraf yok. İhtiyacınıza göre abonelik paketini seçin, markanız için en doğru adımı şeffaf bir şekilde atın.', items: ['Dilediğinde iptal et', 'İstediğin zaman paket yükselt', 'Net bütçe planlaması'] },
          { icon: Users, step: '2. Adım', title: 'Online Onay Sistemi', desc: 'Tasarımların hızlıca onaylandığı panel desteği ile üretim süreci kesintiye uğramaz, zaman kazandırır.', items: ['Yapay değil, amaca yönelik plan', 'İçerik dili kararı', 'Tek tıkla revize veya onay'], highlight: true },
          { icon: BarChart3, step: '3. Adım', title: 'Düzenli Raporlama', desc: 'Sürecin şeffaf takibi için haftalık ve aylık raporlarla markanızın büyümesini anlık olarak takip edin.', items: ['Performans analizi', 'Aylık teslim özeti', 'Hedef kitle gelişim raporu'] },
        ].map(({ icon: Icon, step, title, desc, items, highlight }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`brutal-border p-8 relative overflow-hidden group ${highlight ? 'bg-primary text-brutal-black md:-translate-y-4' : 'bg-accent text-brutal-black'}`}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full mix-blend-multiply opacity-0 group-hover:opacity-30 smooth-transition"></div>
            <div className="w-14 h-14 bg-white border-4 border-brutal-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 smooth-transition">
              <Icon size={26} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{step}</p>
            <h3 className="text-2xl font-display mb-3">{title}</h3>
            <p className="text-sm font-medium mb-4 opacity-80">{desc}</p>
            <ul className="space-y-1 text-xs font-semibold text-gray-600">
              {items.map((item, j) => <li key={j}>• {item}</li>)}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ── Stats Section ──────────────────────────────────────────────────────
const StatsSection = () => (
  <section className="py-16 bg-primary border-y-4 border-brutal-black">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {[
        { target: 500, suffix: '+', label: 'Mutlu Marka' },
        { target: 8, suffix: '+', label: 'Yıl Deneyim' },
        { target: 1200, suffix: '+', label: 'Teslim Edilen Proje' },
        { target: 98, suffix: '%', label: 'Müşteri Memnuniyeti' },
      ].map(({ target, suffix, label }, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <p className="text-5xl md:text-7xl font-display text-brutal-black mb-2">
            <AnimatedCounter target={target} suffix={suffix} />
          </p>
          <p className="font-bold uppercase tracking-widest text-sm text-brutal-black/70">{label}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

// ── Packages Section ──────────────────────────────────────────────────
const PackagesSection = ({ packages, onSubscribe }: { packages: any[], onSubscribe: (pkg: any) => void }) => (
  <section id="paketler" className="section-padding bg-white border-b-4 border-brutal-black">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-fluid-title font-display mb-6 leading-none">ŞEFFAF <span className="text-primary">PAKETLER</span></h2>
        <p className="text-gray-600 text-xl font-medium max-w-2xl mx-auto">İhtiyacınıza en uygun abonelik modelini seçin, sürpriz maliyetler olmadan hemen başlayalım.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.length > 0 ? packages.map((pkg, index) => {
          const features = Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features || '[]');
          const isHighlighted = pkg.highlighted ?? (index === 1);
          return (
            <div key={pkg.id} className={`p-10 brutal-border relative ${isHighlighted ? 'bg-brutal-black text-white transform md:-translate-y-4' : 'bg-accent'}`}>
              {isHighlighted && (
                <div className="absolute -top-5 -right-5 bg-primary text-brutal-black font-display px-4 py-2 border-4 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-12">EN POPÜLER</div>
              )}
              <h3 className="text-4xl font-display mb-4">{pkg.name}</h3>
              <div className="flex items-baseline gap-2 mb-8 pb-8 border-b-4 border-current">
                <span className="text-5xl font-display">{pkg.price}</span>
                <span className={`text-xl font-bold uppercase tracking-widest ${isHighlighted ? 'text-gray-400' : 'text-gray-500'}`}>/{pkg.period}</span>
              </div>
              <ul className="space-y-4 mb-10">
                {features.map((f: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-lg font-medium">
                    <div className={`w-6 h-6 border-2 flex items-center justify-center flex-shrink-0 mt-1 ${isHighlighted ? 'border-primary text-primary' : 'border-brutal-black text-brutal-black'}`}>
                      <CheckCircle size={16} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onSubscribe(pkg)}
                className={`w-full py-5 font-display text-2xl uppercase border-4 border-brutal-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 transition-all duration-200 ${isHighlighted ? 'bg-primary text-brutal-black' : 'bg-white text-brutal-black'}`}
              >
                Hemen Başla
              </button>
            </div>
          );
        }) : (
          [1, 2, 3].map(i => <div key={i} className="bg-accent p-10 brutal-border h-[600px] animate-pulse"></div>)
        )}
      </div>
    </div>
  </section>
);

// ── References Section ─────────────────────────────────────────────────
const ReferencesSection = ({ brands }: { brands: any[] }) => {
  if (brands.length === 0) return null;
  return (
    <section className="py-20 bg-brutal-black border-b-4 border-brutal-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
        <p className="font-bold uppercase tracking-widest text-sm text-gray-400">BİZE GÜVENEN MARKALAR</p>
      </div>
      <div className="relative">
        <div className="marquee-track flex gap-16 items-center">
          {[...brands, ...brands].map((brand, i) => (
            <div key={i} className="flex-shrink-0 flex items-center gap-4 hover:opacity-100 opacity-50 smooth-transition">
              {brand.logoUrl || brand.logo_url ? (
                <img
                  src={brand.logoUrl || brand.logo_url}
                  alt={brand.name}
                  className="h-10 w-auto object-contain filter invert brightness-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-3xl font-display text-white whitespace-nowrap">{brand.name.toUpperCase()}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Testimonials Section ───────────────────────────────────────────────
const testimonials = [
  { name: 'Ayşe Kaya', role: 'Pazarlama Direktörü, FinTech A.Ş.', text: 'Piklab ile çalışmak adeta bir dönüşüm hikayesi oldu. 6 ayda sosyal medya erişimimiz 4 kat arttı. Ekibin hızı, yaratıcılığı ve veri odaklı yaklaşımı bizi çok etkiledi.', stars: 5 },
  { name: 'Mehmet Demir', role: 'CEO, Urban Kafe Zinciri', text: 'Video prodüksiyon kalitesi harika. İlk FPV drone çekimimiz yayınlandığında organik olarak viral oldu. Bu başarı tamamen Piklab\'ın vizyoner bakış açısı sayesinde.', stars: 5 },
  { name: 'Selin Arslan', role: 'Marka Müdürü, Luxury Tekstil', text: 'Tanıtım filminden kurumsal kimliğe kadar her şeyi tek çatı altında hallettik. Süreç tamamen şeffaftı, onay sistemi bize büyük zaman kazandırdı.', stars: 5 },
];

const TestimonialsSection = () => {
  const [active, setActive] = useState(0);
  return (
    <section className="section-padding bg-accent border-b-4 border-brutal-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-brutal-black border-4 border-brutal-black font-bold uppercase tracking-widest text-xs mb-6">
            <Star size={14} fill="currentColor" /> Referanslar
          </p>
          <h2 className="text-fluid-title font-display leading-none">MÜŞTERİLER <span className="text-primary">KONUŞUYOR</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              className={`brutal-border p-8 relative cursor-pointer smooth-transition ${active === i ? 'bg-primary text-brutal-black' : 'bg-white'}`}
              onClick={() => setActive(i)}
            >
              <Quote size={40} className={`mb-4 ${active === i ? 'text-brutal-black' : 'text-primary'}`} />
              <p className="text-lg font-medium leading-relaxed mb-8 italic">"{t.text}"</p>
              <div className="flex items-center gap-4 border-t-4 border-current pt-6">
                <div className={`w-14 h-14 rounded-full border-4 ${active === i ? 'border-brutal-black bg-white text-brutal-black' : 'border-brutal-black bg-primary text-white'} flex items-center justify-center font-display text-2xl`}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-lg">{t.name}</p>
                  <p className={`text-sm ${active === i ? 'text-brutal-black/70' : 'text-gray-500'}`}>{t.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {[...Array(t.stars)].map((_, j) => <Star key={j} size={16} fill={active === i ? '#000' : '#f27d26'} className={active === i ? 'text-brutal-black' : 'text-primary'} />)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Main Home Component ───────────────────────────────────────────────
const Home = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    api.getPackages().then(setPackages);
    api.getBrands().then(setBrands);
  }, []);

  const handleSubscribe = async (pkg: any) => {
    if (!user) {
      await loginWithGoogle();
      return;
    }
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: pkg.stripePriceId || '',
          userId: user.uid,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/#paketler`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Stripe henüz yapılandırılmamış. Lütfen admin ile iletişime geçin.');
      }
    } catch {
      alert('Ödeme sistemi şu an kullanılamıyor, lütfen daha sonra tekrar deneyin.');
    }
  };

  return (
    <>
      <SEO title="Ana Sayfa" description="Piklab — Yeni nesil kurumsal medya ve prodüksiyon ajansı. Video prodüksiyon, grafik tasarım, AI entegrasyonları ve daha fazlası." />
      <Hero settings={settings} />
      <FlowSection />
      <StatsSection />
      <PackagesSection packages={packages} onSubscribe={handleSubscribe} />
      <ReferencesSection brands={brands} />
      <TestimonialsSection />
    </>
  );
};

export default Home;

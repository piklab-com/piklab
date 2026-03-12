import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle, Star, Users, BarChart3, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginWithGoogle } from '../firebase';
import { Package } from '../types';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Hero = ({ settings }: { settings: any }) => (
  <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-accent">
    {/* Background Elements */}
    <div className="absolute top-20 right-10 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float"></div>
    <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed"></div>
    
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-4 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-brutal-black font-bold uppercase tracking-widest text-sm mb-8 transform -rotate-2">
          <Sparkles size={16} className="text-primary" /> {settings?.heroSubtitle || "EN İYİLER İÇİN EN İYİSİ"}
        </div>
        <h1 className="text-7xl md:text-9xl font-display leading-[0.85] mb-8 text-brutal-black">
          {settings?.heroTitle ? (
            <span dangerouslySetInnerHTML={{ __html: settings.heroTitle.replace('REKLAMCILIK', '<span class="text-primary relative inline-block">REKLAMCILIK<svg class="absolute -bottom-2 left-0 w-full h-4 text-brutal-black" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="4" fill="transparent" /></svg></span>') }} />
          ) : (
            <>YENİ NESİL <br /> 
            <span className="text-primary relative inline-block">
              REKLAMCILIK
              <svg className="absolute -bottom-2 left-0 w-full h-4 text-brutal-black" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="4" fill="transparent" />
              </svg>
            </span> <br /> 
            AJANSI.</>
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

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative"
      >
        <div className="aspect-[4/5] brutal-border bg-white overflow-hidden rotate-3 relative z-10">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&h=1000" 
            alt="Piktram Style Creative Work" 
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
              <p className="text-4xl font-display leading-none">500+</p>
              <p className="text-sm font-bold uppercase tracking-widest">Mutlu Marka</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 -right-10 w-24 h-24 bg-white border-4 border-brutal-black rounded-full flex items-center justify-center animate-float z-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Star className="text-primary" size={40} fill="currentColor" />
        </div>
      </motion.div>
    </div>
    
    {/* Marquee at the bottom of hero */}
    <div className="absolute bottom-0 left-0 w-full bg-brutal-black text-white py-4 overflow-hidden border-y-4 border-brutal-black z-30 transform rotate-1 scale-105">
      <div className="marquee-track flex gap-8 items-center">
        {[...Array(6)].map((_, i) => (
          <React.Fragment key={i}>
            <span className="text-3xl font-display uppercase tracking-widest">Estetik Bir Tercih, Performans Zorunluluktur</span>
            <Star size={24} className="text-primary" fill="currentColor" />
            <span className="text-3xl font-display uppercase tracking-widest">ROI Odaklı Büyüme</span>
            <Star size={24} className="text-primary" fill="currentColor" />
          </React.Fragment>
        ))}
      </div>
    </div>
  </section>
);

const FlowSection = () => (
  <section className="section-padding bg-brutal-black text-white border-b-4 border-brutal-black relative overflow-hidden">
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <div className="marquee-track flex gap-8 whitespace-nowrap text-8xl font-display translate-y-8">
        <span className="mx-8">PİKLAB FLOW •</span>
        <span className="mx-8">PİKLAB FLOW •</span>
        <span className="mx-8">PİKLAB FLOW •</span>
        <span className="mx-8">PİKLAB FLOW •</span>
      </div>
    </div>

    <div className="max-w-7xl mx-auto relative z-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10 mb-16">
        <div>
          <p className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-brutal-black border-4 border-brutal-black font-bold uppercase tracking-widest text-xs mb-6">
            <Sparkles size={16} /> Piklab Flow
          </p>
          <h2 className="text-5xl md:text-7xl font-display leading-none mb-6">
            Süreç değil, <br />
            <span className="text-primary">sistem</span> tasarladık.
          </h2>
          <p className="text-gray-200 text-lg max-w-xl font-medium border-l-4 border-primary pl-6">
            Piklab, aboneliğini başlattığın andan itibaren; paket seçimi, brief, üretim, onay ve raporlama adımlarını
            senin için tek bir akışa dönüştürür. Her adımı panelden takip edebilirsin.
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
              <div className="w-8 h-8 rounded-full bg-primary border-2 border-brutal-black flex items-center justify-center text-xs font-bold">
                M
              </div>
              <div className="w-8 h-8 rounded-full bg-white border-2 border-brutal-black flex items-center justify-center text-xs font-bold">
                D
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-accent text-brutal-black brutal-border p-8 relative overflow-hidden group"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary rounded-full mix-blend-multiply opacity-0 group-hover:opacity-60 smooth-transition"></div>
          <div className="w-14 h-14 bg-white border-4 border-brutal-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 smooth-transition">
            <CreditCard size={26} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">1. Adım</p>
          <h3 className="text-2xl font-display mb-3">Sürprizsiz Net Fiyat</h3>
          <p className="text-sm font-medium text-gray-700 mb-4">
            Gizli masraf yok. İhtiyacınıza göre abonelik paketini seçin, markanız için en doğru adımı şeffaf bir şekilde atın.
          </p>
          <ul className="space-y-1 text-xs font-semibold text-gray-600">
            <li>• Dilediğinde iptal et</li>
            <li>• İstediğin zaman paket yükselt</li>
            <li>• Net bütçe planlaması</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary text-brutal-black brutal-border p-8 relative overflow-hidden group md:-translate-y-4"
        >
          <div className="absolute -bottom-12 -right-6 w-40 h-40 bg-accent rounded-full mix-blend-multiply opacity-60"></div>
          <div className="w-14 h-14 bg-white border-4 border-brutal-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 smooth-transition">
            <Users size={26} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">2. Adım</p>
          <h3 className="text-2xl font-display mb-3">Online Onay Sistemi</h3>
          <p className="text-sm font-semibold mb-2">
            Tasarımların hızlıca onaylandığı panel desteği ile üretim süreci kesintiye uğramaz, zaman kazandırır.
          </p>
          <ul className="space-y-1 text-xs font-semibold">
            <li>• Yapay değil, amaca yönelik plan</li>
            <li>• İçerik dili kararı</li>
            <li>• Tek tıkla revize veya onay</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-accent text-brutal-black brutal-border p-8 relative overflow-hidden group"
        >
          <div className="absolute -top-8 -left-8 w-28 h-28 bg-primary rounded-full mix-blend-multiply opacity-40"></div>
          <div className="w-14 h-14 bg-white border-4 border-brutal-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 smooth-transition">
            <BarChart3 size={26} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">3. Adım</p>
          <h3 className="text-2xl font-display mb-3">Düzenli Raporlama</h3>
          <p className="text-sm font-medium text-gray-700 mb-4">
            Sürecin şeffaf takibi için haftalık ve aylık raporlarla markanızın büyümesini anlık olarak takip edin.
          </p>
          <ul className="space-y-1 text-xs font-semibold text-gray-600">
            <li>• Performans analizi</li>
            <li>• Aylık teslim özeti</li>
            <li>• Hedef kitle gelişim raporu</li>
          </ul>
        </motion.div>
      </div>
    </div>
  </section>
);

import { api } from '../lib/api';

const PackagesSection = ({ packages, onSubscribe }: { packages: any[], onSubscribe: (pkg: any) => void }) => (
  <section id="paketler" className="section-padding bg-white border-b-4 border-brutal-black">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-6xl md:text-8xl font-display mb-6 leading-none">ŞEFFAF <span className="text-primary">PAKETLER</span></h2>
        <p className="text-gray-600 text-xl font-medium max-w-2xl mx-auto">İhtiyacınıza en uygun abonelik modelini seçin, sürpriz maliyetler olmadan hemen başlayalım.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.length > 0 ? packages.map((pkg, index) => {
          const features = Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features || '[]');
          const isHighlighted = pkg.highlighted ?? (index === 1);
          
          return (
            <div key={pkg.id} className={`bg-accent p-10 brutal-border relative ${isHighlighted ? 'bg-brutal-black text-white transform md:-translate-y-4' : ''}`}>
              {isHighlighted && (
                <div className="absolute -top-5 -right-5 bg-primary text-brutal-black font-display px-4 py-2 border-4 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-12">
                  EN POPÜLER
                </div>
              )}
              <h3 className="text-4xl font-display mb-4">{pkg.name}</h3>
              <div className="flex items-baseline gap-2 mb-8 pb-8 border-b-4 border-current">
                <span className="text-6xl font-display">{pkg.price}</span>
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
          [1, 2, 3].map(i => (
            <div key={i} className="bg-accent p-10 brutal-border h-[600px] animate-pulse"></div>
          ))
        )}
      </div>
    </div>
  </section>
);

const Home = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch
    api.getPackages().then(setPackages);

    // Optional: Keep listening for changes if another tab updates them
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'piklab_packages' || e.type === 'api_changed_packages') {
        api.getPackages().then(setPackages);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('api_changed_packages', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('api_changed_packages', handleStorageChange);
    };
  }, []);

  const handleSubscribe = async (pkg: any) => {
    if (!user) {
      await loginWithGoogle();
      return;
    }
    // Subscription logic remains the same
    alert('Abonelik işlemi başlatılıyor: ' + pkg.name);
  };

  return (
    <>
      <Hero settings={settings} />
      <FlowSection />
      <PackagesSection packages={packages} onSubscribe={handleSubscribe} />
    </>
  );
};

export default Home;

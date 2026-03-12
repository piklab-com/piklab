import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Target, Eye, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

const teamMembers = [
  { name: 'Ahmet Yılmaz', role: 'Kurucu & Kreatif Direktör', initials: 'AY', color: 'bg-primary' },
  { name: 'Elif Şahin', role: 'Video Prodüksiyon Başkanı', initials: 'EŞ', color: 'bg-brutal-black' },
  { name: 'Can Demirci', role: 'AI & Teknoloji Direktörü', initials: 'CD', color: 'bg-blue-600' },
  { name: 'Zeynep Arslan', role: 'Strateji & Büyüme Müdürü', initials: 'ZA', color: 'bg-green-600' },
];

const values = [
  { icon: Target, title: 'Performans Odaklı', desc: 'Her içerik, ölçülebilir bir hedefle üretilir. Güzellik tek başına yetmez; dönüşüm sağlamıyorsa yeniden tasarlarız.' },
  { icon: Eye, title: 'Şeffaflık', desc: 'Gizli ücret yok, muğlak taahhüt yok. Her adımı, her kararı ve her sonucu seninle açıkça paylaşırız.' },
  { icon: Sparkles, title: 'Yaratıcı Cesaret', desc: 'Sıradan yollarla olağanüstü sonuçlar elde edilmez. Alışılmadık fikirlere, cesur tasarımlara inanıyoruz.' },
  { icon: Zap, title: 'Hız & Kalite', desc: 'Piklab Flow sistemi sayesinde teslim sürelerimiz sektör ortalamasının 2 katı hızlı, kaliteden ödün vermeden.' },
];

const About = () => (
  <>
    <SEO
      title="Hakkımızda"
      description="Piklab — Yeni nesil kurumsal medya ve prodüksiyon ajansı. Ekibimiz, hikayemiz ve değerlerimiz hakkında daha fazlasını öğrenin."
    />

    {/* Hero */}
    <section className="relative min-h-[70vh] bg-brutal-black text-white flex items-end pt-32 pb-0 overflow-hidden border-b-4 border-primary">
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div className="max-w-7xl mx-auto px-6 pb-24 relative z-10 w-full">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-brutal-black border-4 border-brutal-black font-bold uppercase tracking-widest text-xs mb-8">
            <Sparkles size={14} /> Biz Kimiz?
          </p>
          <h1 className="text-fluid-hero font-display leading-none mb-8 text-white">
            MARKALAR İÇİN <br /><span className="text-primary">YENİ BİR DİL</span>
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl font-medium leading-relaxed border-l-4 border-primary pl-6">
            2018'den bu yana İstanbul merkezli olarak faaliyet gösteren Piklab, kurumsal markaların dijital dünyada ses getiren içerikler üretmesine aracı oluyor. Prodüksiyondan stratejiye, AI'dan sosyal medyaya tek çatı altında.
          </p>
        </motion.div>
      </div>
      {/* Slanted bottom */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-accent" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}></div>
    </section>

    {/* Mission & Vision */}
    <section className="section-padding bg-accent border-b-4 border-brutal-black">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} className="brutal-border bg-white p-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Misyonumuz</p>
          <h2 className="text-4xl font-display mb-6">ÖLÇÜLEBILIR BAŞARI</h2>
          <p className="text-gray-700 font-medium leading-relaxed text-lg">
            Markaların büyüme hedeflerine ulaşmasını sağlamak için strateji, yaratıcılık ve teknolojiyi bir araya getiriyoruz. Her proje, somut ve ölçülebilir sonuçlara yönelik tasarlanır.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} className="brutal-border bg-primary text-brutal-black p-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-4">Vizyonumuz</p>
          <h2 className="text-4xl font-display mb-6">TÜRKIYE'NİN EN İYİ AJANSI</h2>
          <p className="font-medium leading-relaxed text-lg">
            2030 yılına kadar Türkiye'nin en yenilikçi ve en çok tercih edilen kurumsal medya ajansı olmak; AI destekli iş akışlarını standartlaştırarak sektöre öncülük etmek.
          </p>
        </motion.div>
      </div>
    </section>

    {/* Values */}
    <section className="section-padding bg-white border-b-4 border-brutal-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-fluid-title font-display leading-none mb-4">DEĞERLERİMİZ</h2>
          <p className="text-gray-500 font-medium text-lg">Her kararımızın arkasında bu ilkeler yatıyor.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="brutal-border bg-accent p-8 group"
            >
              <div className="w-16 h-16 bg-primary border-4 border-brutal-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 smooth-transition">
                <Icon size={28} className="text-brutal-black" />
              </div>
              <h3 className="text-2xl font-display mb-3">{title}</h3>
              <p className="text-gray-700 font-medium leading-relaxed text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="section-padding bg-brutal-black text-white border-b-4 border-primary">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-fluid-title font-display leading-none mb-4 text-white">EKİBİMİZ</h2>
          <p className="text-gray-400 font-medium text-xl max-w-xl">Farklı disiplinlerden gelen uzmanlar, ortak bir tutkuyla bir araya geldi.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {teamMembers.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className="brutal-border bg-white/5 p-6 text-center group hover:bg-primary smooth-transition"
            >
              <div className={`w-24 h-24 ${member.color} border-4 border-white flex items-center justify-center text-white font-display text-4xl mx-auto mb-6 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] group-hover:rotate-6 smooth-transition`}>
                {member.initials}
              </div>
              <h3 className="text-xl font-display mb-2">{member.name}</h3>
              <p className="text-gray-400 text-sm font-medium group-hover:text-brutal-black/70 smooth-transition">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="section-padding bg-primary border-b-4 border-brutal-black text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-fluid-title font-display leading-none mb-6">BİRLİKTE ÇALIŞALIM</h2>
        <p className="text-brutal-black/80 font-medium text-xl mb-10">Markanızın potansiyelini keşfetmek için bize ulaşın. İlk görüşme tamamen ücretsiz.</p>
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/iletisim" className="brutal-btn-secondary flex items-center gap-2">
            İletişime Geç <ArrowRight size={24} />
          </Link>
          <Link to="/portfolyo" className="brutal-btn flex items-center gap-2">
            Projelerimizi İncele
          </Link>
        </div>
      </div>
    </section>
  </>
);

export default About;

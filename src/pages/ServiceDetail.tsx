import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, Star, Phone, Mail } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api, Service } from '../lib/api';
import { SEO } from '../components/SEO';

const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getServices().then(services => {
      const found = services.find(s => s.slug === slug || s.id === slug);
      if (found) setService(found);
      else navigate('/hizmetler');
      setLoading(false);
    });
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brutal-black border-t-primary animate-spin rounded-none"></div>
      </div>
    );
  }

  if (!service) return null;

  return (
    <>
      <SEO
        title={service.title}
        description={service.description || `Piklab ${service.title} hizmeti — profesyonel ve ölçülebilir sonuçlar.`}
      />
      <div className="min-h-screen bg-accent pt-24">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link to="/hizmetler" className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:text-primary smooth-transition">
            <ArrowLeft size={18} /> Tüm Hizmetler
          </Link>
        </div>

        {/* Hero */}
        <section className="bg-brutal-black text-white py-24 px-6 relative overflow-hidden border-y-4 border-primary">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-brutal-black border-4 border-brutal-black font-bold uppercase tracking-widest text-xs mb-8">
                Hizmet Detayı
              </p>
              <h1 className="text-fluid-hero font-display leading-none mb-8 text-white">{service.title}</h1>
              <p className="text-gray-300 text-xl max-w-2xl font-medium leading-relaxed border-l-4 border-primary pl-6">
                {service.description || 'Markanızı bir üst seviyeye taşıyacak profesyonel hizmet.'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main content */}
          <div className="lg:col-span-2">
            <h2 className="text-4xl font-display mb-8">NE SUNUYORUZ?</h2>
            {service.content ? (
              <div className="prose prose-lg max-w-none text-gray-700 font-medium leading-relaxed">
                <p>{service.content}</p>
              </div>
            ) : (
              <p className="text-gray-600 text-lg font-medium leading-relaxed">
                {service.title} alanında uzman ekibimizle markanıza özel stratejiler geliştiriyor, ölçülebilir ve sürdürülebilir sonuçlar üretiyoruz. Piklab Flow sistemi sayesinde tüm süreç şeffaf bir şekilde takip edilebilir.
              </p>
            )}

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className="mt-12">
                <h3 className="text-3xl font-display mb-8">KAPSAM</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.07 }}
                      className="flex items-start gap-4 p-6 brutal-border bg-white group"
                    >
                      <div className="w-10 h-10 bg-primary border-4 border-brutal-black flex items-center justify-center flex-shrink-0 group-hover:rotate-12 smooth-transition shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <CheckCircle size={20} />
                      </div>
                      <p className="font-bold text-lg">{feature}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* CTA Card */}
            <div className="brutal-border bg-primary p-8">
              <h3 className="text-3xl font-display mb-4">BU HİZMETE İLGİNİZ Mİ VAR?</h3>
              <p className="font-medium mb-8">Ücretsiz keşif görüşmesi için bizimle iletişime geçin.</p>
              <Link to="/iletisim" className="brutal-btn-secondary block text-center">
                İletişime Geç
              </Link>
            </div>

            {/* Why us */}
            <div className="brutal-border bg-white p-8">
              <h3 className="text-2xl font-display mb-6">NEDEN PİKLAB?</h3>
              <ul className="space-y-4">
                {['7+ yıl sektör deneyimi', 'AI destekli iş akışları', 'Şeffaf fiyatlandırma', 'Garantili teslim süreleri', 'Revizyon garantisi'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold">
                    <Star size={16} fill="#f27d26" className="text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact mini */}
            <div className="brutal-border bg-brutal-black text-white p-8">
              <h3 className="text-2xl font-display mb-6 text-primary">HIZLI İLETİŞİM</h3>
              <div className="space-y-4 font-bold">
                <a href="mailto:hello@piklab.com" className="flex items-center gap-3 hover:text-primary smooth-transition">
                  <Mail size={18} className="text-primary" /> hello@piklab.com
                </a>
                <a href="tel:+905550000000" className="flex items-center gap-3 hover:text-primary smooth-transition">
                  <Phone size={18} className="text-primary" /> +90 (555) 000 00 00
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Related Services CTA */}
        <div className="bg-brutal-black border-t-4 border-primary py-20 px-6 text-center">
          <h2 className="text-4xl font-display text-white mb-4">DİĞER HİZMETLERİMİZİ İNCELEYİN</h2>
          <p className="text-gray-400 font-medium mb-8">Tüm dijital ihtiyaçlarınız için tek çatı altındayız.</p>
          <Link to="/hizmetler" className="brutal-btn inline-flex items-center gap-2">
            Tüm Hizmetler <ArrowLeft size={20} className="rotate-180" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default ServiceDetail;

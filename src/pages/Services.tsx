import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Video, Camera, MapPin, Plane, Share2, PenTool, LayoutTemplate, LineChart, Mic, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, Service } from '../lib/api';
import { SEO } from '../components/SEO';

const IconMap: { [key: string]: React.ReactNode } = {
  '🎬': <Video size={40} />, '📷': <Camera size={40} />, '🚁': <Plane size={40} />,
  '📱': <Share2 size={40} />, '🎨': <PenTool size={40} />, '💻': <LayoutTemplate size={40} />,
  '📊': <LineChart size={40} />, '🎙️': <Mic size={40} />, '📍': <MapPin size={40} />
};

const Services = () => {
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.getServices().then(setServicesData);
  }, []);

  return (
    <>
      <SEO title="Hizmetler" description="Piklab hizmetleri: sosyal medya yönetimi, video prodüksiyon, grafik tasarım, AI entegrasyonları, FPV drone, SEO & ADS ve daha fazlası." />
      <section className="section-padding bg-white min-h-[80vh] pt-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h1 className="text-fluid-title font-display mb-6 leading-none">UZMANLIK <br /><span className="text-primary">ALANLARIMIZ</span></h1>
              <p className="text-gray-600 text-xl font-medium border-l-4 border-brutal-black pl-6">
                Markanızın ihtiyacı olan tüm dijital çözümleri tek bir çatı altında, performansı merkeze alarak tasarlıyoruz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesData.map((service, index) => {
              const isExpanded = expandedId === service.id;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className={`bg-accent p-8 brutal-border group relative flex flex-col items-start smooth-transition ${isExpanded ? 'bg-brutal-black text-white' : ''}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full mix-blend-multiply filter blur-2xl opacity-0 group-hover:opacity-50 smooth-transition translate-x-10 -translate-y-10"></div>

                  <div className={`w-20 h-20 border-4 border-brutal-black flex items-center justify-center mb-6 smooth-transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 flex-shrink-0 ${isExpanded ? 'bg-primary text-brutal-black' : 'bg-white text-brutal-black group-hover:bg-primary group-hover:text-white'}`}>
                    {IconMap[service.icon] || <Video size={40} />}
                  </div>

                  <h3 className={`text-3xl font-display mb-3 leading-tight inline-block px-2 transform -rotate-1 relative z-10 border-2 border-brutal-black ${isExpanded ? 'bg-primary text-brutal-black' : 'bg-white'}`}>
                    {service.title}
                  </h3>

                  <p className={`font-medium leading-relaxed mb-4 relative z-10 smooth-transition ${isExpanded ? 'text-white/80' : 'text-gray-700'}`}>
                    {service.description}
                  </p>

                  {/* Expandable features */}
                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden w-full"
                  >
                    <div className="mb-6 w-full relative z-10">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-2 border-b-2 ${isExpanded ? 'border-white/30 text-primary pb-1' : 'border-brutal-black text-gray-500 pb-1'}`}>ÖNE ÇIKANLAR</p>
                      <ul className="space-y-2 mt-2">
                        {(service.features || []).map((feature, idx) => (
                          <li key={idx} className={`flex items-start gap-2 text-sm font-semibold ${isExpanded ? 'text-white' : ''}`}>
                            <span className="text-primary">■</span> {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>

                  <div className="flex gap-3 mt-auto pt-4 w-full z-10 relative">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : service.id)}
                      className={`w-12 h-12 border-4 border-brutal-black flex items-center justify-center smooth-transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isExpanded ? 'bg-primary text-brutal-black rotate-180' : 'bg-white text-brutal-black hover:bg-brutal-black hover:text-primary'}`}
                    >
                      <ChevronDown size={22} />
                    </button>
                    <Link
                      to={`/hizmetler/${service.slug || service.id}`}
                      className={`flex-1 border-4 border-brutal-black flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] smooth-transition ${isExpanded ? 'bg-primary text-brutal-black hover:bg-white' : 'bg-white text-brutal-black hover:bg-primary'}`}
                    >
                      Detaylar <ArrowRight size={18} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;

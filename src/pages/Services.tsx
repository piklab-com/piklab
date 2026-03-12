import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Video, Camera, MapPin, Plane, Share2, PenTool, LayoutTemplate, LineChart, Mic } from 'lucide-react';

import { api, Service } from '../lib/api';

const IconMap: { [key: string]: any } = {
  '🎬': <Video size={40} />,
  '📷': <Camera size={40} />,
  '🚁': <Plane size={40} />,
  '📱': <Share2 size={40} />,
  '🎨': <PenTool size={40} />,
  '💻': <LayoutTemplate size={40} />,
  '📊': <LineChart size={40} />,
  '🎙️': <Mic size={40} />,
  '📍': <MapPin size={40} />
};

const Services = () => {
  const [servicesData, setServicesData] = useState<Service[]>([]);

  useEffect(() => {
    api.getServices().then(setServicesData);
  }, []);

  return (
    <section className="section-padding bg-white min-h-[80vh] pt-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-6xl md:text-8xl font-display mb-6 leading-none">UZMANLIK <br/><span className="text-primary">ALANLARIMIZ</span></h2>
            <p className="text-gray-600 text-xl font-medium border-l-4 border-brutal-black pl-6">Markanızın ihtiyacı olan tüm dijital çözümleri tek bir çatı altında, performansı merkeze alarak tasarlıyoruz.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesData.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-accent p-8 brutal-border group relative flex flex-col items-start"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full mix-blend-multiply filter blur-2xl opacity-0 group-hover:opacity-50 smooth-transition translate-x-10 -translate-y-10"></div>
              
              <div className="w-20 h-20 bg-white border-4 border-brutal-black flex items-center justify-center text-brutal-black mb-6 group-hover:bg-primary group-hover:text-white smooth-transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 flex-shrink-0">
                {IconMap[service.icon] || <Video size={40} />}
              </div>
              
              <h3 className="text-3xl font-display mb-3 leading-tight bg-white inline-block px-2 transform -rotate-1 relative z-10 border-2 border-brutal-black">{service.title}</h3>
              
              <p className="text-gray-700 font-medium leading-relaxed mb-6 relative z-10">{service.description}</p>
              
              <div className="mb-8 w-full relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 border-b-2 border-brutal-black pb-1">ÖNE ÇIKANLAR</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm font-semibold">
                      <span className="text-primary">■</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button className="w-14 h-14 bg-white border-4 border-brutal-black flex items-center justify-center group-hover:bg-brutal-black group-hover:text-primary smooth-transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-auto mt-4">
                <ArrowRight size={24} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

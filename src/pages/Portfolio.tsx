import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Play, ArrowRight } from 'lucide-react';
import { api, PortfolioItem, Brand } from '../lib/api';

const Portfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    api.getPortfolio().then(setPortfolioItems);
    api.getBrands().then(setBrands);
  }, []);

  return (
    <section className="section-padding bg-accent min-h-screen pt-32">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <h2 className="text-6xl md:text-8xl font-display mb-6 leading-none">SEÇİLMİŞ <br/><span className="text-primary">PROJELER</span></h2>
          <p className="text-gray-600 text-xl font-medium border-l-4 border-brutal-black pl-6">Sadece "iş" yapmıyoruz. Markaların karakterini dijital dünyaya yansıtıyoruz.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {portfolioItems.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white brutal-border overflow-hidden group"
            >
              <div className="aspect-video relative overflow-hidden bg-brutal-black">
                <img 
                  src={project.thumbnail} 
                  alt={project.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 smooth-transition"
                />
                <div className="absolute top-4 left-4 bg-primary text-brutal-black font-bold px-4 py-2 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                  {project.type === 'video' ? <Play size={16} fill="currentColor" /> : <Camera size={16} />}
                  {project.category.toUpperCase()}
                </div>
              </div>
              
              <div className="p-8 flex justify-between items-center group-hover:bg-primary smooth-transition">
                <div>
                  <h3 className="text-3xl font-display group-hover:text-white smooth-transition">{project.title}</h3>
                  <p className="text-gray-500 font-bold group-hover:text-white/80 smooth-transition">{project.description}</p>
                </div>
                <button className="w-16 h-16 bg-white border-4 border-brutal-black flex items-center justify-center group-hover:bg-brutal-black group-hover:text-primary smooth-transition shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <ArrowRight size={32} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* References Marquee */}
        <div className="mt-32 pb-20">
          <p className="text-center font-bold text-gray-400 uppercase tracking-widest mb-10">BİZE GÜVENEN MARKALAR</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-50 grayscale hover:grayscale-0 smooth-transition px-4">
            {brands.map((brand) => (
              <div key={brand.id} className="text-3xl md:text-5xl font-display text-gray-400 hover:text-brutal-black cursor-default smooth-transition whitespace-nowrap flex items-center gap-4">
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.name} className="h-12 w-auto object-contain" />
                ) : (
                  <span>{brand.name.toUpperCase()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Play, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { api, PortfolioItem } from '../lib/api';
import { SEO } from '../components/SEO';

const CATEGORIES = ['Tümü', 'Prodüksiyon', 'Moda & Tekstil', 'Dijital', 'Kurumsal', 'Fotoğraf', 'Sosyal Medya'];

const Portfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    api.getPortfolio().then(setPortfolioItems);
  }, []);

  const filtered = activeCategory === 'Tümü'
    ? portfolioItems
    : portfolioItems.filter(p => p.category === activeCategory);

  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = useCallback(() => setLightboxIndex(i => i !== null ? (i - 1 + filtered.length) % filtered.length : null), [filtered.length]);
  const next = useCallback(() => setLightboxIndex(i => i !== null ? (i + 1) % filtered.length : null), [filtered.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, next, prev]);

  const activeLightboxItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <>
      <SEO title="Portfolyo" description="Piklab'ın seçilmiş projeleri — moda filmlerinden FPV drone çekimlerine, kurumsal kimlik tasarımlarından sosyal medya kampanyalarına." />
      <section className="section-padding bg-accent min-h-screen pt-32">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-fluid-title font-display mb-6 leading-none">SEÇİLMİŞ <br /><span className="text-primary">PROJELER</span></h1>
            <p className="text-gray-600 text-xl font-medium border-l-4 border-brutal-black pl-6">Sadece "iş" yapmıyoruz. Markaların karakterini dijital dünyaya yansıtıyoruz.</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-12">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 border-4 border-brutal-black font-bold uppercase tracking-widest text-sm transition-all duration-200 ${activeCategory === cat
                  ? 'bg-primary text-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-brutal-black hover:bg-accent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filtered.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white brutal-border overflow-hidden group cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <div className="aspect-video relative overflow-hidden bg-brutal-black">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 smooth-transition"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-primary text-brutal-black font-bold px-4 py-2 brutal-border text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {project.type === 'video' ? <Play size={14} fill="currentColor" /> : <Camera size={14} />}
                      {project.category.toUpperCase()}
                    </div>
                    <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 smooth-transition flex items-center justify-center">
                      <span className="text-brutal-black font-display text-2xl uppercase tracking-widest">İNCELE →</span>
                    </div>
                  </div>
                  <div className="p-8 flex justify-between items-center group-hover:bg-primary smooth-transition">
                    <div>
                      <h3 className="text-3xl font-display group-hover:text-brutal-black smooth-transition">{project.title}</h3>
                      <p className="text-gray-500 font-bold group-hover:text-brutal-black/70 smooth-transition">{project.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-32 text-gray-400 font-display text-3xl">Bu kategoride proje bulunamadı.</div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {activeLightboxItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute top-6 right-6 w-14 h-14 bg-white border-4 border-brutal-black flex items-center justify-center hover:bg-primary smooth-transition z-10">
              <X size={24} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 md:left-8 w-14 h-14 bg-white border-4 border-brutal-black flex items-center justify-center hover:bg-primary smooth-transition z-10">
              <ChevronLeft size={28} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 md:right-8 w-14 h-14 bg-white border-4 border-brutal-black flex items-center justify-center hover:bg-primary smooth-transition z-10">
              <ChevronRight size={28} />
            </button>

            <div className="lightbox-content max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              <div className="brutal-border bg-white overflow-hidden">
                {activeLightboxItem.type === 'video' && activeLightboxItem.url?.includes('youtube') ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${activeLightboxItem.url.split('v=')[1]}`}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <img
                    src={activeLightboxItem.thumbnail}
                    alt={activeLightboxItem.title}
                    className="w-full max-h-[70vh] object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="p-8 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">{activeLightboxItem.category}</p>
                    <h3 className="text-3xl font-display">{activeLightboxItem.title}</h3>
                    <p className="text-gray-500 font-medium mt-2">{activeLightboxItem.description}</p>
                  </div>
                  {activeLightboxItem.url && (
                    <a href={activeLightboxItem.url} target="_blank" rel="noreferrer"
                       className="brutal-btn text-sm py-3 px-5 flex items-center gap-2 flex-shrink-0 ml-6">
                      <ExternalLink size={18} /> Projeye Git
                    </a>
                  )}
                </div>
              </div>
              <p className="text-center text-gray-400 mt-4 text-sm font-bold">{(lightboxIndex ?? 0) + 1} / {filtered.length}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Portfolio;

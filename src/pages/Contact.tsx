import React from 'react';
import { Mail, Phone } from 'lucide-react';

const Contact = () => {
  return (
    <div className="pt-24 bg-accent min-h-screen flex items-center">
      <section className="section-padding w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h2 className="text-7xl md:text-9xl font-display mb-8 leading-none text-brutal-black">HADİ <br /> <span className="text-primary">KONUŞALIM!</span></h2>
            <p className="text-gray-700 text-xl font-medium mb-12 border-l-4 border-brutal-black pl-6">
              Yeni bir projeniz mi var? Veya sadece merhaba demek mi istiyorsunuz? Formu doldurun, en kısa sürede size dönelim.
            </p>
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white border-4 border-brutal-black flex items-center justify-center text-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><Mail size={32} /></div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">E-posta</p>
                  <p className="text-2xl font-display">hello@piklab.com</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white border-4 border-brutal-black flex items-center justify-center text-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><Phone size={32} /></div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Telefon</p>
                  <p className="text-2xl font-display">+90 (555) 000 00 00</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 brutal-border">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest">Ad Soyad</label>
                  <input type="text" className="w-full px-6 py-4 bg-accent border-4 border-brutal-black focus:bg-white outline-none font-medium transition-colors" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest">E-posta</label>
                  <input type="email" className="w-full px-6 py-4 bg-accent border-4 border-brutal-black focus:bg-white outline-none font-medium transition-colors" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest">Konu</label>
                <input type="text" className="w-full px-6 py-4 bg-accent border-4 border-brutal-black focus:bg-white outline-none font-medium transition-colors" placeholder="Proje Hakkında" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest">Mesajınız</label>
                <textarea rows={4} className="w-full px-6 py-4 bg-accent border-4 border-brutal-black focus:bg-white outline-none font-medium transition-colors resize-none" placeholder="Mesajınızı buraya yazın..."></textarea>
              </div>
              <button className="w-full py-5 bg-primary text-brutal-black font-display text-2xl uppercase border-4 border-brutal-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 transition-all duration-200 mt-4">
                Mesajı Gönder
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

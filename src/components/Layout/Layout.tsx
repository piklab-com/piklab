import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogIn, LayoutDashboard, Instagram, Linkedin, Facebook, Mail, Phone, MapPin, Moon, Sun } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Dark Mode Hook ──────────────────────────────────────────────────
const useDarkMode = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('teras_theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('teras_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, logout: authLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { dark, toggle } = useDarkMode();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Anasayfa', href: '/' },
    { name: 'Hizmetler', href: '/hizmetler' },
    { name: 'Portfolyo', href: '/portfolyo' },
    { name: 'Hakkımızda', href: '/hakkimizda' },
    { name: 'İletişim', href: '/iletisim' },
  ];

  return (
    <nav className={`fixed w-full z-50 smooth-transition ${scrolled ? 'bg-accent/90 backdrop-blur-md py-4 border-b-4 border-brutal-black' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-12 h-12 bg-primary border-4 border-brutal-black flex items-center justify-center text-white font-display text-2xl group-hover:rotate-12 smooth-transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">T</div>
          <span className="text-3xl font-display tracking-widest text-brutal-black">TERAS</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`text-sm font-bold uppercase tracking-wider hover:text-primary hover:-translate-y-1 smooth-transition ${location.pathname === link.href ? 'text-primary' : ''}`}
            >
              {link.name}
            </Link>
          ))}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggle}
            aria-label="Tema değiştir"
            className="w-10 h-10 border-4 border-brutal-black bg-white flex items-center justify-center smooth-transition hover:bg-primary hover:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="brutal-btn-secondary text-sm py-2 px-5 flex items-center gap-2"
              >
                <LayoutDashboard size={16} />
                {profile?.displayName?.split(' ')[0] || 'Panel'}
              </button>
              <button
                onClick={() => { authLogout(); navigate('/'); }}
                className="text-sm font-bold text-gray-500 hover:text-red-600 uppercase tracking-wider smooth-transition"
              >
                Çıkış
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/giris')}
              className="brutal-btn text-sm py-2 px-6 flex items-center gap-2"
            >
              <LogIn size={18} /> Giriş Yap
            </button>
          )}
        </div>

        {/* Mobile: dark toggle + menu */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label="Tema değiştir"
            className="w-10 h-10 border-4 border-brutal-black bg-white flex items-center justify-center"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="p-2 border-4 border-brutal-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-accent border-b-4 border-brutal-black shadow-2xl py-8 px-6 flex flex-col gap-6 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-2xl font-display uppercase tracking-wider border-b-4 border-brutal-black pb-2 hover:text-primary ${location.pathname === link.href ? 'text-primary' : ''}`}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex flex-col gap-3">
                <button onClick={() => { setIsOpen(false); navigate('/dashboard'); }} className="brutal-btn w-full flex items-center justify-center gap-2">
                  <LayoutDashboard size={18} /> Panelim
                </button>
                <button onClick={() => { authLogout(); navigate('/'); setIsOpen(false); }} className="w-full py-3 font-bold text-red-500 uppercase tracking-wider">
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <button onClick={() => { setIsOpen(false); navigate('/giris'); }} className="brutal-btn w-full flex items-center justify-center gap-2">
                <LogIn size={18} /> Giriş Yap
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-brutal-black text-white pt-24 pb-10 border-t-8 border-primary mt-auto">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-14 h-14 bg-primary border-4 border-white flex items-center justify-center text-white font-display text-3xl">T</div>
            <span className="text-5xl font-display tracking-widest">TERAS MEDYA</span>
          </div>
          <p className="text-gray-400 text-xl font-medium max-w-md leading-relaxed mb-8">
            Teras Medya, yeni nesil dijital medya ajansıdır. Markanızın hikayesini en etkileyici şekilde anlatmak için yaratıcı çözümler sunuyoruz.
          </p>
          <div className="flex gap-4">
            <a href="https://instagram.com/terasmedya" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-14 h-14 bg-white border-4 border-white text-brutal-black flex items-center justify-center hover:bg-primary hover:border-primary smooth-transition shadow-[4px_4px_0px_0px_rgba(0,143,90,1)]"><Instagram size={24} /></a>
            <a href="https://linkedin.com/company/terasmedya" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-14 h-14 bg-white border-4 border-white text-brutal-black flex items-center justify-center hover:bg-primary hover:border-primary smooth-transition shadow-[4px_4px_0px_0px_rgba(0,143,90,1)]"><Linkedin size={24} /></a>
            <a href="https://facebook.com/terasmedya" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-14 h-14 bg-white border-4 border-white text-brutal-black flex items-center justify-center hover:bg-primary hover:border-primary smooth-transition shadow-[4px_4px_0px_0px_rgba(0,143,90,1)]"><Facebook size={24} /></a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-2xl mb-8 text-primary">HIZLI LİNKLER</h4>
          <ul className="space-y-4 font-bold uppercase tracking-wider">
            <li><Link to="/" className="hover:text-primary hover:pl-2 smooth-transition inline-block">Anasayfa</Link></li>
            <li><Link to="/hizmetler" className="hover:text-primary hover:pl-2 smooth-transition inline-block">Hizmetler</Link></li>
            <li><Link to="/portfolyo" className="hover:text-primary hover:pl-2 smooth-transition inline-block">Portfolyo</Link></li>
            <li><Link to="/hakkimizda" className="hover:text-primary hover:pl-2 smooth-transition inline-block">Hakkımızda</Link></li>
            <li><Link to="/iletisim" className="hover:text-primary hover:pl-2 smooth-transition inline-block">İletişim</Link></li>
            <li><Link to="/giris" className="hover:text-primary hover:pl-2 smooth-transition inline-block">Müşteri Girişi</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-2xl mb-8 text-primary">BİZE ULAŞIN</h4>
          <ul className="space-y-6 font-bold">
            <li className="flex items-center gap-4"><div className="w-10 h-10 bg-white/10 flex items-center justify-center"><Mail size={20} className="text-primary"/></div> info@terasmedya.com</li>
            <li className="flex items-center gap-4"><div className="w-10 h-10 bg-white/10 flex items-center justify-center"><Phone size={20} className="text-primary"/></div> +90 540 005 25 20</li>
            <li className="flex items-center gap-4"><div className="w-10 h-10 bg-white/10 flex items-center justify-center"><MapPin size={20} className="text-primary"/></div> Enntepe Mall, Konya</li>
          </ul>
        </div>
      </div>

      <div className="pt-10 border-t-4 border-white/10 text-center font-bold uppercase tracking-widest text-sm">
        <p>© 2025 TERAS MEDYA. TÜM HAKLARI SAKLIDIR.</p>
      </div>
    </div>
  </footer>
);

export const Layout = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const savedTheme = localStorage.getItem('teras_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-accent">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

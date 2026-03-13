import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { loginWithAPI, registerWithAPI } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithAPI(email, password);
      } else {
        if (!name) { setError('Ad alanı zorunludur.'); return; }
        await registerWithAPI(name, email, password);
      }
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003d27] via-[#005a3a] to-[#008f5a] flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{ width: 100 + i * 80, height: 100 + i * 80, left: `${10 + i * 15}%`, top: `${5 + i * 12}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center text-primary font-bold text-3xl mb-4 shadow-xl">
            T
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Teras Medya</h1>
          <p className="text-white/60 mt-1">Müşteri Portalı</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 shadow-2xl"
        >
          {/* Mode Toggle */}
          <div className="flex bg-white/10 rounded-2xl p-1 mb-8">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === m ? 'bg-white text-primary shadow' : 'text-white/70 hover:text-white'}`}
              >
                {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Ad Soyad" required={mode === 'register'}
                      className="w-full pl-11 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 outline-none focus:border-white/60 transition-colors font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-posta adresi" required
                className="w-full pl-11 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 outline-none focus:border-white/60 transition-colors font-medium"
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Şifre" required minLength={6}
                className="w-full pl-11 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 outline-none focus:border-white/60 transition-colors font-medium"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 text-red-200 text-sm font-medium">
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-white text-primary rounded-2xl font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> İşleniyor...</>
              ) : (
                <>{mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'} <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-white/40 text-sm mt-6">
              Teras Medya müşteri portali. Demo: <span className="text-white/70 font-mono">admin@terasmedya.com</span>
            </p>
          )}
        </motion.div>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2025 Teras Medya. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}

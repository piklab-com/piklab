import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Building, Globe, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SECTORS = [
  'Moda & Tekstil', 'Teknoloji', 'Gıda & Restoran', 'Sağlık', 'Finans',
  'Eğitim', 'Gayrimenkul', 'Otomotiv', 'Turizm & Otelcilik', 'Diğer'
];

const PACKAGES_INTEREST = ['Başlangıç', 'Büyüme (Pro)', 'Full-Stack Ajans', 'Henüz karar vermedim'];

interface OnboardingModalProps {
  onClose: () => void;
}

export const OnboardingModal = ({ onClose }: OnboardingModalProps) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [packageInterest, setPackageInterest] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save onboarding data to Firestore via API
      if (user?.uid) {
        await fetch(`/api/users/${user.uid}/onboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, sector, packageInterest, onboarded: true })
        });
      }
      // Save to localStorage as fallback
      localStorage.setItem('teras_onboarded', 'true');
    } catch {
      localStorage.setItem('teras_onboarded', 'true');
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
          className="bg-white brutal-border w-full max-w-xl relative p-10"
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-gray-100 flex items-center justify-center hover:bg-red-50">
            <X size={20} />
          </button>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2].map(i => (
              <div key={i} className={`h-2 flex-1 border-2 border-brutal-black transition-all duration-400 ${step >= i ? 'bg-primary' : 'bg-gray-100'}`}></div>
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="w-16 h-16 bg-primary border-4 border-brutal-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Building size={28} />
              </div>
              <h2 className="text-4xl font-display mb-2">HOŞ GELDİNİZ! 👋</h2>
              <p className="text-gray-500 font-medium mb-8">Sizi biraz tanıyalım — 2 hızlı soru.</p>

              <div className="space-y-6">
                <div>
                  <label className="block font-bold uppercase tracking-widest text-xs mb-3">Şirket / Marka Adı</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Örn: Urban Kafe"
                    className="w-full border-4 border-brutal-black px-5 py-4 font-bold text-lg outline-none focus:border-primary smooth-transition"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-widest text-xs mb-3">Sektör</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTORS.map(s => (
                      <button
                        key={s}
                        onClick={() => setSector(s)}
                        className={`py-3 px-4 border-4 border-brutal-black font-bold text-sm text-left transition-all duration-200 ${sector === s ? 'bg-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-accent'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!companyName || !sector}
                className="w-full mt-8 brutal-btn flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Devam Et <ChevronRight size={22} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="w-16 h-16 bg-primary border-4 border-brutal-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Sparkles size={28} />
              </div>
              <h2 className="text-4xl font-display mb-2">NEREDE BAŞLAYALIM?</h2>
              <p className="text-gray-500 font-medium mb-8">Hangi pakete ilgi duyuyorsunuz? (Kesin değil, referans için)</p>

              <div className="grid grid-cols-1 gap-3">
                {PACKAGES_INTEREST.map(pkg => (
                  <button
                    key={pkg}
                    onClick={() => setPackageInterest(pkg)}
                    className={`py-5 px-6 border-4 border-brutal-black font-bold text-lg text-left transition-all duration-200 flex items-center justify-between ${packageInterest === pkg ? 'bg-brutal-black text-white' : 'bg-white hover:bg-accent'}`}
                  >
                    {pkg}
                    {packageInterest === pkg && <Globe size={20} className="text-primary" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(1)} className="brutal-btn-secondary px-6 py-4 text-sm">Geri</button>
                <button
                  onClick={handleFinish}
                  disabled={!packageInterest || saving}
                  className="flex-1 brutal-btn flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {saving ? (
                    <><div className="w-5 h-5 border-4 border-black/30 border-t-black rounded-full animate-spin" /> Kaydediliyor...</>
                  ) : (
                    <><Sparkles size={20} /> Panelime Git</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;

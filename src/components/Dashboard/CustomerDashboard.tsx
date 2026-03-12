import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, CheckCircle, Clock, 
  LogOut, Plus, MessageSquare, 
  AlertCircle, Sparkles, Wand2,
  PieChart, Share2, Target, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, Task, Brand } from '../../lib/api';
import { TaskDetailModal } from './TaskDetailModal';
import { generateMarketingBrief } from '../../services/aiService';

type ActiveTab = 'overview' | 'tasks' | 'dna' | 'analytics';

export default function CustomerDashboard() {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // AI Brief State
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [briefInput, setBriefInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTask, setGeneratedTask] = useState<Partial<Task> | null>(null);

  // Fallback to client_1 if no profile (for local testing)
  const currentClientId = profile?.uid || 'client_1';

  const loadData = async () => {
    const allTasks = await api.getTasks();
    const myTasks = allTasks.filter(t => t.clientId === currentClientId);
    setTasks(myTasks);
    setBrands(await api.getBrands());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [currentClientId]);

  const handleCreateBrief = async () => {
    if (!briefInput.trim()) return;
    setIsGenerating(true);
    try {
      const brief = await generateMarketingBrief(briefInput);
      if (brief) {
        setGeneratedTask({
          title: brief.title,
          description: brief.description,
          type: 'post',
          status: 'brief'
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmGeneratedTask = async () => {
    if (!generatedTask) return;
    await api.addTask({
      title: generatedTask.title || 'Yeni Görev',
      description: generatedTask.description || '',
      clientId: currentClientId,
      status: 'brief',
      type: generatedTask.type as any || 'post',
    });
    setGeneratedTask(null);
    setShowBriefModal(false);
    setBriefInput('');
    await loadData();
  };

  const handleUpdateBrandDna = async (brandId: string, updates: Partial<Brand>) => {
    await api.updateBrand(brandId, updates);
    await loadData();
  };

  const statusColor: Record<Task['status'], string> = {
    brief: 'bg-gray-100 text-gray-600',
    designing: 'bg-blue-100 text-blue-600',
    review: 'bg-yellow-100 text-yellow-600',
    revision: 'bg-red-100 text-red-600',
    approved: 'bg-green-100 text-green-600'
  };

  const statusLabel: Record<Task['status'], string> = {
    brief: 'Sıraya Alındı',
    designing: 'Tasarımda',
    review: 'Onayınızda',
    revision: 'Revizyonda',
    approved: 'Tamamlandı'
  };

  const reviewTasks = tasks.filter(t => t.status === 'review');
  const activeTasks = tasks.filter(t => t.status !== 'approved');

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">P</div>
          <div>
            <span className="font-bold text-lg tracking-tight">Piklab</span>
            <p className="text-xs text-gray-400 font-medium">Müşteri Paneli</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Genel Bakış' },
            { id: 'tasks', icon: Clock, label: 'İşlerim', badge: activeTasks.length },
            { id: 'dna', icon: Target, label: 'Marka DNA' },
            { id: 'analytics', icon: PieChart, label: 'Analizler' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold smooth-transition ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50 hover:text-secondary'}`}
            >
              <span className="flex items-center gap-3">
                <item.icon size={20} />
                {item.label}
              </span>
              {item.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {profile?.displayName?.charAt(0) || 'M'}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{profile?.displayName || 'Örnek Müşteri'}</p>
              <p className="text-xs text-gray-400 truncate">Piklab Partner</p>
            </div>
          </div>
          <button onClick={() => logout?.()} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-400 hover:bg-red-50 smooth-transition">
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {activeTab === 'overview' && 'Hoş Geldiniz!'}
              {activeTab === 'tasks' && 'İş Takibi'}
              {activeTab === 'dna' && 'Marka DNA'}
              {activeTab === 'analytics' && 'Performans Analizi'}
            </h1>
            <p className="text-gray-400 mt-1 font-medium italic">
              "Fikirlerinizi gerçeğe dönüştürüyoruz."
            </p>
          </div>
          <button 
            onClick={() => setShowBriefModal(true)}
            className="bg-primary text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-primary/90 smooth-transition shadow-xl shadow-primary/20"
          >
            <Sparkles size={20} />
            Yapay Zeka ile Brief Oluştur
          </button>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Clock size={28} />
                </div>
                <p className="text-4xl font-bold mb-1">{activeTasks.length}</p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aktif Görevler</p>
              </div>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Eye size={28} />
                </div>
                <p className="text-4xl font-bold mb-1">{reviewTasks.length}</p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Onay Bekleyenler</p>
                {reviewTasks.length > 0 && (
                  <div className="absolute top-6 right-6 flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase animate-pulse">
                    Aksiyon Gerekli
                  </div>
                )}
              </div>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle size={28} />
                </div>
                <p className="text-4xl font-bold mb-1">{tasks.filter(t => t.status === 'approved').length}</p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tamamlanan İşler</p>
              </div>
            </div>

            {/* Recent Tasks */}
            {reviewTasks.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <AlertCircle className="text-yellow-500" />
                  Onayınız Bekleyen İçerikler
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviewTasks.map(task => (
                    <motion.div 
                      key={task.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative"
                    >
                      <div className="aspect-video rounded-2xl bg-gray-50 mb-4 overflow-hidden border border-gray-100 group relative">
                        {task.assetUrl ? (
                          <img src={task.assetUrl} alt={task.title} className="w-full h-full object-cover group-hover:scale-105 smooth-transition" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Eye size={48} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center smooth-transition">
                          <button onClick={() => setSelectedTask(task)} className="bg-white text-secondary px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                             İncele & Onayla
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold mb-1">{task.title}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">{task.type}</p>
                      <button 
                        onClick={() => setSelectedTask(task)}
                        className="w-full py-3 bg-yellow-50 text-yellow-600 rounded-xl font-bold text-sm hover:bg-yellow-100 smooth-transition"
                      >
                         Aksiyon Al
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6 text-left">İş Başlığı</th>
                    <th className="px-8 py-6 text-left">Tür</th>
                    <th className="px-8 py-6 text-left">Durum</th>
                    <th className="px-8 py-6 text-right">Detaylar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50/50 smooth-transition">
                      <td className="px-8 py-6">
                        <p className="font-bold text-lg">{task.title}</p>
                        <p className="text-sm text-gray-400 truncate max-w-sm">{task.description}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black uppercase tracking-widest bg-gray-100 text-gray-600 px-3 py-1 rounded-md">
                          {task.type}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full ${statusColor[task.status]}`}>
                          {statusLabel[task.status]}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary hover:bg-primary hover:text-white smooth-transition"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="max-w-xs mx-auto text-gray-400">
                          <Clock size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="font-bold">Henüz bir işiniz bulunmuyor.</p>
                          <p className="text-sm mt-2">Hemen sağ üstten yeni bir brief oluşturarak başlayabilirsiniz!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dna' && (
          <div className="space-y-8">
            {brands.map(brand => (
              <div key={brand.id} className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{brand.name} DNA</h2>
                    <p className="text-gray-400">Marka kimliğinizi ve yapay zeka hafızasını buradan yönetin.</p>
                  </div>
                  <div className="flex gap-4">
                     <span className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm">Aktif Hafıza: %98</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div>
                    <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Sparkles size={16} className="text-primary" /> Marka Ses Tonu
                    </h3>
                    <textarea 
                      defaultValue={brand.toneOfVoice || "Profesyonel, samimi ve yenilikçi bir dil kullanımı."}
                      onBlur={(e) => handleUpdateBrandDna(brand.id, { toneOfVoice: e.target.value })}
                      className="w-full h-40 p-6 bg-accent rounded-3xl border-none focus:ring-2 focus:ring-primary outline-none text-gray-700 leading-relaxed resize-none"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Target size={16} className="text-primary" /> Renk Paleti (Hex)
                    </h3>
                    <div className="flex flex-wrap gap-4 mb-6">
                      {(brand.colors || ['#FF6321', '#141414', '#FFFFFF']).map((color, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-2xl shadow-sm border border-gray-100" style={{ backgroundColor: color }} />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white p-20 rounded-[40px] shadow-sm border border-gray-100 text-center">
             <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <PieChart size={48} />
             </div>
             <h2 className="text-2xl font-bold mb-2">Veriler Hazırlanıyor</h2>
             <p className="text-gray-400 max-w-sm mx-auto">İçerikleriniz yayına girdikten sonra erişim ve etkileşim analizlerini buradan takip edebileceksiniz.</p>
          </div>
        )}
      </main>

      {/* AI Brief Modal */}
      <AnimatePresence>
        {showBriefModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-secondary/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] p-10 shadow-2xl overflow-hidden relative"
            >
              {!generatedTask ? (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                        <Wand2 size={24} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">Fikrini Anlat</h2>
                        <p className="text-gray-400">AI senin için detaylı bir brief hazırlasın.</p>
                      </div>
                    </div>
                    <button onClick={() => setShowBriefModal(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <textarea 
                      value={briefInput}
                      onChange={(e) => setBriefInput(e.target.value)}
                      placeholder="Örn: Yeni çıkacak kahve makinemiz için modern ve minimalist bir Instagram postu istiyorum..."
                      className="w-full h-48 p-6 bg-gray-50 border-none rounded-3xl outline-none focus:ring-2 focus:ring-primary text-lg resize-none"
                    />
                    <button 
                      onClick={handleCreateBrief}
                      disabled={!briefInput.trim() || isGenerating}
                      className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 smooth-transition shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                          Yapay Zeka Analiz Ediyor...
                        </>
                      ) : (
                        <>
                          <Sparkles size={24} />
                          Brief'i Hazırla
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <CheckCircle className="text-green-500" /> Yapay Zeka Taslağı Hazırladı
                  </h2>
                  <div className="bg-accent p-6 rounded-3xl mb-8">
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">Görev Başlığı:</p>
                    <p className="text-xl font-bold mb-6">{generatedTask.title}</p>
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">Detaylı Açıklama:</p>
                    <p className="text-gray-600 leading-relaxed mb-6">{generatedTask.description}</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setGeneratedTask(null)}
                      className="flex-1 py-4 rounded-2xl border border-gray-100 font-bold hover:bg-gray-50 smooth-transition"
                    >
                      Yeniden Yaz
                    </button>
                    <button 
                      onClick={confirmGeneratedTask}
                      className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 smooth-transition shadow-lg shadow-primary/20"
                    >
                      Onayla ve Sıraya Al
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            currentUser={{ uid: currentClientId, displayName: profile?.displayName || 'Örnek Müşteri', role: 'client' } as any}
            users={[
              { uid: 'admin', displayName: 'Yönetici', role: 'admin' } as any,
              { uid: currentClientId, displayName: profile?.displayName || 'Örnek Müşteri', role: 'client' } as any
            ]}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
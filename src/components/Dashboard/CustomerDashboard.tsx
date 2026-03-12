import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Clock, LogOut, Plus, MessageSquare,
  AlertCircle, CheckCircle, FileText, CreditCard,
  Eye, Send, Paperclip, Bell, ChevronRight, X,
  Folder, TrendingUp, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, Task } from '../../lib/api';
import { TaskDetailModal } from './TaskDetailModal';

type ActiveTab = 'overview' | 'projects' | 'tasks' | 'invoices' | 'messages';

// ─── New Project Wizard ───────────────────────────────────────────────
const SERVICE_OPTIONS = [
  { id: 'sosyal-medya', label: 'Sosyal Medya Yönetimi', icon: '📱' },
  { id: 'video', label: 'Video Prodüksiyon', icon: '🎬' },
  { id: 'tasarim', label: 'Grafik Tasarım', icon: '🎨' },
  { id: 'drone', label: 'FPV Drone Çekim', icon: '🚁' },
  { id: 'seo', label: 'SEO & ADS', icon: '📊' },
  { id: 'kurumsal', label: 'Kurumsal Kimlik', icon: '🏢' },
];

function NewProjectWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    service_type: '',
    title: '',
    brief: '',
    budget: '',
    deadline: '',
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.createProject({
        title: form.title || form.service_type || 'Yeni Proje',
        service_type: form.service_type,
        brief: form.brief,
        budget: form.budget ? parseFloat(form.budget) : 0,
        deadline: form.deadline || undefined,
      });
      onCreated();
      onClose();
    } catch { alert('Proje oluşturulamadı.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Yeni Proje Başlat</h2>
            <p className="text-gray-400 mt-1">Adım {step}/3</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex gap-2 mb-10">
          {[1,2,3].map(s => (
            <div key={s} className={`h-2 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-gray-100'}`} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h3 className="font-bold text-xl mb-6">Hangi hizmeti istiyorsunuz?</h3>
            <div className="grid grid-cols-2 gap-3">
              {SERVICE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setForm(f => ({ ...f, service_type: opt.label })); setStep(2); }}
                  className={`p-5 rounded-3xl border-2 text-left flex items-center gap-4 font-bold transition-all hover:border-primary hover:bg-primary/5 ${form.service_type === opt.label ? 'border-primary bg-primary/10' : 'border-gray-100'}`}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-xl mb-6">Brief bilgileri</h3>
            <div>
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Proje Başlığı</label>
              <input
                type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="örn. Yaz Kampanyası 2025"
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-medium"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Brief (Ne istiyorsunuz?)</label>
              <textarea
                rows={4} value={form.brief} onChange={e => setForm(f => ({ ...f, brief: e.target.value }))}
                placeholder="Projenizle ilgili detayları paylaşın..."
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-medium resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Bütçe (₺)</label>
                <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-medium" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Teslim Tarihi</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-medium" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-bold hover:bg-gray-50 transition-colors">Geri</button>
              <button onClick={() => setStep(3)} className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors">Devam</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-bold text-xl mb-6">Özet & Onay</h3>
            <div className="bg-gray-50 rounded-3xl p-6 space-y-4 mb-6">
              <div className="flex justify-between"><span className="text-gray-500 font-medium">Hizmet:</span><span className="font-bold">{form.service_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-medium">Başlık:</span><span className="font-bold">{form.title || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-medium">Bütçe:</span><span className="font-bold">₺{form.budget || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-medium">Teslim:</span><span className="font-bold">{form.deadline || '—'}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-bold">Geri</button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold disabled:opacity-60">
                {loading ? 'Oluşturuluyor...' : '✓ Projeyi Başlat'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Status Helpers ───────────────────────────────────────────────────
const PROJECT_STATUS: Record<string, { label: string; color: string }> = {
  onboarding: { label: 'Başlatılıyor', color: 'bg-blue-100 text-blue-700' },
  production: { label: 'Üretimde', color: 'bg-purple-100 text-purple-700' },
  review:     { label: 'İncelemede', color: 'bg-yellow-100 text-yellow-700' },
  done:       { label: 'Tamamlandı', color: 'bg-green-100 text-green-700' },
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700' },
  paid:     { label: 'Ödendi', color: 'bg-green-100 text-green-700' },
  overdue:  { label: 'Gecikmiş', color: 'bg-red-100 text-red-700' },
};

// ─── Main Dashboard ───────────────────────────────────────────────────
export default function CustomerDashboard() {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{ count: number; items: any[] }>({ count: 0, items: [] });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const msgEnd = useRef<HTMLDivElement>(null);
  const currentClientId = profile?.uid || '';

  const loadData = async () => {
    const [t, p, inv, msgs, notifs] = await Promise.all([
      api.getTasks(),
      api.getProjects(),
      api.getInvoices(),
      api.getMessages(),
      api.getNotifications(),
    ]);
    setTasks(t.filter((task: Task) => (task.clientId || (task as any).client_id) == currentClientId));
    setProjects(p);
    setInvoices(inv);
    setMessages(msgs);
    setNotifications(notifs);
  };

  useEffect(() => { loadData(); }, [currentClientId]);
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMsg = async () => {
    if (!msgInput.trim()) return;
    setMsgLoading(true);
    try { await api.sendMessage({ content: msgInput }); setMsgInput(''); await loadData(); }
    finally { setMsgLoading(false); }
  };

  const reviewTasks = tasks.filter(t => t.status === 'review');
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const activeProjects = projects.filter(p => p.status !== 'done');

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Genel Bakış' },
    { id: 'projects', icon: Folder, label: 'Projelerim', badge: activeProjects.length },
    { id: 'tasks', icon: Clock, label: 'Görevler', badge: reviewTasks.length },
    { id: 'invoices', icon: CreditCard, label: 'Faturalar', badge: pendingInvoices.length },
    { id: 'messages', icon: MessageSquare, label: 'Mesajlar', badge: notifications.count },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">T</div>
          <div>
            <span className="font-bold text-lg tracking-tight">Teras Medya</span>
            <p className="text-xs text-gray-400 font-medium">Müşteri Paneli</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold smooth-transition ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50 hover:text-secondary'}`}
            >
              <span className="flex items-center gap-3"><item.icon size={20} />{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>{item.badge}</span>
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
              <p className="font-bold text-sm truncate">{profile?.displayName || 'Müşteri'}</p>
              <p className="text-xs text-gray-400 truncate">Teras Medya Partner</p>
            </div>
          </div>
          <button onClick={() => logout?.()} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-400 hover:bg-red-50 smooth-transition">
            <LogOut size={18} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {activeTab === 'overview' && `Hoş Geldiniz, ${profile?.displayName?.split(' ')[0] || ''} 👋`}
              {activeTab === 'projects' && 'Projelerim'}
              {activeTab === 'tasks' && 'Görev Takibi'}
              {activeTab === 'invoices' && 'Finansal Yönetim'}
              {activeTab === 'messages' && 'Mesajlar'}
            </h1>
            <p className="text-gray-400 mt-1 font-medium">Teras Medya ile büyümeye devam ediyorsunuz.</p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 smooth-transition shadow-lg shadow-primary/20"
          >
            <Plus size={20} /> Yeni Proje
          </button>
        </header>

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Aktif Projeler', value: activeProjects.length, icon: Folder, color: 'bg-blue-50 text-blue-600' },
                { label: 'Onay Bekleyen', value: reviewTasks.length, icon: AlertCircle, color: 'bg-yellow-50 text-yellow-600' },
                { label: 'Tamamlananlar', value: tasks.filter(t => t.status === 'approved').length, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
                { label: 'Bekleyen Fatura', value: pendingInvoices.length, icon: CreditCard, color: 'bg-red-50 text-red-600' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                  <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center mb-4`}><stat.icon size={24} /></div>
                  <p className="text-4xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Recent Projects */}
            {projects.length > 0 && (
              <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Son Projeler</h3>
                  <button onClick={() => setActiveTab('projects')} className="text-primary font-bold text-sm flex items-center gap-1">Tümü <ChevronRight size={16} /></button>
                </div>
                <div className="space-y-4">
                  {projects.slice(0, 4).map(proj => {
                    const st = PROJECT_STATUS[proj.status] ?? { label: proj.status, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <div key={proj.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Folder size={20} /></div>
                          <div><p className="font-bold">{proj.title}</p><p className="text-sm text-gray-400">{proj.service_type || '—'}</p></div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Required */}
            {reviewTasks.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-100 rounded-[40px] p-8">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><AlertCircle className="text-yellow-500" />Onayınız Bekleniyor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviewTasks.map(task => (
                    <div key={task.id} className="bg-white rounded-3xl p-5 flex items-center justify-between">
                      <p className="font-bold">{task.title}</p>
                      <button onClick={() => setSelectedTask(task)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">İncele</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PROJECTS ─────────────────────────────────────────────── */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-20 text-center">
                <Folder size={48} className="mx-auto mb-4 text-gray-200" />
                <h3 className="text-2xl font-bold mb-2">Henüz proje yok</h3>
                <p className="text-gray-400 mb-6">İlk projenizi hemen başlatın!</p>
                <button onClick={() => setShowWizard(true)} className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90">
                  <Plus size={20} className="inline mr-2" />Yeni Proje Başlat
                </button>
              </div>
            ) : projects.map(proj => {
              const st = PROJECT_STATUS[proj.status] ?? { label: proj.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={proj.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Folder size={28} /></div>
                    <div>
                      <p className="text-xl font-bold">{proj.title}</p>
                      <p className="text-gray-400 text-sm">{proj.service_type} {proj.deadline ? `· Teslim: ${proj.deadline}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold px-4 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    <button onClick={() => setActiveTab('messages')} className="px-4 py-2 border-2 border-gray-100 rounded-xl font-bold text-sm flex items-center gap-2 hover:border-primary hover:text-primary transition-colors">
                      <MessageSquare size={16} /> Mesaj
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TASKS ────────────────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-6 text-left">Görev</th>
                  <th className="px-8 py-6 text-left">Tür</th>
                  <th className="px-8 py-6 text-left">Durum</th>
                  <th className="px-8 py-6 text-right">Eylem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map(task => {
                  const statMap: Record<string, string> = { brief: 'bg-gray-100 text-gray-600', designing: 'bg-blue-100 text-blue-600', review: 'bg-yellow-100 text-yellow-600', revision: 'bg-red-100 text-red-600', approved: 'bg-green-100 text-green-600' };
                  const labelMap: Record<string, string> = { brief: 'Sıraya Alındı', designing: 'Tasarımda', review: 'Onayınızda', revision: 'Revizyonda', approved: 'Tamamlandı' };
                  return (
                    <tr key={task.id} className="hover:bg-gray-50/50 smooth-transition">
                      <td className="px-8 py-5"><p className="font-bold">{task.title}</p><p className="text-sm text-gray-400 truncate max-w-xs">{task.description}</p></td>
                      <td className="px-8 py-5"><span className="text-xs font-black uppercase bg-gray-100 text-gray-600 px-3 py-1 rounded-md">{task.type}</span></td>
                      <td className="px-8 py-5"><span className={`text-xs font-black uppercase px-4 py-1 rounded-full ${statMap[task.status] || 'bg-gray-100 text-gray-600'}`}>{labelMap[task.status] || task.status}</span></td>
                      <td className="px-8 py-5 text-right"><button onClick={() => setSelectedTask(task)} className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary hover:bg-primary hover:text-white smooth-transition ml-auto"><Eye size={18} /></button></td>
                    </tr>
                  );
                })}
                {tasks.length === 0 && (
                  <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400"><Clock size={40} className="mx-auto mb-4 opacity-20" /><p className="font-bold">Henüz görev yok.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── INVOICES ─────────────────────────────────────────────── */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              {[
                { label: 'Toplam Borç', value: `₺${invoices.filter(i=>i.status==='pending').reduce((s:number,i:any)=>s+parseFloat(i.amount||0),0).toLocaleString('tr-TR')}`, color: 'text-red-600' },
                { label: 'Ödenen', value: `₺${invoices.filter(i=>i.status==='paid').reduce((s:number,i:any)=>s+parseFloat(i.amount||0),0).toLocaleString('tr-TR')}`, color: 'text-green-600' },
                { label: 'Fatura Sayısı', value: invoices.length.toString(), color: 'text-blue-600' },
              ].map((s,i) => (
                <div key={i} className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                  <p className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</p>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6 text-left">Fatura</th>
                    <th className="px-8 py-6 text-left">Tutar</th>
                    <th className="px-8 py-6 text-left">Vade</th>
                    <th className="px-8 py-6 text-left">Durum</th>
                    <th className="px-8 py-6 text-right">Ödeme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv: any) => {
                    const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/50">
                        <td className="px-8 py-5 font-bold">{inv.title || `Fatura #${inv.id}`}</td>
                        <td className="px-8 py-5 font-bold text-xl">₺{parseFloat(inv.amount).toLocaleString('tr-TR')}</td>
                        <td className="px-8 py-5 text-gray-500 font-medium">{inv.due_date || '—'}</td>
                        <td className="px-8 py-5"><span className={`text-xs font-black px-3 py-1 rounded-full ${st.color}`}>{st.label}</span></td>
                        <td className="px-8 py-5 text-right">
                          {inv.status === 'pending' && (
                            <button
                              onClick={async () => { await api.updateInvoice(inv.id, { status: 'paid', payment_method: 'cc' }); await loadData(); }}
                              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90"
                            >Öde</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {invoices.length === 0 && (
                    <tr><td colSpan={5} className="px-8 py-16 text-center text-gray-400"><CreditCard size={40} className="mx-auto mb-4 opacity-20" /><p className="font-bold">Fatura bulunamadı.</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MESSAGES ─────────────────────────────────────────────── */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col h-[70vh]">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white"><MessageSquare size={20} /></div>
              <div><p className="font-bold">Teras Medya Ekibi</p><p className="text-xs text-gray-400">Tasarım & Prodüksiyon</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center text-gray-300">
                    <MessageSquare size={48} className="mx-auto mb-3" />
                    <p className="font-bold">Mesaj yok. İlk siz yazın!</p>
                  </div>
                </div>
              )}
              {messages.map((msg: any) => {
                const isMe = msg.sender_id == currentClientId || msg.sender_id === currentClientId;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {(msg.sender_name || '?').charAt(0)}
                    </div>
                    <div className={`max-w-xs lg:max-w-md p-4 rounded-3xl ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-50 rounded-tl-none'}`}>
                      <p className={`text-sm font-bold mb-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>{isMe ? 'Siz' : msg.sender_name}</p>
                      <p className={`font-medium ${isMe ? 'text-white' : 'text-gray-700'}`}>{msg.content}</p>
                      {msg.attachment_url && <img src={msg.attachment_url} alt="ek" className="mt-2 rounded-xl max-h-40 object-cover" />}
                    </div>
                  </div>
                );
              })}
              <div ref={msgEnd} />
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <input
                value={msgInput} onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMsg()}
                placeholder="Mesajınızı yazın..."
                className="flex-1 px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium"
              />
              <button
                onClick={handleSendMsg} disabled={msgLoading || !msgInput.trim()}
                className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showWizard && <NewProjectWizard onClose={() => setShowWizard(false)} onCreated={loadData} />}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            currentUser={{ uid: currentClientId, displayName: profile?.displayName || 'Müşteri', role: 'client' } as any}
            users={[{ uid: 'admin', displayName: 'Teras Medya', role: 'admin' } as any]}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
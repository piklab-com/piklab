import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, CheckCircle, Clock,
  LogOut, Upload, MessageSquare,
  AlertCircle, CalendarPlus, Plus, X,
  Send, Eye, FileCheck, Users, Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, Task, Client } from '../../lib/api';
import { TaskDetailModal } from './TaskDetailModal';

type ActiveTab = 'tasks' | 'upload' | 'clients' | 'schedule';

export default function DesignerDashboard() {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Upload / Approval State
  const [selectedUploadTask, setSelectedUploadTask] = useState<Task | null>(null);
  const [assetUrl, setAssetUrl] = useState('');
  const [assetNote, setAssetNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Task Modal
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskClientId, setNewTaskClientId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState<Task['type']>('post');
  const [isCreating, setIsCreating] = useState(false);

  // Schedule
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTaskToSchedule, setSelectedTaskToSchedule] = useState<Task | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const loadData = async () => {
    setTasks(await api.getTasks());
    setClients(await api.getClients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleSubmitAsset = async () => {
    if (!selectedUploadTask?.id || !assetUrl.trim()) return;
    setIsSubmitting(true);
    try {
      await api.updateTask(selectedUploadTask.id, {
        assetUrl: assetUrl.trim(),
        status: 'review',
        managerNote: assetNote || undefined
      });
      await loadData();
      setSelectedUploadTask(null);
      setAssetUrl('');
      setAssetNote('');
      alert('İçerik müşteriye onay için gönderildi!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskClientId || !newTaskTitle.trim()) return;
    setIsCreating(true);
    try {
      await api.addTask({
        title: newTaskTitle,
        description: newTaskDesc,
        clientId: newTaskClientId,
        brandId: 'default',
        status: 'designing',
        type: newTaskType,
        managerNote: '',
      });
      await loadData();
      setShowNewTask(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskClientId('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleScheduleTask = async () => {
    if (!selectedTaskToSchedule || !scheduleDate || !scheduleTime) return;
    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      await api.updateTask(selectedTaskToSchedule.id, {
        scheduledDate: scheduledDateTime,
        status: 'approved',
      });
      await loadData();
      setShowScheduleModal(false);
      setSelectedTaskToSchedule(null);
      setScheduleDate('');
      setScheduleTime('');
    } catch (error) {
      console.error(error);
    }
  };

  const statusLabel: Record<Task['status'], string> = {
    brief: 'Brief Bekliyor',
    designing: 'Üretimde',
    review: 'Müşteri Onayında',
    revision: 'Revizyon',
    approved: 'Tamamlandı'
  };

  const statusColor: Record<Task['status'], string> = {
    brief: 'bg-gray-100 text-gray-600',
    designing: 'bg-blue-100 text-blue-600',
    review: 'bg-yellow-100 text-yellow-600',
    revision: 'bg-red-100 text-red-600',
    approved: 'bg-green-100 text-green-600'
  };

  const reviewTasks = tasks.filter(t => t.status === 'review');
  const revisionTasks = tasks.filter(t => t.status === 'revision');
  const activeTasks = tasks.filter(t => !['approved'].includes(t.status));

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">P</div>
          <div>
            <span className="font-bold text-lg tracking-tight">Piklab</span>
            <p className="text-xs text-gray-400 font-medium">Yönetici Paneli</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'tasks', icon: LayoutDashboard, label: 'Tüm Görevler', badge: activeTasks.length },
            { id: 'upload', icon: Upload, label: 'İçerik Yükle & Gönder', badge: revisionTasks.length },
            { id: 'clients', icon: Users, label: 'Müşteriler', badge: clients.length },
            { id: 'schedule', icon: CalendarPlus, label: 'Yayın Takvimi', badge: 0 },
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
              {item.badge > 0 && (
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
              <p className="font-bold text-sm truncate">{profile?.displayName || 'Yönetici'}</p>
              <p className="text-xs text-gray-400 truncate">Piklab Ekibi</p>
            </div>
          </div>
          <button onClick={() => logout?.()} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-400 hover:bg-red-50 smooth-transition">
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {activeTab === 'tasks' && 'Görev Yönetimi'}
              {activeTab === 'upload' && 'İçerik Yükle & Onayla'}
              {activeTab === 'clients' && 'Müşteriler'}
              {activeTab === 'schedule' && 'Yayın Takvimi'}
            </h1>
            <p className="text-gray-400 mt-1 font-medium">
              {activeTab === 'tasks' && `${activeTasks.length} aktif görev • ${reviewTasks.length} onay bekliyor`}
              {activeTab === 'upload' && 'Hazır içerikleri müşteriye gönderin'}
              {activeTab === 'clients' && `${clients.length} kayıtlı müşteri`}
              {activeTab === 'schedule' && 'Onaylanan içerikleri zamanla yayınla'}
            </p>
          </div>
          <button
            onClick={() => setShowNewTask(true)}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/90 smooth-transition shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            Yeni Görev
          </button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Toplam Aktif', value: activeTasks.length, color: 'bg-blue-50 text-blue-600', icon: Clock },
            { label: 'Onay Bekleyen', value: reviewTasks.length, color: 'bg-yellow-50 text-yellow-600', icon: Eye },
            { label: 'Revizyon', value: revisionTasks.length, color: 'bg-red-50 text-red-500', icon: AlertCircle },
            { label: 'Tamamlanan', value: tasks.filter(t => t.status === 'approved').length, color: 'bg-green-50 text-green-600', icon: CheckCircle },
          ].map(s => (
            <div key={s.label} className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-2xl ${s.color} flex items-center justify-center mb-4`}>
                <s.icon size={20} />
              </div>
              <p className="text-3xl font-bold mb-1">{s.value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Görev</th>
                    <th className="px-6 py-4 text-left">Müşteri</th>
                    <th className="px-6 py-4 text-left">Tür</th>
                    <th className="px-6 py-4 text-left">Durum</th>
                    <th className="px-6 py-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50/50 smooth-transition">
                      <td className="px-6 py-4">
                        <p className="font-bold">{task.title}</p>
                        <p className="text-sm text-gray-400 truncate max-w-[240px]">{task.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700">
                          {clients.find(c => c.id === task.clientId)?.displayName || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{task.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor[task.status]}`}>
                          {statusLabel[task.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-3">
                        <button onClick={() => setSelectedTask(task)} className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
                          <Eye size={14} /> Detay
                        </button>
                        {task.status === 'designing' && (
                          <button
                            onClick={() => { setSelectedUploadTask(task); setActiveTab('upload'); }}
                            className="text-white bg-primary font-bold text-sm px-3 py-1 rounded-xl flex items-center gap-1 hover:bg-primary/90"
                          >
                            <Upload size={14} /> Yükle
                          </button>
                        )}
                        {task.status === 'approved' && (
                          <button
                            onClick={() => { setSelectedTaskToSchedule(task); setShowScheduleModal(true); }}
                            className="text-secondary font-bold text-sm hover:underline flex items-center gap-1"
                          >
                            <CalendarPlus size={14} /> Planla
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Henüz görev yok.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="space-y-8 max-w-4xl">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6">İçerik Yüklenecek Görev Seç</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTasks.filter(t => t.status === 'designing' || t.status === 'revision').map(task => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedUploadTask(selectedUploadTask?.id === task.id ? null : task)}
                    className={`text-left p-5 rounded-2xl border-2 smooth-transition ${selectedUploadTask?.id === task.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor[task.status]}`}>{statusLabel[task.status]}</span>
                      {selectedUploadTask?.id === task.id && <CheckCircle size={18} className="text-primary" />}
                    </div>
                    <p className="font-bold">{task.title}</p>
                    <p className="text-sm text-gray-400 truncate">{clients.find(c => c.id === task.clientId)?.displayName || '—'}</p>
                  </button>
                ))}
                {activeTasks.filter(t => ['designing', 'revision'].includes(t.status)).length === 0 && (
                  <p className="col-span-2 text-center text-gray-400 py-8">Yüklenmeye hazır görev bulunmuyor.</p>
                )}
              </div>
            </div>

            {selectedUploadTask && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedUploadTask.title}</h3>
                    <p className="text-sm text-gray-400">
                      {clients.find(c => c.id === selectedUploadTask.clientId)?.displayName}
                      {' • '}
                      {statusLabel[selectedUploadTask.status]}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <LinkIcon size={14} /> İçerik URL (Google Drive, Dropbox, Vimeo, vs.)
                    </label>
                    <input
                      type="url"
                      value={assetUrl}
                      onChange={e => setAssetUrl(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://drive.google.com/... veya https://vimeo.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <MessageSquare size={14} /> Müşteriye Not (İsteğe Bağlı)
                    </label>
                    <textarea
                      value={assetNote}
                      onChange={e => setAssetNote(e.target.value)}
                      rows={3}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Müşteriye özel notunuzu buraya yazın..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedUploadTask(null)}
                      className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold hover:bg-gray-50 smooth-transition"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleSubmitAsset}
                      disabled={!assetUrl.trim() || isSubmitting}
                      className="flex-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 smooth-transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gönderiliyor...</>
                      ) : (
                        <><Send size={20} /> Müşteriye Gönder & Onay İste</>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {revisionTasks.length > 0 && (
              <div className="bg-red-50 rounded-[32px] p-8 border border-red-100">
                <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                  <AlertCircle size={20} /> Revizyon İstekleri ({revisionTasks.length})
                </h3>
                <div className="space-y-3">
                  {revisionTasks.map(t => (
                    <div key={t.id} className="bg-white rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold">{t.title}</p>
                        <p className="text-sm text-gray-400">{clients.find(c => c.id === t.clientId)?.displayName}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedUploadTask(t); setAssetUrl(t.assetUrl || ''); }}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 smooth-transition flex items-center gap-1"
                      >
                        <Upload size={14} /> Yeniden Yükle
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLIENTS TAB */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => {
              const clientTasks = tasks.filter(t => t.clientId === client.id);
              const pendingCount = clientTasks.filter(t => t.status === 'review').length;
              return (
                <div key={client.id} className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                      {client.displayName?.[0] || 'M'}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{client.displayName}</p>
                      <p className="text-sm text-gray-400">{client.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Toplam İş</p>
                      <p className="text-xl font-bold">{clientTasks.length}</p>
                    </div>
                    <div className={`rounded-xl p-3 ${pendingCount > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-bold uppercase mb-1 ${pendingCount > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>Onay Bekleyen</p>
                      <p className={`text-xl font-bold ${pendingCount > 0 ? 'text-yellow-600' : ''}`}>{pendingCount}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {clients.length === 0 && (
              <p className="col-span-3 text-center text-gray-400 py-12">Henüz müşteri yok.</p>
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6">Yayına Hazır İçerikler</h3>
              {tasks.filter(t => t.status === 'approved' && !t.scheduledDate).length === 0 ? (
                <p className="text-center text-gray-400 py-8">Henüz planlanmamış onaylanmış içerik yok.</p>
              ) : (
                <div className="space-y-4">
                  {tasks.filter(t => t.status === 'approved' && !t.scheduledDate).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                      <div>
                        <p className="font-bold">{task.title}</p>
                        <p className="text-sm text-gray-500">{clients.find(c => c.id === task.clientId)?.displayName} • {task.type}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedTaskToSchedule(task); setShowScheduleModal(true); }}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 smooth-transition flex items-center gap-2"
                      >
                        <CalendarPlus size={16} /> Tarih Ata
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {tasks.filter(t => t.scheduledDate).length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6">Planlananlar</h3>
                <div className="space-y-4">
                  {tasks.filter(t => t.scheduledDate).sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="text-center bg-primary/10 rounded-xl p-3 min-w-[60px]">
                          <p className="text-xs font-bold text-primary">{new Date(task.scheduledDate!).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</p>
                          <p className="text-xs text-gray-500">{new Date(task.scheduledDate!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div>
                          <p className="font-bold">{task.title}</p>
                          <p className="text-sm text-gray-400">{clients.find(c => c.id === task.clientId)?.displayName}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase">{task.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals remain mostly the same but use localData */}
      <AnimatePresence>
        {showScheduleModal && selectedTaskToSchedule && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-secondary/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Yayın Tarihi</h2>
                <button onClick={() => setShowScheduleModal(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <XIcon size={20} />
                </button>
              </div>
              <p className="font-bold text-lg mb-1">{selectedTaskToSchedule.title}</p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tarih</label>
                  <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Saat</label>
                  <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <button onClick={handleScheduleTask} disabled={!scheduleDate || !scheduleTime}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 smooth-transition flex items-center justify-center gap-2">
                <CalendarPlus size={20} /> Yayını Planla
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-secondary/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Yeni Görev Oluştur</h2>
                <button onClick={() => setShowNewTask(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <XIcon size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Müşteri Seç</label>
                  <select value={newTaskClientId} onChange={e => setNewTaskClientId(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary">
                    <option value="">— Müşteri seçin —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Görev Başlığı</label>
                  <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: Nisan Ayı Instagram Postları" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Açıklama</label>
                  <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} rows={3}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Görev detayları..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">İçerik Türü</label>
                  <select value={newTaskType} onChange={e => setNewTaskType(e.target.value as Task['type'])}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary">
                    <option value="post">Post</option>
                    <option value="story">Story</option>
                    <option value="reels">Reels</option>
                    <option value="banner">Banner</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-2">
                  <button onClick={() => setShowNewTask(false)}
                    className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold hover:bg-gray-50 smooth-transition">
                    İptal
                  </button>
                  <button onClick={handleCreateTask} disabled={!newTaskClientId || !newTaskTitle.trim() || isCreating}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 smooth-transition flex items-center justify-center gap-2">
                    {isCreating ? 'Oluşturuluyor...' : <><FileCheck size={20} /> Oluştur</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            currentUser={{ uid: 'admin', displayName: 'Yönetici', role: 'admin' } as any}
            users={clients.map(c => ({ uid: c.id, displayName: c.displayName, role: 'client' }) as any)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const XIcon = ({ size, ...props }: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

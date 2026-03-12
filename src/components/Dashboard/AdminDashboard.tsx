import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  LayoutDashboard, Users, FileText, 
  Settings, LogOut, Plus, Search,
  CheckCircle, Clock, AlertCircle,
  MoreHorizontal, ChevronRight, BarChart3, MessageSquare, Video,
  Volume2, Calendar as CalendarIcon, Sparkles
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType, logout } from '../../firebase';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, where } from 'firebase/firestore';
import { Task, UserProfile, Brand } from '../../types';
import { TaskDetailModal } from './TaskDetailModal';
import { generateVideoFromText, generateMultiSpeakerSpeech, generatePostingSchedule } from '../../services/aiService';
import { SmartCalendar } from './SmartCalendar';
import { LiveAssistant } from './LiveAssistant';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { Save } from 'lucide-react';

const COLUMNS = [
  { id: 'brief', title: 'Brief Bekliyor' },
  { id: 'designing', title: 'Tasarımda' },
  { id: 'review', title: 'Müşteri Onayında' },
  { id: 'revision', title: 'Revizyon' },
  { id: 'approved', title: 'Tamamlandı' }
];

const AdminDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'clients' | 'video' | 'tts' | 'calendar' | 'assistant' | 'settings' | 'cms'>('overview');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  // TTS State
  const [ttsText, setTtsText] = useState('');
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [generatedTtsUrl, setGeneratedTtsUrl] = useState<string | null>(null);

  // CMS State
  const { settings, updateSettings } = useSiteSettings();
  const [cmsForm, setCmsForm] = useState<any>(settings || {});
  const [isSavingCms, setIsSavingCms] = useState(false);

  useEffect(() => {
    if (settings) {
      setCmsForm(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribeUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setCurrentUser({ uid: doc.id, ...doc.data() } as UserProfile);
      }
    });

    // Fetch Tasks
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });

    // Fetch Clients (and Designers for the modal)
    const unsubscribeAllUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setClients(users.filter(u => u.role === 'client'));
    });

    // Fetch Brands
    const unsubscribeBrands = onSnapshot(collection(db, 'brands'), (snapshot) => {
      setBrands(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand)));
    });

    return () => {
      unsubscribeUser();
      unsubscribeTasks();
      unsubscribeAllUsers();
      unsubscribeBrands();
    };
  }, []);

  const handleAssignDesigner = async (taskId: string, designerId: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { 
        designerId,
        status: 'designing'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as Task['status'];
    const task = tasks.find(t => t.id === draggableId);
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

    try {
      const updates: Partial<Task> = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      if (newStatus === 'approved' && task && !task.caption) {
        try {
          const { getDoc } = await import('firebase/firestore');
          const brandDoc = await getDoc(doc(db, 'brands', task.brandId));
          if (brandDoc.exists()) {
            const brandData = brandDoc.data() as any;
            const { generateSocialContent } = await import('../../services/aiService');
            const socialContent = await generateSocialContent(task, brandData);
            if (socialContent) {
              updates.caption = socialContent.caption;
              updates.hashtags = socialContent.hashtags;
            }
          }
        } catch (aiError) {
          console.error('Failed to generate social content:', aiError);
        }
      }

      await updateDoc(doc(db, 'tasks', draggableId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${draggableId}`);
      // Revert on error (simple reload)
      window.location.reload();
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);
    try {
      const url = await generateVideoFromText(videoPrompt);
      setGeneratedVideoUrl(url);
    } catch (error) {
      console.error('Video generation failed:', error);
      alert('Video üretilirken bir hata oluştu.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerateTts = async () => {
    if (!ttsText.trim()) return;
    setIsGeneratingTts(true);
    setGeneratedTtsUrl(null);
    try {
      const url = await generateMultiSpeakerSpeech(ttsText);
      setGeneratedTtsUrl(url);
    } catch (error) {
      console.error('TTS generation failed:', error);
      alert('Seslendirme üretilirken bir hata oluştu.');
    } finally {
      setIsGeneratingTts(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleSaveCms = async () => {
    setIsSavingCms(true);
    try {
      await updateSettings(cmsForm);
      alert('Site ayarları başarıyla kaydedildi!');
    } catch (error) {
      alert('Kaydedilirken hata oluştu.');
    } finally {
      setIsSavingCms(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">P</div>
          <span className="text-2xl font-bold tracking-tighter">PIKLAB ADMIN</span>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            icon={LayoutDashboard} 
            label="Genel Bakış" 
          />
          <SidebarItem 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')} 
            icon={FileText} 
            label="İş Yönetimi" 
          />
          <SidebarItem 
            active={activeTab === 'clients'} 
            onClick={() => setActiveTab('clients')} 
            icon={Users} 
            label="Müşteriler" 
          />
          <SidebarItem 
            active={activeTab === 'video'} 
            onClick={() => setActiveTab('video')} 
            icon={Video} 
            label="Video Üretici (Veo)" 
          />
          <SidebarItem 
            active={activeTab === 'tts'} 
            onClick={() => setActiveTab('tts')} 
            icon={Volume2} 
            label="Seslendirme (TTS)" 
          />
          <SidebarItem 
            active={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
            icon={CalendarIcon} 
            label="İçerik Takvimi" 
          />
          <SidebarItem 
            active={activeTab === 'assistant'} 
            onClick={() => setActiveTab('assistant')} 
            icon={Sparkles} 
            label="Canlı Asistan" 
          />
          <SidebarItem 
            active={activeTab === 'cms'} 
            onClick={() => setActiveTab('cms')} 
            icon={Settings} 
            label="Site Ayarları (CMS)" 
          />
          <SidebarItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={Settings} 
            label="Sistem Ayarları" 
          />
        </nav>

        <div className="mt-auto">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 smooth-transition"
          >
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="İş veya müşteri ara..." 
                className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary smooth-transition w-64"
              />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">A</div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <StatCard label="Aktif İşler" value={tasks.filter(t => t.status !== 'approved').length} icon={Clock} color="blue" />
              <StatCard label="Onay Bekleyen" value={tasks.filter(t => t.status === 'review').length} icon={AlertCircle} color="yellow" />
              <StatCard label="Tamamlanan" value={tasks.filter(t => t.status === 'approved').length} icon={CheckCircle} color="green" />
              <StatCard label="Toplam Müşteri" value={clients.length} icon={Users} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-6">Son Talepler</h3>
                <div className="space-y-4">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-accent rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary font-bold">
                          {task.type[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold">{task.title}</p>
                          <p className="text-xs text-gray-400">{task.status}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-6">Müşteri Memnuniyeti</h3>
                <div className="flex items-center justify-center h-48">
                   <div className="text-center">
                     <p className="text-6xl font-bold text-primary">98%</p>
                     <p className="text-gray-400 mt-2">NPS Skoru</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => {
              const clientBrand = brands.find(b => b.ownerId === client.uid);
              const clientTasks = tasks.filter(t => t.clientId === client.uid);
              return (
                <div key={client.uid} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-primary font-bold text-2xl">
                      {client.displayName?.[0] || 'C'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{client.displayName}</h3>
                      <p className="text-sm text-gray-400">{client.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-accent p-4 rounded-2xl">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">İşler</p>
                      <p className="text-xl font-bold">{clientTasks.length}</p>
                    </div>
                    <div className="bg-accent p-4 rounded-2xl">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Marka</p>
                      <p className="text-sm font-bold truncate">{clientBrand?.name || 'Ayarlanmadı'}</p>
                    </div>
                  </div>

                  <button className="w-full py-4 rounded-2xl border border-gray-100 font-bold hover:bg-accent smooth-transition">
                    Detayları Görüntüle
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="h-full flex flex-col">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 overflow-x-auto pb-4 h-full">
                {COLUMNS.map(column => {
                  const columnTasks = tasks.filter(t => t.status === column.id);
                  return (
                    <div key={column.id} className="flex-shrink-0 w-80 bg-gray-100/50 rounded-[32px] p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold text-gray-700">{column.title}</h3>
                        <span className="bg-white text-gray-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                          {columnTasks.length}
                        </span>
                      </div>
                      
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps}
                            className={`flex-1 min-h-[200px] rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200/50' : ''}`}
                          >
                            {columnTasks.map((task, index) => (
                              // @ts-ignore
                              <Draggable key={task.id} draggableId={task.id!} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedTask(task)}
                                    className={`bg-white p-5 rounded-2xl mb-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all ${snapshot.isDragging ? 'shadow-xl scale-105 rotate-2' : ''}`}
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                                        {task.type}
                                      </span>
                                      <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal size={16} /></button>
                                    </div>
                                    <h4 className="font-bold mb-1">{task.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{task.description}</p>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-secondary">
                                          {clients.find(c => c.uid === task.clientId)?.displayName?.[0] || 'C'}
                                        </div>
                                        <span className="text-xs font-medium text-gray-500 truncate max-w-[80px]">
                                          {clients.find(c => c.uid === task.clientId)?.displayName || 'Müşteri'}
                                        </span>
                                      </div>
                                      
                                      {task.designerId ? (
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white" title="Tasarımcı Atandı">
                                          D
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleAssignDesigner(task.id!, 'designer-1'); }}
                                          className="text-[10px] font-bold text-primary hover:underline"
                                        >
                                          Ata
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Video size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Veo Video Üretici</h2>
                <p className="text-gray-500">Metin açıklamalarından yüksek kaliteli tanıtım videoları oluşturun.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Video Senaryosu / Açıklaması</label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Örn: Neon ışıklı bir şehirde hızla ilerleyen fütüristik bir araba, sinematik çekim, 4k çözünürlük..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <button
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || !videoPrompt.trim()}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition flex items-center justify-center gap-2"
              >
                {isGeneratingVideo ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Video Üretiliyor (Bu işlem birkaç dakika sürebilir)...
                  </>
                ) : (
                  <>
                    <Video size={20} />
                    Video Oluştur
                  </>
                )}
              </button>

              {generatedVideoUrl && (
                <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <h3 className="font-bold mb-4">Üretilen Video</h3>
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                      <Video size={48} className="mb-4 opacity-50" />
                      <p className="mb-4">Video başarıyla üretildi.</p>
                      <a 
                        href={generatedVideoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 smooth-transition"
                      >
                        Videoyu İndir / Görüntüle
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tts' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Volume2 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Marka Sesi & TTS</h2>
                <p className="text-gray-500">Profesyonel seslendirmeler ve diyaloglar oluşturun.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Seslendirme Metni</label>
                <p className="text-xs text-gray-400 mb-2">İpucu: Diyalog oluşturmak için "Joe: Merhaba, Jane: Selam" formatını kullanabilirsiniz.</p>
                <textarea
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Seslendirilmesini istediğiniz metni buraya yazın..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <button
                onClick={handleGenerateTts}
                disabled={isGeneratingTts || !ttsText.trim()}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition flex items-center justify-center gap-2"
              >
                {isGeneratingTts ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ses Üretiliyor...
                  </>
                ) : (
                  <>
                    <Volume2 size={20} />
                    Seslendirme Oluştur
                  </>
                )}
              </button>

              {generatedTtsUrl && (
                <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <h3 className="font-bold mb-4">Üretilen Ses</h3>
                  <audio src={generatedTtsUrl} controls className="w-full" />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <SmartCalendar 
            tasks={tasks} 
            brand={brands[0] || {}} 
            onUpdateTask={handleUpdateTask} 
          />
        )}

        {activeTab === 'assistant' && (
          <LiveAssistant />
        )}

        {activeTab === 'cms' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">İçerik Yönetim Sistemi (CMS)</h2>
                  <p className="text-gray-500">Sitenizin ana sayfa metinlerini ve global ayarlarını buradan düzenleyin.</p>
                </div>
                <button 
                  onClick={handleSaveCms}
                  disabled={isSavingCms}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 smooth-transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={20} />
                  {isSavingCms ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-4 text-primary">Ana Sayfa Hero Alanı</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Ana Başlık</label>
                      <input 
                        type="text" 
                        value={cmsForm.heroTitle || ''}
                        onChange={(e) => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Örn: YENİ NESİL REKLAMCILIK AJANSI"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Alt Başlık (Slogan)</label>
                      <input 
                        type="text" 
                        value={cmsForm.heroSubtitle || ''}
                        onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Örn: EN İYİLER İÇİN EN İYİSİ."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Açıklama Metni</label>
                      <textarea 
                        value={cmsForm.heroDescription || ''}
                        onChange={(e) => setCmsForm({ ...cmsForm, heroDescription: e.target.value })}
                        rows={3}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Örn: Yeni nesil reklamcılık için çıktığımız bu yolda..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        <AnimatePresence>
          {selectedTask && currentUser && (
            <TaskDetailModal 
              task={selectedTask as any}
              onClose={() => setSelectedTask(null)}
              currentUser={currentUser}
              users={clients} // In a real app, pass all users including designers
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl font-bold smooth-transition ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-accent hover:text-secondary'}`}
  >
    <Icon size={20} />
    {label}
  </button>
);

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-6`}>
        <Icon size={24} />
      </div>
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
};

export default AdminDashboard;


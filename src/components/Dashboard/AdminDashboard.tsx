import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  LayoutDashboard, Users, FileText, 
  Settings, LogOut, Plus, Search,
  CheckCircle, Clock, AlertCircle,
  MoreHorizontal, ChevronRight, BarChart3, MessageSquare,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Task, UserProfile, Brand } from '../../types';
import { TaskDetailModal } from './TaskDetailModal';
import { SmartCalendar } from './SmartCalendar';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'clients' | 'calendar' | 'settings' | 'cms'>('overview');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { profile: currentUser, logout } = useAuth();
  
  // CMS State
  const { settings } = useSiteSettings();
  const [cmsForm, setCmsForm] = useState<any>(settings || {});
  const [isSavingCms, setIsSavingCms] = useState(false);

  useEffect(() => {
    if (settings) {
      setCmsForm(settings);
    }
  }, [settings]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, clientsData, brandsData] = await Promise.all([
          api.getTasks(),
          api.getClients(),
          api.getBrands()
        ]);
        setTasks(tasksData);
        setClients(clientsData as any);
        setBrands(brandsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignDesigner = async (taskId: string, designerId: string) => {
    try {
      await api.updateTask(taskId, { 
        designerId,
        status: 'designing'
      });
    } catch (error) {
      console.error('Update task error:', error);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as Task['status'];
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

    try {
      await api.updateTask(draggableId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update task status error:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      await api.updateTask(taskId, updates);
    } catch (error) {
      console.error('Update task error:', error);
    }
  };

  const handleSaveCms = async () => {
    setIsSavingCms(true);
    try {
      await api.saveSettings(cmsForm);
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
            active={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
            icon={CalendarIcon} 
            label="Takvim" 
          />
          <SidebarItem 
            active={activeTab === 'cms'} 
            onClick={() => setActiveTab('cms')} 
            icon={Settings} 
            label="İçerik Yönetimi" 
          />
        </nav>

        <div className="mt-auto">
          <button 
            onClick={logout}
            className="flex items-center gap-4 p-4 w-full rounded-2xl font-bold text-gray-400 hover:bg-red-50 hover:text-red-600 smooth-transition"
          >
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Hoş Geldin, Admin</h1>
            <p className="text-gray-500">İşte bugün Piklab'da olanlar.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="İş veya müşteri ara..." 
                className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 w-80 shadow-sm"
              />
            </div>
            <button className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-primary smooth-transition">
              <Settings size={24} />
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-4 gap-8 mb-12">
              <StatCard label="Aktif İşler" value={tasks.filter(t => t.status !== 'approved').length} icon={Clock} color="blue" />
              <StatCard label="Onay Bekleyenler" value={tasks.filter(t => t.status === 'review').length} icon={AlertCircle} color="yellow" />
              <StatCard label="Tamamlanan" value={tasks.filter(t => t.status === 'approved').length} icon={CheckCircle} color="green" />
              <StatCard label="Toplam Müşteri" value={clients.length} icon={Users} color="purple" />
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold">Son Aktiviteler</h3>
                  <button className="text-primary font-bold text-sm">Tümünü Gör</button>
                </div>
                <div className="space-y-6">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group" onClick={() => setSelectedTask(task)}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="font-bold">{task.title}</p>
                          <p className="text-sm text-gray-400 font-medium">{clients.find(c => c.uid === task.clientId)?.displayName || 'Müşteri'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-bold capitalize">{task.status}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{task.type}</p>
                        </div>
                        <ChevronRight className="text-gray-300" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-8">Performans Özeti</h3>
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <BarChart3 size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Haftalık Artış</p>
                      <p className="text-xl font-bold">+24%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Müşteri Memnuniyeti</p>
                      <p className="text-xl font-bold">4.9/5</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 min-h-[600px]">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 h-full overflow-x-auto pb-4">
                {COLUMNS.map(column => {
                  const columnTasks = tasks.filter(t => t.status === column.id);
                  return (
                    <div key={column.id} className="flex-shrink-0 w-80 bg-gray-50/50 rounded-3xl p-4">
                      <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-700">{column.title}</h3>
                          <span className="bg-white text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                            {columnTasks.length}
                          </span>
                        </div>
                        <button className="text-gray-300 hover:text-primary transition-colors"><Plus size={18} /></button>
                      </div>

                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef}
                            className={`min-h-[500px] transition-colors rounded-2xl ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                          >
                            {columnTasks.map((task, index) => (
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

        {activeTab === 'calendar' && (
          <SmartCalendar 
            tasks={tasks} 
            brand={brands[0] || {} as any} 
            onUpdateTask={handleUpdateTask} 
          />
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

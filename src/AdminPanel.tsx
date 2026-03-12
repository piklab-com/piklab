import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, Globe, FileText, ImageIcon, 
  Tag, Package, Users, LogOut, Plus, 
  Trash2, Save, Edit2, CheckCircle, 
  TrendingUp, Activity, Search
} from 'lucide-react';
import { 
  api, SiteSettings, PortfolioItem, Brand, Service, Package as Pkg 
} from './lib/api';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState(localStorage.getItem('piklab_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Offline / Standalone mode: simpler login
    // In a real standalone, this would call /api/auth/login
    if (username === 'admin' && password === 'admin123') {
      const t = 'fake-jwt-token';
      localStorage.setItem('piklab_token', t);
      setToken(t);
    } else {
      setError('Hatalı kullanıcı adı veya şifre');
    }
  };

  const showSavedFeedback = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!token) return <LoginScreen username={username} setUsername={setUsername} password={password} setPassword={setPassword} error={error} onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">P</div>
          <div>
            <span className="font-bold text-lg tracking-tight">Piklab</span>
            <p className="text-xs text-gray-400">Admin Paneli</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Genel Bakış' },
            { id: 'settings', icon: Globe, label: 'Site Ayarları' },
            { id: 'services', icon: FileText, label: 'Hizmetler' },
            { id: 'portfolio', icon: ImageIcon, label: 'Portfolyo' },
            { id: 'brands', icon: Tag, label: 'Referans Markalar' },
            { id: 'packages', icon: Package, label: 'Paketler' },
            { id: 'users', icon: Users, label: 'Ayarlar' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold smooth-transition ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50 hover:text-secondary'}`}>
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => { localStorage.removeItem('piklab_token'); setToken(null); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-400 hover:bg-red-50 smooth-transition">
            <LogOut size={18} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {saved && (
          <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle size={20} /> Kaydedildi!
          </div>
        )}

        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'settings' && <SettingsTab onSave={showSavedFeedback} />}
        {activeTab === 'services' && <ServicesTab onSave={showSavedFeedback} />}
        {activeTab === 'portfolio' && <PortfolioTab onSave={showSavedFeedback} />}
        {activeTab === 'brands' && <BrandsTab onSave={showSavedFeedback} />}
        {activeTab === 'packages' && <PackagesTab onSave={showSavedFeedback} />}
        {activeTab === 'users' && <UsersTab />}
      </main>
    </div>
  );
};

// ─── Login Screen ──────────────────────────────────────────────────────

const LoginScreen = ({ username, setUsername, password, setPassword, error, onLogin }: any) => (
  <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-md">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-3xl mb-4">P</div>
        <h1 className="text-3xl font-bold">Piklab Admin</h1>
        <p className="text-gray-400 mt-2">Yönetim paneline giriş yapın</p>
      </div>
      <form className="space-y-5" onSubmit={onLogin}>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Kullanıcı Adı</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-primary"
            placeholder="admin" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Şifre</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••" />
        </div>
        {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
        <button className="w-full py-5 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 smooth-transition shadow-lg shadow-primary/20">
          Giriş Yap
        </button>
        <p className="text-center text-xs text-gray-400">Varsayılan: admin / admin123</p>
      </form>
    </motion.div>
  </div>
);

// ─── Dashboard Tab ─────────────────────────────────────────────────────

const DashboardTab = () => {
  const [stats, setStats] = useState([
    { label: 'Hizmet', value: 0, icon: FileText, color: 'bg-blue-50 text-blue-600' },
    { label: 'Portfolyo', value: 0, icon: ImageIcon, color: 'bg-purple-50 text-purple-600' },
    { label: 'Marka', value: 0, icon: Tag, color: 'bg-green-50 text-green-600' },
    { label: 'Paket', value: 0, icon: Package, color: 'bg-orange-50 text-orange-600' },
  ]);

  useEffect(() => {
    Promise.all([api.getServices(), api.getPortfolio(), api.getBrands(), api.getPackages()]).then(([s, p, b, pkg]) => {
      setStats([
        { label: 'Hizmet', value: s.length, icon: FileText, color: 'bg-blue-50 text-blue-600' },
        { label: 'Portfolyo', value: p.length, icon: ImageIcon, color: 'bg-purple-50 text-purple-600' },
        { label: 'Marka', value: b.length, icon: Tag, color: 'bg-green-50 text-green-600' },
        { label: 'Paket', value: pkg.length, icon: Package, color: 'bg-orange-50 text-orange-600' },
      ]);
    });
  }, []);
  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Genel Bakış</h1>
      <p className="text-gray-400 mb-10">Sitenizin içerik özeti</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white p-8 rounded-[28px] shadow-sm border border-gray-100">
            <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center mb-4`}>
              <s.icon size={24} />
            </div>
            <p className="text-4xl font-bold mb-1">{s.value}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 bg-white rounded-[28px] p-8 border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Hızlı Erişim</h2>
        <p className="text-gray-500 text-sm">Sol menüden düzenlemek istediğiniz bölümü seçin. Tüm değişiklikler tarayıcınızda saklanır ve anında sitenize yansır.</p>
      </div>
    </div>
  );
};

// ─── Site Settings Tab ─────────────────────────────────────────────────

const SettingsTab = ({ onSave }: { onSave: () => void }) => {
  const [form, setForm] = useState<SiteSettings | null>(null);
  useEffect(() => { api.getSettings().then(setForm); }, []);
  const set = (k: keyof SiteSettings, v: string) => setForm(f => f ? ({ ...f, [k]: v }) : null);

  const save = async () => { if(form) { await api.saveSettings(form); onSave(); } };

  if (!form) return <div className="p-10 text-center text-gray-400">Yükleniyor...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div><h1 className="text-4xl font-bold">Site Ayarları</h1><p className="text-gray-400">Genel bilgiler ve iletişim detayları</p></div>
        <button onClick={save} className="bg-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/90 smooth-transition"><Save size={18} /> Kaydet</button>
      </div>
      <Card title="Görsel Ayarlar">
        <div className="grid grid-cols-2 gap-6">
          <Field label="Logo URL" value={form.logoUrl} onChange={v => set('logoUrl', v)} placeholder="https://..." />
          <div className="text-xs text-gray-400 p-4">Site logosu burada düzenlenir.</div>
        </div>
      </Card>
      <Card title="Metin İçerikleri">
        <Field label="Hero Başlığı" value={form.heroTitle} onChange={v => set('heroTitle', v)} />
        <Field label="Hero Alt Metni" value={form.heroSubtitle} onChange={v => set('heroSubtitle', v)} multiline />
      </Card>
      <Card title="İletişim Bilgileri">
        <div className="grid grid-cols-2 gap-6">
          <Field label="E-mail" value={form.contactEmail} onChange={v => set('contactEmail', v)} />
          <Field label="Telefon" value={form.contactPhone} onChange={v => set('contactPhone', v)} />
          <div className="col-span-2">
            <Field label="Adres" value={form.address} onChange={v => set('address', v)} multiline />
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── Services Tab ──────────────────────────────────────────────────────

const ServicesTab = ({ onSave }: { onSave: () => void }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', icon: '⭐', features: '' });

  const refresh = async () => setServices(await api.getServices());
  useEffect(() => { refresh(); }, []);

  const save = async (service: Service) => {
    await api.updateService(service.slug || service.id.toString(), service);
    setEditing(null);
    await refresh();
    onSave();
  };

  const add = async () => {
    if (!form.title.trim()) return;
    await api.addService({ 
      ...form, 
      slug: form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 
      features: form.features.split('\n').filter(Boolean),
      content: ''
    });
    setForm({ title: '', description: '', icon: '⭐', features: '' });
    setShowAdd(false);
    await refresh();
    onSave();
  };

  const del = async (id: string | number, slug?: string) => {
    if (window.confirm('Bu hizmeti silmek istediğinize emin misiniz?')) {
      await api.deleteService(slug || id.toString());
      await refresh();
      onSave();
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-4xl font-bold mb-1">Hizmetler</h1><p className="text-gray-400">{services.length} aktif hizmet</p></div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 smooth-transition flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} /> Yeni Hizmet
        </button>
      </div>

      {showAdd && (
        <Card title="Yeni Hizmet Ekle">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Başlık" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Hizmet Adı" />
            <Field label="İkon (emoji)" value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} placeholder="🎬" />
          </div>
          <Field label="Açıklama" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline placeholder="Kısa açıklama..." />
          <Field label="Özellikler (her satıra bir özellik)" value={form.features} onChange={v => setForm(f => ({ ...f, features: v }))} multiline placeholder="Özellik 1&#10;Özellik 2" />
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">İptal</button>
            <button onClick={add} className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">Ekle</button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map(service => (
          editing?.id === service.id ? (
            <ServiceEditCard key={service.id} service={editing} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} />
          ) : (
            <div key={service.id} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="text-3xl">{service.icon}</span>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(service)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl smooth-transition"><Edit2 size={16} /></button>
                  <button onClick={() => del(service.id, service.slug)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl smooth-transition"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1">{service.title}</h3>
              <p className="text-gray-500 text-sm mb-3">{service.description}</p>
              <div className="flex flex-wrap gap-1">
                {service.features.map((f, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>)}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

const ServiceEditCard = ({ service, onChange, onSave, onCancel }: { service: Service; onChange: (s: Service) => void; onSave: (s: Service) => void; onCancel: () => void }) => (
  <div className="bg-primary/5 rounded-[24px] p-6 border-2 border-primary col-span-2">
    <div className="grid grid-cols-2 gap-4 mb-4">
      <Field label="İkon" value={service.icon} onChange={v => onChange({ ...service, icon: v })} placeholder="🎬" />
      <Field label="Başlık" value={service.title} onChange={v => onChange({ ...service, title: v })} placeholder="Hizmet adı" />
    </div>
    <Field label="Açıklama" value={service.description} onChange={v => onChange({ ...service, description: v })} multiline placeholder="Açıklama..." />
    <Field label="Özellikler (her satırda bir)" value={service.features.join('\n')} onChange={v => onChange({ ...service, features: v.split('\n').filter(Boolean) })} multiline placeholder="Özellik 1&#10;Özellik 2" />
    <div className="flex gap-3 mt-4">
      <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">İptal</button>
      <button onClick={() => onSave(service)} className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 flex items-center gap-2"><Save size={16} /> Kaydet</button>
    </div>
  </div>
);

// ─── Portfolio Tab ─────────────────────────────────────────────────────

const PortfolioTab = ({ onSave }: { onSave: () => void }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', type: 'image' as const, url: '', thumbnail: '', description: '' });

  const refresh = async () => setItems(await api.getPortfolio());
  useEffect(() => { refresh(); }, []);

  const add = async () => {
    if (!form.title.trim()) return;
    await api.addPortfolio(form);
    setForm({ title: '', category: '', type: 'image', url: '', thumbnail: '', description: '' });
    setShowAdd(false);
    await refresh();
    onSave();
  };

  const del = async (id: string) => { await api.deletePortfolio(id); await refresh(); onSave(); };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-4xl font-bold mb-1">Portfolyo</h1><p className="text-gray-400">{items.length} öğe</p></div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 smooth-transition flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} /> Yeni Ekle
        </button>
      </div>

      {showAdd && (
        <Card title="Yeni Portfolyo Öğesi">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Başlık" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Proje adı" />
            <Field label="Kategori" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} placeholder="Film Prodüksiyon" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tür</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary">
              <option value="image">Fotoğraf</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
            </select>
          </div>
          <Field label="Thumbnail URL (görsel linki)" value={form.thumbnail} onChange={v => setForm(f => ({ ...f, thumbnail: v }))} placeholder="https://..." />
          <Field label="İçerik URL (video/link için)" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
          <Field label="Açıklama" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline placeholder="Kısa açıklama..." />
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">İptal</button>
            <button onClick={add} className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">Ekle</button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm group">
            <div className="aspect-video bg-gray-100 relative">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={40} /></div>
              )}
              <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg">{item.category}</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-xs text-gray-400">{item.type}</p>
              </div>
              <button onClick={() => del(item.id.toString())} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl smooth-transition"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Brands Tab ────────────────────────────────────────────────────────

const BrandsTab = ({ onSave }: { onSave: () => void }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const refresh = async () => setBrands(await api.getBrands());
  useEffect(() => { refresh(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await api.addBrand({ 
      name, 
      logoUrl, 
      toneOfVoice: '', 
      colors: [], 
      ownerId: 'admin', 
      fonts: [], 
      competitors: [] 
    });
    setName(''); setLogoUrl('');
    await refresh(); onSave();
  };

  const del = async (id: string) => { await api.deleteBrand(id); await refresh(); onSave(); };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-4xl font-bold mb-1">Referans Markalar</h1>
      <p className="text-gray-400">{brands.length} marka • Ana sayfada ve portfolyo sayfasında görüntülenir</p>

      <Card title="Yeni Marka Ekle">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Marka Adı" value={name} onChange={setName} placeholder="Örn: Nike" />
          <Field label="Logo URL" value={logoUrl} onChange={setLogoUrl} placeholder="https://..." />
        </div>
        <button onClick={add} className="mt-4 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 smooth-transition shadow-lg shadow-primary/20">Ekle</button>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {brands.map(brand => (
          <div key={brand.id} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm relative group">
            <button onClick={() => del(brand.id)} className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 smooth-transition"><Trash2 size={14} /></button>
            <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center p-4 mb-4">
              <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 smooth-transition" />
            </div>
            <p className="font-bold text-center truncate">{brand.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Packages Tab ──────────────────────────────────────────────────────

const PackagesTab = ({ onSave }: { onSave: () => void }) => {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', period: 'Aylık', features: '', highlighted: false });

  const refresh = async () => setPackages(await api.getPackages());
  useEffect(() => { refresh(); }, []);

  const save = async (pkg: Pkg) => {
    await api.updatePackage(pkg.id.toString(), pkg);
    setEditing(null); await refresh(); onSave();
  };

  const add = async () => {
    if (!form.name.trim()) return;
    await api.addPackage({ ...form, features: form.features.split('\n').filter(Boolean) as any });
    setForm({ name: '', price: '', period: 'Aylık', features: '', highlighted: false });
    setShowAdd(false); await refresh(); onSave();
  };

  const del = async (id: string | number) => { await api.deletePackage(id.toString()); await refresh(); onSave(); };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-4xl font-bold mb-1">Paketler</h1><p className="text-gray-400">{packages.length} paket</p></div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 smooth-transition flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} /> Yeni Paket
        </button>
      </div>

      {showAdd && (
        <Card title="Yeni Paket Ekle">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Paket Adı" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Mini Paket" />
            <Field label="Fiyat" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} placeholder="17.500 ₺" />
            <Field label="Periyot" value={form.period} onChange={v => setForm(f => ({ ...f, period: v }))} placeholder="Aylık" />
          </div>
          <Field label="Özellikler (her satırda bir)" value={form.features} onChange={v => setForm(f => ({ ...f, features: v }))} multiline placeholder="8 Post&#10;1 Reels&#10;Onay Sistemi" />
          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer mt-2">
            <input type="checkbox" checked={form.highlighted} onChange={e => setForm(f => ({ ...f, highlighted: e.target.checked }))} className="w-4 h-4 accent-primary" />
            En Popüler olarak işaretle
          </label>
          <div className="flex gap-3 mt-3">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">İptal</button>
            <button onClick={add} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Ekle</button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map(pkg => (
          editing?.id === pkg.id ? (
            <div key={pkg.id} className="bg-primary/5 rounded-[24px] p-6 border-2 border-primary col-span-3">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="Ad" value={editing.name} onChange={v => setEditing(e => ({ ...e!, name: v }))} placeholder="Paket adı" />
                <Field label="Fiyat" value={editing.price} onChange={v => setEditing(e => ({ ...e!, price: v }))} placeholder="₺" />
                <Field label="Periyot" value={editing.period} onChange={v => setEditing(e => ({ ...e!, period: v }))} placeholder="Aylık" />
              </div>
              <Field label="Özellikler (her satırda bir)" value={editing.features.join('\n')} onChange={v => setEditing(e => ({ ...e!, features: v.split('\n').filter(Boolean) }))} multiline placeholder="Özellik..." />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-200 rounded-xl font-bold">İptal</button>
                <button onClick={() => save(editing)} className="px-6 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2"><Save size={16} /> Kaydet</button>
              </div>
            </div>
          ) : (
            <div key={pkg.id} className={`bg-white rounded-[24px] p-6 border shadow-sm relative ${pkg.highlighted ? 'border-primary' : 'border-gray-100'}`}>
              {pkg.highlighted && <span className="absolute -top-3 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">EN POPÜLER</span>}
              <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
              <p className="text-3xl font-bold text-primary mb-1">{pkg.price}</p>
              <p className="text-xs text-gray-400 mb-4">/{pkg.period}</p>
              <ul className="space-y-1 mb-6">
                {pkg.features.map((f, i) => <li key={i} className="text-sm flex items-center gap-2"><CheckCircle size={14} className="text-green-500" />{f}</li>)}
              </ul>
              <div className="flex gap-2">
                <button onClick={() => setEditing(pkg)} className="flex-1 py-2 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-1"><Edit2 size={14} /> Düzenle</button>
                <button onClick={() => del(pkg.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// ─── Users Tab ─────────────────────────────────────────────────────────

const UsersTab = () => (
  <div className="max-w-2xl">
    <h1 className="text-4xl font-bold mb-8">Hesap Ayarları</h1>
    <Card title="Admin Giriş Bilgileri">
      <p className="text-sm text-gray-500 mb-4">Admin şifresini değiştirmek için <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">server.ts</code> dosyasındaki <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">admin123</code> değerini güncelleyin. Admin kullanıcı adı: <strong>admin</strong>.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 font-medium">
        Şu anki giriş bilgileri localStorage üzerinden doğrulanmaktadır (offline mod). Gerçek kullanıcı yönetimi için Firebase Auth kullanılmaktadır.
      </div>
    </Card>
  </div>
);

// ─── Shared Components ─────────────────────────────────────────────────

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
    <h3 className="text-lg font-bold mb-6">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const Field = ({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary resize-none text-sm" />
    ) : (
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary text-sm" />
    )}
  </div>
);

export default AdminPanel;

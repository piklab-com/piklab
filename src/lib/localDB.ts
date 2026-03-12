// localDB.ts - Universal Data Layer for Piklab
// This file handles data persistence in localStorage for offline-first functionality.

// ─── Types ───────────────────────────────────────────────────────────

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  logoUrl?: string;
  address: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  type: 'image' | 'video';
  thumbnail: string;
  description: string;
  assetUrl?: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  ownerId?: string;
  colors?: string[];
  toneOfVoice?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export interface Package {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}

export interface Client {
  id: string;
  displayName: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  clientId: string;
  status: 'brief' | 'designing' | 'review' | 'revision' | 'approved';
  type: 'post' | 'story' | 'reels' | 'banner' | 'other';
  createdAt: string;
  assetUrl?: string;
  managerNote?: string;
  revisionNote?: string;
  scheduledDate?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  pinCoordinates?: { x: number; y: number };
}

export interface CanvasPin {
  id: string;
  taskId: string;
  x: number;
  y: number;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: SiteSettings = {
  heroTitle: "YENİ NESİL REKLAMCILIK AJANSI",
  heroSubtitle: "EN İYİLER İÇİN EN İYİSİ.",
  heroDescription: "Yeni nesil reklamcılık için çıktığımız bu yolda; her gün dünden biraz daha fazla çalışıyor, biraz daha fazla üretiyoruz.",
  contactEmail: "info@piklab.com",
  contactPhone: "+90 212 000 00 00",
  socialLinks: {
    instagram: "https://instagram.com/piklab",
    facebook: "https://facebook.com/piklab",
  },
  address: "Beşiktaş, İstanbul"
};

const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  { 
    id: 'p1', 
    title: 'Marka Kimliği - TechFlow', 
    category: 'branding', 
    type: 'image', 
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80',
    description: 'Modern teknoloji şirketi için logo ve kurumsal kimlik çalışması.'
  },
  { 
    id: 'p2', 
    title: 'Kurgu - Solar Energy', 
    category: 'production', 
    type: 'video', 
    thumbnail: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&q=80',
    description: 'Sürdürülebilir enerji projeleri için tanıtım filmi kurgusu.'
  }
];

const DEFAULT_BRANDS: Brand[] = [
  { id: 'b1', name: 'TechFlow' },
  { id: 'b2', name: 'Solar Energy' },
  { id: 'b3', name: 'EcoLife' }
];

const DEFAULT_SERVICES: Service[] = [
  { id: 's1', title: 'Film Prodüksiyon', description: 'Hikayenizi sinematik bir dille anlatıyoruz.', icon: 'Film', features: ['Reklam Filmi', 'Kısa Film', 'YouTube İçerik'] },
  { id: 's2', title: 'Fotoğraf', description: 'Anılarınızı ve ürünlerinizi ölümsüzleştiriyoruz.', icon: 'Camera', features: ['Ürün Fotoğrafı', 'Kurumsal Çekim', 'Moda Çekimi'] }
];

const DEFAULT_PACKAGES: Package[] = [
  { id: 'pkg1', name: 'Mini', price: '17.500 ₺', period: 'ay', features: ['8 Post', '1 Reels', 'Tasarım Onay'] },
  { id: 'pkg2', name: 'Start', price: '27.500 ₺', period: 'ay', features: ['15 Post', '2 Reels', 'Raporlama'], highlighted: true }
];

const DEFAULT_CLIENTS: Client[] = [
  { id: 'client_1', displayName: 'Örnek Müşteri', email: 'musteri@piklab.com' },
];

const DEFAULT_TASKS: Task[] = [
  { id: 'task_1', title: 'İnstagram Tanıtım Postu', description: 'Yeni ürün lansmanı için hazırlanan post tasarımı.', clientId: 'client_1', status: 'review', type: 'post', createdAt: new Date().toISOString() },
];

// ─── Helpers ──────────────────────────────────────────────────────────

const P = 'piklab_';

function read<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(P + key);
  return data ? JSON.parse(data) : defaultValue;
}

function write<T>(key: string, data: T): void {
  localStorage.setItem(P + key, JSON.stringify(data));
}

const uid = () => Math.random().toString(36).substring(2, 9);

// ─── localDB API ──────────────────────────────────────────────────────

export const localDB = {
  // --- Settings ---
  getSettings(): SiteSettings {
    return read<SiteSettings>('settings', DEFAULT_SETTINGS);
  },
  saveSettings(updates: Partial<SiteSettings>): void {
    write('settings', { ...this.getSettings(), ...updates });
  },

  // --- Portfolio ---
  getPortfolio(): PortfolioItem[] {
    return read<PortfolioItem[]>('portfolio', DEFAULT_PORTFOLIO);
  },
  addPortfolio(item: Omit<PortfolioItem, 'id'>): PortfolioItem {
    const newItem = { ...item, id: uid() };
    write('portfolio', [...this.getPortfolio(), newItem]);
    return newItem;
  },
  updatePortfolio(id: string, updates: Partial<PortfolioItem>): void {
    write('portfolio', this.getPortfolio().map(i => i.id === id ? { ...i, ...updates } : i));
  },
  deletePortfolio(id: string): void {
    write('portfolio', this.getPortfolio().filter(i => i.id !== id));
  },

  // --- Brands ---
  getBrands(): Brand[] {
    return read<Brand[]>('brands', DEFAULT_BRANDS);
  },
  addBrand(brand: Omit<Brand, 'id'>): Brand {
    const newBrand = { ...brand, id: uid() };
    write('brands', [...this.getBrands(), newBrand]);
    return newBrand;
  },
  updateBrand(id: string, updates: Partial<Brand>): void {
    write('brands', this.getBrands().map(b => b.id === id ? { ...b, ...updates } : b));
  },
  deleteBrand(id: string): void {
    write('brands', this.getBrands().filter(b => b.id !== id));
  },

  // --- Services ---
  getServices(): Service[] {
    return read<Service[]>('services', DEFAULT_SERVICES);
  },
  addService(service: Omit<Service, 'id'>): Service {
    const newService = { ...service, id: uid() };
    write('services', [...this.getServices(), newService]);
    return newService;
  },
  updateService(id: string, updates: Partial<Service>): void {
    write('services', this.getServices().map(s => s.id === id ? { ...s, ...updates } : s));
  },
  deleteService(id: string): void {
    write('services', this.getServices().filter(s => s.id !== id));
  },

  // --- Packages ---
  getPackages(): Package[] {
    return read<Package[]>('packages', DEFAULT_PACKAGES);
  },
  addPackage(pkg: Omit<Package, 'id'>): Package {
    const newPkg = { ...pkg, id: uid() };
    write('packages', [...this.getPackages(), newPkg]);
    return newPkg;
  },
  updatePackage(id: string, updates: Partial<Package>): void {
    write('packages', this.getPackages().map(p => p.id === id ? { ...p, ...updates } : p));
  },
  deletePackage(id: string): void {
    write('packages', this.getPackages().filter(p => p.id !== id));
  },

  // --- Clients ---
  getClients(): Client[] {
    return read<Client[]>('clients', DEFAULT_CLIENTS);
  },
  addClient(client: Omit<Client, 'id'>): Client {
    const newClient = { ...client, id: uid() };
    write('clients', [...this.getClients(), newClient]);
    return newClient;
  },

  // --- Tasks ---
  getTasks(): Task[] {
    return read<Task[]>('tasks', DEFAULT_TASKS);
  },
  addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask = { ...task, id: uid(), createdAt: new Date().toISOString() };
    write('tasks', [...this.getTasks(), newTask]);
    return newTask;
  },
  updateTask(id: string, updates: Partial<Task>): void {
    write('tasks', this.getTasks().map(t => t.id === id ? { ...t, ...updates } : t));
  },
  deleteTask(id: string): void {
    write('tasks', this.getTasks().filter(t => t.id !== id));
  },

  // --- Comments ---
  getComments(taskId: string): TaskComment[] {
    return read<TaskComment[]>('comments', []).filter(c => c.taskId === taskId);
  },
  addComment(comment: Omit<TaskComment, 'id' | 'createdAt'>): TaskComment {
    const newComment = { ...comment, id: uid(), createdAt: new Date().toISOString() };
    write('comments', [...read<TaskComment[]>('comments', []), newComment]);
    return newComment;
  },

  // --- Canvas Pins ---
  getCanvasPins(taskId: string): CanvasPin[] {
    return read<CanvasPin[]>('canvas_pins', []).filter(p => p.taskId === taskId);
  },
  addCanvasPin(pin: Omit<CanvasPin, 'id' | 'createdAt'>): CanvasPin {
    const newPin = { ...pin, id: uid(), createdAt: new Date().toISOString() };
    write('canvas_pins', [...read<CanvasPin[]>('canvas_pins', []), newPin]);
    return newPin;
  },

  // --- Messages ---
  getMessages(): Message[] {
    return read<Message[]>('messages', []);
  },
  addMessage(msg: Omit<Message, 'id' | 'date' | 'read'>): Message {
    const newMsg = { ...msg, id: uid(), date: new Date().toISOString(), read: false };
    write('messages', [...this.getMessages(), newMsg]);
    return newMsg;
  },
  markMessageRead(id: string): void {
    write('messages', this.getMessages().map(m => m.id === id ? { ...m, read: true } : m));
  },

  // --- Reset to defaults ---
  resetCollection(col: 'portfolio' | 'brands' | 'services' | 'packages' | 'settings' | 'tasks' | 'clients' | 'messages' | 'comments' | 'canvas_pins'): void {
    localStorage.removeItem(P + col);
  },
};

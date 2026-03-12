export * from '../types';
import type * as T from '../types';

export type SiteSettings = T.SiteSettings;
export type PortfolioItem = T.PortfolioItem;
export type Brand = T.Brand;
export type Service = T.Service;
export type Package = T.Package;
export type UserProfile = T.UserProfile;
export type Client = T.UserProfile;
export type Task = T.Task;
export type TaskComment = T.TaskComment;
export type Reference = T.Reference;

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
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

// ─── Defaults (Fallbacks in case server is entirely down) ───────────

const DEFAULT_SETTINGS: SiteSettings = {
  heroTitle: "TERAS MEDYA: YENİ NESİL REKLAMCILIK",
  heroSubtitle: "EN İYİLER İÇİN EN İYİSİ.",
  heroDescription: "Reklamcılığın zirvesinde, Teras Medya ile markanızın hikayesini yeniden yazıyoruz.",
  contactEmail: "info@terasmedya.com",
  contactPhone: "+90 540 005 25 20",
  socialLinks: {
    instagram: "https://instagram.com/terasmedya",
    facebook: "https://facebook.com/terasmedya",
  },
  address: "Enntepe Mall, Konya",
  satisfactionRate: 98
};

const DEFAULT_PORTFOLIO: PortfolioItem[] = [];
const DEFAULT_BRANDS: Brand[] = [];
const DEFAULT_SERVICES: Service[] = [];
const DEFAULT_PACKAGES: Package[] = [];
const DEFAULT_CLIENTS: Client[] = [];
const DEFAULT_TASKS: Task[] = [];
const DEFAULT_COMMENTS: TaskComment[] = [];
const DEFAULT_PINS: CanvasPin[] = [];
const DEFAULT_MESSAGES: Message[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────

const getHeaders = () => {
  const token = localStorage.getItem('teras_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      console.error('API Unauthorized/Forbidden');
    }
    throw new Error(`API Error: ${res.statusText}`);
  }
  // No content for 2xx empty responses
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// ─── API Methods ──────────────────────────────────────────────────────

export const api = {
  // --- Settings ---
  async getSettings(): Promise<SiteSettings> {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error();
      const data = await res.json();
      return { ...DEFAULT_SETTINGS, ...data } as SiteSettings;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  async saveSettings(settings: Partial<SiteSettings>): Promise<void> {
    await fetch('/api/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ settings })
    }).then(handleResponse);
    window.dispatchEvent(new Event('api_changed_settings'));
  },

  // --- Portfolio ---
  async getPortfolio(): Promise<PortfolioItem[]> {
    try {
      const res = await fetch('/api/portfolio').then(handleResponse);
      return res || DEFAULT_PORTFOLIO;
    } catch {
      return DEFAULT_PORTFOLIO;
    }
  },
  async addPortfolio(item: Omit<PortfolioItem, 'id'>): Promise<void> {
    await fetch('/api/portfolio', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item)
    }).then(handleResponse);
  },
  async updatePortfolio(id: string, updates: Partial<PortfolioItem>): Promise<void> {
    await fetch(`/api/portfolio/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    }).then(handleResponse);
  },
  async deletePortfolio(id: string): Promise<void> {
    await fetch(`/api/portfolio/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse);
  },

  async getBrands(): Promise<Brand[]> {
    try {
      const items = await fetch('/api/references').then(handleResponse);
      return items.map((i: any) => ({
        id: i.id,
        name: i.name,
        logoUrl: i.logo_url,
        toneOfVoice: i.toneOfVoice,
        colors: i.colors
      })) || DEFAULT_BRANDS;
    } catch {
      return DEFAULT_BRANDS;
    }
  },
  async addBrand(brand: Omit<Brand, 'id'>): Promise<void> {
    await fetch('/api/references', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name: brand.name, logo_url: brand.logoUrl })
    }).then(handleResponse);
  },
  async updateBrand(id: string, updates: Partial<Brand>): Promise<void> {
    await fetch(`/api/references/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.logoUrl ? { logo_url: updates.logoUrl } : {}),
        ...(updates.toneOfVoice ? { toneOfVoice: updates.toneOfVoice } : {}),
        ...(updates.colors ? { colors: updates.colors } : {})
      })
    }).then(handleResponse);
  },
  async deleteBrand(id: string): Promise<void> {
    await fetch(`/api/references/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse);
  },

  // --- Services ---
  async getServices(): Promise<Service[]> {
    try {
      const items = await fetch('/api/services').then(handleResponse);
      return items.map((i: any) => ({
        ...i,
        features: Array.isArray(i.features) ? i.features : (i.features ? JSON.parse(i.features) : [])
      })) || DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  },
  async addService(service: Omit<Service, 'id'>): Promise<void> {
    await fetch('/api/services', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...service,
        slug: service.slug || service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        features: JSON.stringify(service.features || [])
      })
    }).then(handleResponse);
  },
  async updateService(slugOrId: string, updates: Partial<Service>): Promise<void> {
    const payload = { ...updates };
    if (updates.features) payload.features = JSON.stringify(updates.features) as any;
    
    // Fall back to POST /api/services which currently acts as upsert due to .doc(slug).set(..., {merge:true}) in proper firestore usage
    // But since server.ts uses .doc(slug).set(content), it overwrites completely.
    // For now we will overwrite with the updated service content. 
    // Wait, the API doesn't have PUT /api/services, we only implemented DELETE. Let's rely on POST with the slug acting as ID.
    const serviceToSave = {
      title: updates.title,
      description: updates.description,
      icon: updates.icon,
      content: updates.content,
      slug: slugOrId,
      ...payload
    };
    await fetch('/api/services', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(serviceToSave)
    }).then(handleResponse);
  },
  async deleteService(slugOrId: string): Promise<void> {
    await fetch(`/api/services/${slugOrId}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse);
  },

  // --- Packages ---
  async getPackages(): Promise<Package[]> {
    try {
      const items = await fetch('/api/packages').then(handleResponse);
      return items.map((i: any) => ({
        ...i,
        features: Array.isArray(i.features) ? i.features : (i.features ? JSON.parse(i.features) : [])
      })) || DEFAULT_PACKAGES;
    } catch {
      return DEFAULT_PACKAGES;
    }
  },
  async addPackage(pkg: Omit<Package, 'id'>): Promise<void> {
    await fetch('/api/packages', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...pkg,
        features: JSON.stringify(pkg.features || [])
      })
    }).then(handleResponse);
  },
  async updatePackage(id: string, updates: Partial<Package>): Promise<void> {
    const payload = { ...updates };
    if (updates.features) payload.features = JSON.stringify(updates.features) as any;
    await fetch(`/api/packages/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    }).then(handleResponse);
  },
  async deletePackage(id: string): Promise<void> {
    await fetch(`/api/packages/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse);
  },

  // --- Users & Clients ---
  async getUsers(): Promise<Client[]> {
    try {
      return await fetch('/api/users', { headers: getHeaders() }).then(handleResponse) || DEFAULT_CLIENTS;
    } catch {
      return DEFAULT_CLIENTS;
    }
  },
  async addUser(userData: any): Promise<Client> {
    return await fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    }).then(handleResponse);
  },
  async updateUser(uid: string, updates: any): Promise<void> {
    await fetch(`/api/users/${uid}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    }).then(handleResponse);
  },
  async deleteUser(uid: string): Promise<void> {
    await fetch(`/api/users/${uid}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse);
  },

  // Backward compatibility/Context usage
  async getClients(): Promise<Client[]> {
    return this.getUsers();
  },
  async addClient(client: Omit<Client, 'id'>): Promise<Client> {
    return this.addUser({ ...client, role: 'client' });
  },

  // --- Uploads ---
  async uploadFile(file: File): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              name: file.name,
              data: reader.result
            })
          }).then(handleResponse);
          resolve(res);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
    });
  },

  // --- Backups ---
  async triggerBackup(): Promise<void> {
    await fetch('/api/backup', {
      method: 'POST',
      headers: getHeaders()
    }).then(handleResponse);
  },

  // --- Tasks ---
  async getTasks(): Promise<Task[]> {
    try { return await fetch('/api/tasks', { headers: getHeaders() }).then(handleResponse) || DEFAULT_TASKS; } catch { return DEFAULT_TASKS; }
  },
  async addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    return await fetch('/api/tasks', { method: 'POST', headers: getHeaders(), body: JSON.stringify(task) }).then(handleResponse);
  },
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await fetch(`/api/tasks/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) }).then(handleResponse);
  },
  async deleteTask(id: string): Promise<void> {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse);
  },

  // --- Comments ---
  async getComments(taskId: string): Promise<TaskComment[]> {
    try { return await fetch(`/api/tasks/${taskId}/comments`, { headers: getHeaders() }).then(handleResponse) || DEFAULT_COMMENTS; } catch { return DEFAULT_COMMENTS; }
  },
  async addComment(comment: Omit<TaskComment, 'id' | 'createdAt'>): Promise<TaskComment> {
    return await fetch(`/api/tasks/${comment.taskId}/comments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(comment) }).then(handleResponse);
  },

  // --- Canvas Pins ---
  async getCanvasPins(taskId: string): Promise<CanvasPin[]> {
    try { return await fetch(`/api/tasks/${taskId}/pins`, { headers: getHeaders() }).then(handleResponse) || DEFAULT_PINS; } catch { return DEFAULT_PINS; }
  },
  async addCanvasPin(pin: Omit<CanvasPin, 'id' | 'createdAt'>): Promise<CanvasPin> {
    return await fetch(`/api/tasks/${pin.taskId}/pins`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(pin) }).then(handleResponse);
  }
};

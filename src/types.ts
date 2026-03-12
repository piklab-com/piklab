export interface TaskComment {
  id?: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  pinCoordinates?: { x: number; y: number };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'client' | 'designer';
  brandId?: string;
  createdAt: string;
  socialAccounts?: {
    instagram?: { accessToken: string; username: string };
    facebook?: { accessToken: string; pageName: string };
  };
  stripeCustomerId?: string;
}

export interface Brand {
  id?: string;
  name: string;
  ownerId: string;
  colors: string[];
  fonts: string[];
  toneOfVoice: string;
  competitors: string[];
  logoUrl?: string;
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  brandId: string;
  clientId: string;
  designerId?: string;
  status: 'brief' | 'designing' | 'review' | 'revision' | 'approved';
  type: 'post' | 'story' | 'reels' | 'banner' | 'other';
  scheduledDate?: string;
  assetUrl?: string;
  thumbnailUrl?: string;
  moodboardUrls?: string[];
  caption?: string;
  hashtags?: string[];
  feedback?: {
    userId: string;
    message: string;
    timestamp: string;
    pinPosition?: { x: number; y: number };
  }[];
  createdAt: string;
  updatedAt?: string;
}

export interface Subscription {
  id?: string;
  userId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: string;
  stripeSubscriptionId?: string;
}

export interface Service {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  content: string;
}

export interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  type: 'image' | 'video' | 'link';
  url: string;
  thumbnail: string;
  description: string;
}

export interface Reference {
  id: number;
  name: string;
  logo_url: string;
}

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export interface Package {
  id: number;
  name: string;
  price: string;
  features: string;
  period: string;
  stripePriceId?: string;
}

export interface SiteSettings {
  [key: string]: string;
}

export type SupportedLanguage = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'it' | 'zh' | 'ru' | 'hi';

export type PlanType = 'free' | 'pro';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  usageCount: number; // Quantas plantas já identificou
  maxUsage: number; // Limite do plano (ex: 3 para free, -1 para ilimitado)
}

export interface PlantCare {
  water: string;
  light: string;
  soil: string;
  temperature: string;
}

export interface PlantHealth {
  isHealthy: boolean;
  diagnosis: string;
  symptoms: string[];
  treatment: string[];
}

export interface MedicinalProperties {
  isMedicinal: boolean;
  benefits: string;
  usage: string;
}

export interface PlantData {
  id?: string;
  savedAt?: number;
  commonName: string;
  scientificName: string;
  description: string;
  funFact: string;
  toxicity: string;
  propagation: string;
  imageUrl?: string;
  wateringFrequencyDays?: number;
  care: PlantCare;
  health: PlantHealth;
  medicinal: MedicinalProperties;
  language?: SupportedLanguage;
}

export interface PlantCandidate {
  commonName: string;
  scientificName: string;
  imageUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  author: string;
  imageUrl: string;
}

export interface AdminStats {
  totalPosts: number;
  totalViews: number;
  totalUsers: number; // Mock value
}

export enum AppState {
  LANDING,
  IDLE,
  ANALYZING,
  SELECTING,
  SUCCESS,
  ERROR,
  GARDEN,
  BLOG,
  ADMIN
}
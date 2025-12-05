
export interface User {
  email: string;
  name: string;
  photoUrl?: string;
  isAdmin: boolean;
  isBanned: boolean;
  agreedToTerms: boolean;
  joinedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[]; // base64 strings for user uploads
  generatedImage?: string; // base64 string for AI generation
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export type ViewState = 'landing' | 'chat' | 'history' | 'admin-users' | 'admin-builder';

export interface AdminConfig {
  systemInstruction: string;
  securityLevel: 'standard' | 'high' | 'maximum';
  features: {
    codeGeneration: boolean;
    imageAnalysis: boolean;
  }
}

export type ModelMode = 'standard' | 'research' | 'creative' | 'thinking';

export interface Ad {
  id: string;
  title: string;
  description: string;
  category: AdCategory;
  price: number;
  condition: AdCondition;
  locationState: string; // e.g. "São Paulo", "Rio de Janeiro"
  locationCity: string;  // e.g. "São Paulo", "Copacabana"
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerId: string; // Firebase Auth UID
  images: string[]; // URLs or Unsplash keywords
  views: number;
  featured: boolean;
  createdAt: number; // millisecond timestamp
  tags: string[];
}

export type AdCategory =
  | "imoveis"      // Real Estate
  | "veiculos"     // Vehicles
  | "compra_venda" // Buy & Sell
  | "empregos"     // Jobs
  | "servicos"     // Services
  | "comunidade"   // Community
  | "adulto";      // Adult/Sexy/Sensual

export type AdCondition = "" | "novo" | "usado" | "nao_aplica";

export interface Chat {
  id: string; // adId_buyerId_sellerId
  adId: string;
  adTitle: string;
  adPrice: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage: string;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string;
  createdAt: number;
}

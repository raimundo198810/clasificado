export interface Ad {
  id: string;
  title: string;
  description: string;
  category: AdCategory;
  subCategory?: string; // added subcategory support
  price: number;
  condition: AdCondition;
  locationState: string; // e.g. "São Paulo", "Rio de Janeiro"
  locationCity: string;  // e.g. "São Paulo", "Copacabana"
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerId: string; // Firebase Auth UID
  images: string[]; // URLs or Unsplash keywords (up to 5)
  videoUrl?: string; // Link to YouTube, Vimeo index, etc.
  sellerPhotoUrl?: string; // Advertiser profile/avatar photo
  views: number;
  featured: boolean; // True for featured plans
  planType: "gratis" | "destaque_7" | "destaque_30" | "vip";
  status: "approved" | "pending" | "publicado" | string; // Approval system
  tipo_plano?: "gratis" | "destaque_7" | "destaque_30" | "vip" | string;
  dias_destaque?: number;
  data_expiracao?: string;
  createdAt: number; // millisecond timestamp
  tags: string[];
}

export type AdCategory =
  | "veiculos"
  | "imoveis"
  | "empregos"
  | "compra_venda"
  | "tecnologia"
  | "moda_beleza"
  | "animais"
  | "cursos_educacao"
  | "construcao_reforma"
  | "servicos"
  | "gastronomia"
  | "eventos"
  | "saude_bem_estar"
  | "turismo_viagens"
  | "esportes_lazer"
  | "livros_hobbies"
  | "empresas_negocios"
  | "relacionamentos";

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
  isAdmin?: boolean;
}

export interface PlanConfig {
  id: string; // 'gratis' | 'destaque_7' | 'destaque_30' | 'vip'
  name: string;
  price: number;
  durationDays: number;
  maxPhotos: number;
  allowVideo: boolean;
  description: string;
}

export interface PaymentLog {
  id: string;
  adId?: string;
  adTitle: string;
  planType: string;
  amount: number;
  payerEmail: string;
  payerName: string;
  paymentMethod: "pix" | "cartao";
  status: "approved" | "pending";
  createdAt: number;
}

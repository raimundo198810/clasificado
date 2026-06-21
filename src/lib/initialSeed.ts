import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Ad, AdCategory } from "../types";

export const CATEGORY_LABELS: Record<AdCategory, { label: string; icon: string; description: string; color: string }> = {
  imoveis: {
    label: "Imóveis",
    icon: "Home",
    description: "Casas, apartamentos, terrenos e escritórios para comprar ou alugar",
    color: "from-blue-500 to-indigo-600"
  },
  veiculos: {
    label: "Veículos",
    icon: "Car",
    description: "Carros, motos, utilitários, peças de reposição e acessórios",
    color: "from-amber-500 to-orange-600"
  },
  compra_venda: {
    label: "Compra & Venda",
    icon: "ShoppingBag",
    description: "Eletrônicos, smartphones, vestuário, móveis, decoração e mais",
    color: "from-emerald-500 to-teal-600"
  },
  empregos: {
    label: "Empregos",
    icon: "Briefcase",
    description: "Oportunidades de trabalho em regime integral, meio período e freelas",
    color: "from-purple-500 to-violet-600"
  },
  servicos: {
    label: "Serviços",
    icon: "Wrench",
    description: "Reformas, marido de aluguel, aulas particulares, TI e beleza",
    color: "from-cyan-500 to-sky-600"
  },
  comunidade: {
    label: "Comunidade",
    icon: "Users",
    description: "Doação de animais, achados e perdidos, eventos de bairro e grupos",
    color: "from-rose-500 to-pink-600"
  },
  adulto: {
    label: "Conteúdo Adulto",
    icon: "Heart",
    description: "Anúncios, encontros, produtos sensuais e entretenimento adulto (+18)",
    color: "from-red-500 to-rose-700"
  }
};

const SEED_ADS: Omit<Ad, "id">[] = [
  {
    title: "Apartamento de Luxo Mobiliado em Moema",
    description: "Lindo apartamento duplex totalmente reformado e decorado por arquiteto, com 2 suítes espaçosas, cozinha integrada equipada e varanda gourmet espaçosa com vista livre para o bairro. Condomínio completo com piscina raiada, academia moderna, salão de festas e 2 vagas demarcadas na garagem. Excelente localização, a apenas 3 quadras do Metrô Moema e próximo a ótimos restaurantes e farmácias.",
    category: "imoveis",
    price: 1350000,
    condition: "usado",
    locationState: "São Paulo",
    locationCity: "São Paulo",
    sellerName: "Carlos Alberto",
    sellerEmail: "carlos.alberto@exemplo.com",
    sellerPhone: "(11) 98765-4321",
    sellerId: "system_admin_seed",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800"
    ],
    views: 142,
    featured: true,
    createdAt: Date.now() - 36 * 3600 * 1000, // 36 hours ago
    tags: ["apartamento", "moema", "luxo", "mobiliado"]
  },
  {
    title: "Honda Civic 2.0 EXL 2021 Único Dono",
    description: "Honda Civic EXL em estado de zero, câmbio CVT automático de 7 marchas virtuais, bancos de couro impecáveis, multimídia original de 7 polegadas com Apple CarPlay e Android Auto. Todas as revisões feitas rigorosamente na concessionária Honda autorizada. Chave reserva, manual carimbado, ipva 2026 pago, sem nenhum detalhe na pintura, pneus seminovos.",
    category: "veiculos",
    price: 119900,
    condition: "usado",
    locationState: "São Paulo",
    locationCity: "Campinas",
    sellerName: "Marina Neves",
    sellerEmail: "marina.neves@exemplo.com",
    sellerPhone: "(19) 97123-5566",
    sellerId: "system_admin_seed",
    images: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800"
    ],
    views: 295,
    featured: true,
    createdAt: Date.now() - 2 * 3600 * 1000, // 2 hours ago
    tags: ["honda", "civic", "automatico", "seminovo"]
  },
  {
    title: "iPhone 15 Pro Max Natural Titanium 256GB",
    description: "iPhone 15 Pro Max de Titanium Natural, capacidade de 256GB. Saúde da bateria de 98% com apenas 9 meses de uso cuidadoso. Aparelho na garantia oficial Apple até setembro de 2026. Acompanha caixa original completa, cabo original nunca usado de nylon reforçado e 2 cases premium Otterbox de brinde. Sem riscos leves ou amassados.",
    category: "compra_venda",
    price: 6800,
    condition: "usado",
    locationState: "Rio de Janeiro",
    locationCity: "Rio de Janeiro",
    sellerName: "Thiago Souza",
    sellerEmail: "thiago.souza@exemplo.com",
    sellerPhone: "(21) 99888-7711",
    sellerId: "system_admin_seed",
    images: [
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1565849906461-0ee72b7f7396?auto=format&fit=crop&q=80&w=800"
    ],
    views: 89,
    featured: false,
    createdAt: Date.now() - 10 * 3600 * 1000, // 10 hours ago
    tags: ["iphone", "apple", "celular", "titanio"]
  },
  {
    title: "Vaga para Desenvolvedor Full-Stack React / Node Senior",
    description: "Estamos contratando desenvolvedor Full Stack experiente em React, TypeScript e Express para atuar em modelo 100% Home Office (Remoto). Oferecemos contratação em regime PJ flexível, salário competitivo de acordo com nível técnico, participação nos lucros anuais e auxílio home-office para equipamentos e internet de alta velocidade.",
    category: "empregos",
    price: 15000, // Monthly salary
    condition: "nao_aplica",
    locationState: "Minas Gerais",
    locationCity: "Belo Horizonte",
    sellerName: "RH Tech Talent",
    sellerEmail: "recrutamento@techtalent.com",
    sellerPhone: "(31) 3224-5555",
    sellerId: "system_admin_seed",
    images: [
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800"
    ],
    views: 52,
    featured: true,
    createdAt: Date.now() - 4 * 12 * 3600 * 1000, // 2 days ago
    tags: ["homeoffice", "remoto", "programador", "vaga"]
  },
  {
    title: "Adestramento Canino e Comportamento Canino Profissional",
    description: "Adestrador de cães certificado internacionalmente com mais de 8 anos de experiência. Aulas personalizadas de psicologia e comportamento canino focadas em obediência básica, correção de agressividade excessiva, ansiedade por separação de donos e adaptação de filhotes na casa. Atendemos toda a Zona Sul e Zona Oeste de SP.",
    category: "servicos",
    price: 180, // price per session
    condition: "nao_aplica",
    locationState: "São Paulo",
    locationCity: "São Paulo",
    sellerName: "Bruno Adestrador",
    sellerEmail: "bruno.adestra@exemplo.com",
    sellerPhone: "(11) 96677-8899",
    sellerId: "system_admin_seed",
    images: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=800"
    ],
    views: 64,
    featured: false,
    createdAt: Date.now() - 24 * 3600 * 1000, // 1 day ago
    tags: ["adestramento", "caes", "pets", "adestrador"]
  }
];

export async function ensureSeedData() {
  try {
    const querySnapshot = await getDocs(collection(db, "ads"));
    if (querySnapshot.empty) {
      console.log("Firestore ads collection is empty! Initiating initial seed of sample listings...");
      const batch = writeBatch(db);
      
      SEED_ADS.forEach((ad) => {
        const docRef = doc(collection(db, "ads"));
        batch.set(docRef, { ...ad, id: docRef.id });
      });

      await batch.commit();
      console.log("Successfully seeded Firestore with template advertisements!");
    } else {
      console.log(`Firestore already has ${querySnapshot.size} listings. Skipping seed phase.`);
    }
  } catch (err) {
    console.warn("Could not check/run initial Firestore seedling. It might be due to security rules configured yet:", err);
  }
}

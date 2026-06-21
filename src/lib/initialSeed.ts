import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Ad, AdCategory } from "../types";

export const CATEGORY_LABELS: Record<AdCategory, { label: string; icon: string; description: string; color: string }> = {
  veiculos: {
    label: "Veículos",
    icon: "Car",
    description: "Carros, motos, caminhões, barcos e autopeças",
    color: "from-amber-500 to-orange-600"
  },
  imoveis: {
    label: "Imóveis",
    icon: "Home",
    description: "Aluguel e compra de casas, apartamentos e terrenos",
    color: "from-blue-500 to-indigo-600"
  },
  empregos: {
    label: "Empregos",
    icon: "Briefcase",
    description: "Vagas de trabalho, estágios, home-office e currículos",
    color: "from-purple-500 to-violet-600"
  },
  compra_venda: {
    label: "Compra e Venda",
    icon: "ShoppingBag",
    description: "Móveis, eletrodomésticos, decoração e utilidades",
    color: "from-emerald-500 to-teal-600"
  },
  tecnologia: {
    label: "Tecnologia",
    icon: "Smartphone",
    description: "Celulares, notebooks, informática e games",
    color: "from-cyan-500 to-blue-600"
  },
  moda_beleza: {
    label: "Moda e Beleza",
    icon: "Shirt",
    description: "Vestuário, calçados, bolsas e cosméticos",
    color: "from-pink-500 to-rose-600"
  },
  animais: {
    label: "Animais",
    icon: "Smile",
    description: "Gatos, cachorros, acessórios e serviços pet",
    color: "from-orange-500 to-amber-600"
  },
  cursos_educacao: {
    label: "Cursos e Educação",
    icon: "BookOpen",
    description: "Cursos online, idiomas, reforço e concursos",
    color: "from-teal-500 to-emerald-600"
  },
  construcao_reforma: {
    label: "Construção",
    icon: "Hammer",
    description: "Materiais de construção, pintura e serviços gerais",
    color: "from-yellow-600 to-orange-700"
  },
  servicos: {
    label: "Serviços",
    icon: "Wrench",
    description: "Diaristas, eletricistas, encanadores e reparos",
    color: "from-sky-500 to-cyan-600"
  },
  gastronomia: {
    label: "Gastronomia",
    icon: "Utensils",
    description: "Restaurantes, marmitas, doces e delivery",
    color: "from-red-500 to-orange-600"
  },
  eventos: {
    label: "Eventos",
    icon: "Calendar",
    description: "Festas, casamentos, fotografia e iluminação",
    color: "from-fuchsia-500 to-purple-600"
  },
  saude_bem_estar: {
    label: "Saúde e Bem-Estar",
    icon: "Activity",
    description: "Clínicas, academias, dentistas e bem-estar",
    color: "from-rose-500 to-red-600"
  },
  turismo_viagens: {
    label: "Turismo e Viagens",
    icon: "Plane",
    description: "Pacotes de viagem, hotéis e excursões",
    color: "from-indigo-500 to-blue-600"
  },
  esportes_lazer: {
    label: "Esportes e Lazer",
    icon: "Trophy",
    description: "Bicicletas, camping, pesca e futebol",
    color: "from-lime-500 to-green-600"
  },
  livros_hobbies: {
    label: "Livros e Hobbies",
    icon: "Book",
    description: "Livros, instrumentos musicais e artesanato",
    color: "from-violet-500 to-fuchsia-600"
  },
  empresas_negocios: {
    label: "Empresas",
    icon: "Building",
    description: "Equipamentos, franquias e negócios",
    color: "from-stone-500 to-neutral-600"
  },
  relacionamentos: {
    label: "Relacionamentos",
    icon: "Heart",
    description: "Amizades, encontros e eventos sociais",
    color: "from-red-500 to-pink-600"
  }
};

const SEED_ADS: Omit<Ad, "id">[] = [
  {
    title: "Apartamento de Luxo Mobiliado em Moema",
    description: "Lindo apartamento duplex totalmente reformado e decorado por arquiteto, com 2 suítes espaçosas, cozinha integrada equipada e varanda gourmet espaçosa com vista livre para o bairro. Condomínio completo com piscina raiada, academia moderna, salão de festas e 2 vagas demarcadas na garagem. Excelente localização, a apenas 3 quadras do Metrô Moema e próximo a ótimos restaurantes e farmácias.",
    category: "imoveis",
    subCategory: "Apartamentos",
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
    videoUrl: "",
    sellerPhotoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    views: 142,
    featured: false,
    planType: "gratis",
    status: "approved",
    createdAt: Date.now() - 36 * 3600 * 1000, // 36 hours ago
    tags: ["apartamento", "moema", "luxo", "mobiliado"]
  },
  {
    title: "Honda Civic 2.0 EXL 2021 Único Dono",
    description: "Honda Civic EXL em estado de zero, câmbio CVT automático de 7 marchas virtuais, bancos de couro impecáveis, multimídia original de 7 polegadas com Apple CarPlay e Android Auto. Todas as revisões feitas rigorosamente na concessionária Honda autorizada. Chave reserva, manual carimbado, ipva 2026 pago, sem nenhum detalhe na pintura, pneus seminovos.",
    category: "veiculos",
    subCategory: "Carros",
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
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    sellerPhotoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    views: 295,
    featured: true,
    planType: "destaque_30",
    status: "approved",
    createdAt: Date.now() - 2 * 3600 * 1000, // 2 hours ago
    tags: ["honda", "civic", "automatico", "seminovo"]
  },
  {
    title: "iPhone 15 Pro Max Natural Titanium 256GB",
    description: "iPhone 15 Pro Max de Titanium Natural, capacidade de 256GB. Saúde da bateria de 98% com apenas 9 meses de uso cuidadoso. Aparelho na garantia oficial Apple até setembro de 2026. Acompanha caixa original completa, cabo original nunca usado de nylon reforçado e 2 cases premium Otterbox de brinde. Sem riscos leves ou amassados.",
    category: "compra_venda",
    subCategory: "Celulares",
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
    videoUrl: "",
    sellerPhotoUrl: "",
    views: 89,
    featured: false,
    planType: "gratis",
    status: "approved",
    createdAt: Date.now() - 10 * 3600 * 1000, // 10 hours ago
    tags: ["iphone", "apple", "celular", "titanio"]
  },
  {
    title: "Vaga para Desenvolvedor Full-Stack React / Node Senior",
    description: "Estamos contratando desenvolvedor Full Stack experiente em React, TypeScript e Express para atuar em modelo 100% Home Office (Remoto). Oferecemos contratação em regime PJ flexível, salário competitivo de acordo com nível técnico, participação nos lucros anuais e auxílio home-office para equipamentos e internet de alta velocidade.",
    category: "empregos",
    subCategory: "Tecnologia e TI",
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
    videoUrl: "",
    sellerPhotoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
    views: 52,
    featured: true,
    planType: "vip",
    status: "approved",
    createdAt: Date.now() - 4 * 12 * 3600 * 1000, // 2 days ago
    tags: ["homeoffice", "remoto", "programador", "vaga"]
  },
  {
    title: "Adestramento Canino e Comportamento Canino Profissional",
    description: "Adestrador de cães certificado internacionalmente com mais de 8 anos de experiência. Aulas personalizadas de psicologia e comportamento canino focadas em obediência básica, correção de agressividade excessiva, ansiedade por separação de donos e adaptação de filhotes na casa. Atendemos toda a Zona Sul e Zona Oeste de SP.",
    category: "servicos",
    subCategory: "Reformas e Reparos",
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
    videoUrl: "",
    sellerPhotoUrl: "",
    views: 64,
    featured: false,
    planType: "gratis",
    status: "approved",
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

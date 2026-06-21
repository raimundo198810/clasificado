import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  HelpCircle, 
  Check, 
  DollarSign, 
  Camera, 
  RefreshCw, 
  Copy, 
  Bell, 
  QrCode, 
  Award, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Video,
  User,
  Info
} from "lucide-react";
import confetti from "canvas-confetti";
import { Ad, AdCategory, AdCondition, UserProfile, PaymentLog } from "../types";
import { CATEGORY_LABELS } from "../lib/initialSeed";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

const BRAZIL_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" }
];

// Default stock thematic images fallback if user doesn't paste a link
const STOCK_THEMATIC_IMAGES: Record<AdCategory, string[]> = {
  veiculos: [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800"
  ],
  imoveis: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&q=80&w=800"
  ],
  empregos: [
    "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800"
  ],
  compra_venda: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
  ],
  tecnologia: [
    "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800"
  ],
  moda_beleza: [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&q=80&w=800"
  ],
  animais: [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800"
  ],
  cursos_educacao: [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800"
  ],
  construcao_reforma: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800"
  ],
  servicos: [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800"
  ],
  gastronomia: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800"
  ],
  eventos: [
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800"
  ],
  saude_bem_estar: [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800"
  ],
  turismo_viagens: [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=800"
  ],
  esportes_lazer: [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800"
  ],
  livros_hobbies: [
    "https://images.unsplash.com/photo-1495312040802-a929cd14a6ab?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800"
  ],
  empresas_negocios: [
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800"
  ],
  relacionamentos: [
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800"
  ]
};

// Default static subcategories list
export const DEFAULT_SUBCATEGORIES: Record<AdCategory, string[]> = {
  veiculos: ["Carros", "Motos", "Caminhões", "Vans", "Ônibus", "Barcos", "Peças e Acessórios", "Serviços Automotivos"],
  imoveis: ["Casas à Venda", "Casas para Alugar", "Apartamentos à Venda", "Apartamentos para Alugar", "Terrenos", "Chácaras e Sítios", "Salas Comerciais", "Galpões", "Temporada"],
  empregos: ["Vagas de Emprego", "Estágios", "Jovem Aprendiz", "Freelancer", "Home Office", "Currículos"],
  compra_venda: ["Eletrônicos", "Celulares", "Computadores", "TVs e Áudio", "Eletrodomésticos", "Móveis", "Decoração", "Ferramentas", "Utilidades Domésticas"],
  tecnologia: ["Smartphones", "Notebooks", "Tablets", "Games", "Consoles", "Informática", "Acessórios"],
  moda_beleza: ["Roupas Femininas", "Roupas Masculinas", "Calçados", "Bolsas", "Joias e Relógios", "Cosméticos", "Perfumes"],
  animais: ["Cachorros", "Gatos", "Aves", "Peixes", "Cavalos", "Acessórios para Pets", "Serviços Veterinários"],
  cursos_educacao: ["Cursos Online", "Idiomas", "Informática", "Reforço Escolar", "Concursos", "Faculdades"],
  construcao_reforma: ["Materiais de Construção", "Pintura", "Elétrica", "Hidráulica", "Marcenaria", "Serviços Gerais"],
  servicos: ["Diaristas", "Encanadores", "Eletricistas", "Pedreiros", "Pintores", "Jardineiros", "Chaveiros", "Técnicos em Informática"],
  gastronomia: ["Restaurantes", "Lanchonetes", "Marmitas", "Bolos e Doces", "Buffets", "Delivery"],
  eventos: ["Casamentos", "Festas", "Decoração", "Fotografia", "Som e Iluminação", "Espaços para Eventos"],
  saude_bem_estar: ["Clínicas", "Dentistas", "Psicólogos", "Fisioterapia", "Academias", "Nutrição"],
  turismo_viagens: ["Pacotes de Viagem", "Hotéis", "Pousadas", "Excursões", "Passagens"],
  esportes_lazer: ["Bicicletas", "Academia", "Pesca", "Camping", "Futebol", "Artes Marciais"],
  livros_hobbies: ["Livros", "Revistas", "Colecionáveis", "Artesanato", "Instrumentos Musicais"],
  empresas_negocios: ["Franquias", "Equipamentos Comerciais", "Máquinas", "Oportunidades de Negócios"],
  relacionamentos: ["Amizades", "Grupos Sociais", "Eventos Sociais"]
};

type AdPlanType = "gratis" | "destaque_7" | "destaque_30" | "vip";

interface PostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSuccess: () => void;
}

export default function PostAdModal({ isOpen, onClose, currentUser, onSuccess }: PostAdModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<AdCategory>("compra_venda");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<AdCondition>("usado");
  const [locationState, setLocationState] = useState("SP");
  const [locationCity, setLocationCity] = useState("São Paulo");
  const [details, setDetails] = useState("");
  
  // Contacts
  const [sellerName, setSellerName] = useState(currentUser?.displayName || "");
  const [sellerPhone, setSellerPhone] = useState(() => {
    return currentUser ? (localStorage.getItem(`viva_phone_${currentUser.uid}`) || "") : "";
  });
  const [sellerEmail, setSellerEmail] = useState(currentUser?.email || "");

  // Paid Ads Upgrade Configuration Values
  const [adPlan, setAdPlan] = useState<AdPlanType>("gratis");
  const [planPrices, setPlanPrices] = useState<Record<AdPlanType, number>>({
    gratis: 0,
    destaque_7: 20,
    destaque_30: 35,
    vip: 49.90
  });

  // Photo uploads (Max 5 photos)
  const [images, setImages] = useState<string[]>(["", "", "", "", ""]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Video selection links (paid plan feature)
  const [videoUrl, setVideoUrl] = useState("");

  // Advertiser Profile photo (VIP feature)
  const [sellerPhotoUrl, setSellerPhotoUrl] = useState("");

  // Checkout system states
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"payment" | "confirmed">("payment");
  const [selectedGateway, setSelectedGateway] = useState<"mp_pix" | "mp_card" | "fake_pix">("mp_pix");
  
  // Mercado Pago variables
  const [mpPixQrCode, setMpPixQrCode] = useState("");
  const [mpPixQrCodeBase64, setMpPixQrCodeBase64] = useState("");
  const [mpPaymentId, setMpPaymentId] = useState<string | number>("");
  const [mpPreferenceUrl, setMpPreferenceUrl] = useState("");
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState("");
  const [mpStatus, setMpStatus] = useState("pending");

  // Simulated automatic Pix timer
  const [paymentTicker, setPaymentTicker] = useState(3);
  const [isConfirmingAuto, setIsConfirmingAuto] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [showPushNotification, setShowPushNotification] = useState(false);

  // Success Celebration indicators
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    minPrice?: number;
    maxPrice?: number;
    recommendedPrice?: number;
    sentiment?: string;
    reasoning?: string;
  } | null>(null);

  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (!locationState) {
      setCitiesList([]);
      return;
    }
    let isMounted = true;
    setLoadingCities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${locationState}/municipios?ordenar=nome`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar cidades");
        return res.json();
      })
      .then((data: Array<{ nome: string }>) => {
        if (isMounted) {
          const names = data.map((item) => item.nome);
          setCitiesList(names);
          if (names.length > 0 && !names.includes(locationCity)) {
            setLocationCity(names[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar cidades do IBGE", err);
      })
      .finally(() => {
        if (isMounted) setLoadingCities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [locationState]);

  const [formError, setFormError] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Dynamic values loaded on mount / pricing changes
  const loadDynamicConfigs = () => {
    // 1. Plan Prices
    const savedPrices = localStorage.getItem("viva_plan_prices");
    if (savedPrices) {
      try {
        setPlanPrices(JSON.parse(savedPrices));
      } catch (e) {
        console.error("Pricing config reading issue:", e);
      }
    }
    
    // 2. Subcategories
    const savedSubs = localStorage.getItem("viva_custom_subcategories");
    const subList = savedSubs ? JSON.parse(savedSubs) : DEFAULT_SUBCATEGORIES;
    const activeSubList = subList[category] || [];
    if (activeSubList.length > 0 && !activeSubList.includes(subCategory)) {
      setSubCategory(activeSubList[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDynamicConfigs();
    }
  }, [isOpen, category]);

  // Listen to admin price configurations
  useEffect(() => {
    window.addEventListener("viva_pricing_changed", loadDynamicConfigs);
    window.addEventListener("viva_subcategories_changed", loadDynamicConfigs);
    return () => {
      window.removeEventListener("viva_pricing_changed", loadDynamicConfigs);
      window.removeEventListener("viva_subcategories_changed", loadDynamicConfigs);
    };
  }, [category]);

  const playSuccessChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);

      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
          gain2.gain.setValueAtTime(0.18, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.55);
        } catch (e) {}
      }, 100);
    } catch (e) {}
  };

  // Auto-confirmation simulation timer
  useEffect(() => {
    let interval: any;
    if (showCheckout && checkoutStep === "payment" && selectedGateway === "fake_pix") {
      setPaymentTicker(4);
      interval = setInterval(() => {
        setPaymentTicker((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsConfirmingAuto(true);
            setTimeout(() => {
              playSuccessChime();
              setShowPushNotification(true);
              setCheckoutStep("confirmed");
              setIsConfirmingAuto(false);
              
              setTimeout(() => {
                setShowPushNotification(false);
              }, 4500);
            }, 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showCheckout, checkoutStep, selectedGateway]);

  const initiateMercadoPagoPayment = async () => {
    setMpLoading(true);
    setMpError("");
    setMpPixQrCode("");
    setMpPixQrCodeBase64("");
    setMpPaymentId("");
    setMpPreferenceUrl("");
    
    const activePrice = planPrices[adPlan];

    try {
      // 1. Create Pix Payment via backend with active pricing
      const pixRes = await fetch("/api/mercadopago/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Plano ${adPlan.toUpperCase()} no VivaLocal Classificados`,
          email: sellerEmail || "comprador@viva-local.com",
          name: sellerName || "Cliente VivaLocal",
          price: activePrice
        })
      });
      const pixData = await pixRes.json();
      if (pixRes.ok) {
        setMpPixQrCode(pixData.qrCode || "");
        setMpPixQrCodeBase64(pixData.qrCodeBase64 || "");
        setMpPaymentId(pixData.paymentId || "");
        setMpStatus(pixData.status || "pending");
      } else {
        throw new Error(pixData.error || "Falha na criação do PIX");
      }

      // 2. Create Card preference via backend with active pricing
      const prefRes = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Plano ${adPlan.toUpperCase()} no VivaLocal`,
          email: sellerEmail || "comprador@viva-local.com",
          price: activePrice,
          clientOrigin: window.location.origin
        })
      });
      const prefData = await prefRes.json();
      if (prefRes.ok) {
        setMpPreferenceUrl(prefData.initPoint || "");
      }
    } catch (err: any) {
      console.error(err);
      setMpError(err.message || "Erro de conexão com o painel do Mercado Pago.");
    } finally {
      setMpLoading(false);
    }
  };

  const checkMercadoPagoStatus = async (silent = false) => {
    if (!mpPaymentId) return;
    if (!silent) setMpLoading(true);
    try {
      const res = await fetch(`/api/mercadopago/check-payment/${mpPaymentId}`);
      const data = await res.json();
      if (res.ok) {
        setMpStatus(data.status);
        if (data.status === "approved") {
          playSuccessChime();
          setShowPushNotification(true);
          setCheckoutStep("confirmed");
          setTimeout(() => setShowPushNotification(false), 4500);
        } else {
          if (!silent) {
            setFormError("O pagamento ainda consta como pendente no Mercado Pago. Por favor, conclua o pagamento e tente novamente.");
          }
        }
      } else {
        if (!silent) setFormError("Não foi possível consultar as transações no Mercado Pago.");
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) setFormError("Erro ao verificar status: " + err.message);
    } finally {
      if (!silent) setMpLoading(false);
    }
  };

  // Auto trigger payment generation
  useEffect(() => {
    if (showCheckout && adPlan !== "gratis" && (selectedGateway === "mp_pix" || selectedGateway === "mp_card") && !mpPaymentId) {
      initiateMercadoPagoPayment();
    }
  }, [showCheckout, adPlan, selectedGateway]);

  // Silently check billing statuses
  useEffect(() => {
    let checkInterval: any;
    if (showCheckout && checkoutStep === "payment" && mpPaymentId && mpStatus === "pending") {
      checkInterval = setInterval(() => {
        checkMercadoPagoStatus(true);
      }, 4000);
    }
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [showCheckout, checkoutStep, mpPaymentId, mpStatus]);

  if (!isOpen) return null;

  // AI-Based content enrichment API triggers
  const handleAIEnhance = async () => {
    if (!title) {
      setFormError("Instrução: Por favor, digite pelo menos um título para otimizar com Inteligência Artificial.");
      return;
    }

    setAiLoading(true);
    setFormError("");
    setAiSuggestions(null);

    try {
      const response = await fetch("/api/gemini/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          condition,
          details
        })
      });

      if (!response.ok) {
        throw new Error("Erro na rede.");
      }

      const data = await response.json();
      if (data.enhancedTitle) setTitle(data.enhancedTitle);
      if (data.enhancedDescription) setDetails(data.enhancedDescription);
    } catch (err: any) {
      console.error(err);
      setFormError("⚠️ Chave de API indisponível ou limite de requisições excedido.");
    } finally {
      setAiLoading(false);
    }
  };

  // AI Pricing Suggestion
  const handleAIEstimatePrice = async () => {
    if (!title) {
      setFormError("Por favor, preencha o título antes de consultar a recomendação de preço.");
      return;
    }

    setAiLoading(true);
    setFormError("");
    setAiSuggestions(null);

    try {
      const response = await fetch("/api/gemini/price-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          condition,
          location: `${locationCity}, ${locationState}`
        })
      });

      if (!response.ok) {
        throw new Error("Erro.");
      }

      const data = await response.json();
      setAiSuggestions(data);
      if (data.recommendedPrice) {
        setPrice(data.recommendedPrice.toString());
      }
    } catch (err: any) {
      console.error(err);
      setFormError("Não foi possível gerar sugestões de valor de mercado.");
    } finally {
      setAiLoading(false);
    }
  };

  // Cycle default photo for selected active image slots
  const cycleThematicImage = () => {
    const list = STOCK_THEMATIC_IMAGES[category] || [];
    const index = Math.floor(Math.random() * list.length);
    const newImages = [...images];
    newImages[activeImageIndex] = list[index];
    setImages(newImages);
  };

  // Submit ad creation
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError("");

    if (!currentUser) {
      setFormError("Você precisa estar autenticado para postar anúncios.");
      return;
    }

    if (!title || !price || !locationCity || !details) {
      setFormError("Preencha todos os campos obrigatórios (*).");
      return;
    }

    // Direct to checkout if not paid yet
    if (adPlan !== "gratis" && !showCheckout) {
      setShowCheckout(true);
      setCheckoutStep("payment");
      return;
    }

    if (adPlan !== "gratis" && showCheckout && checkoutStep !== "confirmed") {
      setFormError("Aguarde a compensação do seu Pix para prosseguir.");
      return;
    }

    setPublishing(true);

    try {
      // Create final images array: Fallback to stock category defaults for any empty slot
      const finalImages: string[] = [];
      const stockCollection = STOCK_THEMATIC_IMAGES[category] || [];
      
      images.forEach((url, index) => {
        if (url.trim()) {
          finalImages.push(url.trim());
        } else if (index === 0) {
          // At least primary slot must have a photo
          finalImages.push(stockCollection[0]);
        }
      });

      // Parse price using robust cleaning of Brazilian Currency formatting (e.g., R$ 1.500,00 -> 1500)
      const parsedPriceVal = parseFloat(price.toString().replace(/[^\d.,]/g, "").replace(".", "").replace(",", ".")) || parseFloat(price) || 0;

      // Assemble new ad
      const newAd: Omit<Ad, "id"> = {
        title,
        description: details,
        category,
        subCategory: subCategory || undefined,
        price: parsedPriceVal,
        condition: category === "empregos" || category === "servicos" ? "nao_aplica" : condition,
        locationState,
        locationCity,
        sellerName: sellerName || currentUser.displayName || "Anunciante VivaLocal",
        sellerEmail: sellerEmail || currentUser.email || "",
        sellerPhone: sellerPhone || "(11) 99999-9999",
        sellerId: currentUser.uid,
        images: finalImages,
        videoUrl: videoUrl ? videoUrl.trim() : undefined,
        sellerPhotoUrl: sellerPhotoUrl ? sellerPhotoUrl.trim() : undefined,
        views: 0,
        featured: adPlan !== "gratis",
        planType: adPlan,
        status: "approved", // Published successfully & automatically approved/published as requested
        createdAt: Date.now(),
        tags: [
          category, 
          condition, 
          adPlan !== "gratis" ? "premiado" : "gratis",
          subCategory
        ].filter(Boolean) as string[]
      };

      // Create doc inside Firestore
      const docRef = await addDoc(collection(db, "ads"), newAd);
      await updateDoc(doc(db, "ads", docRef.id), { id: docRef.id });

      // Save payment trace if paid plan was done
      if (adPlan !== "gratis") {
        const paymentValue = planPrices[adPlan];
        const paymentPayload: Omit<PaymentLog, "id"> = {
          adId: docRef.id,
          adTitle: title,
          planType: adPlan,
          amount: paymentValue,
          payerEmail: sellerEmail || currentUser.email || "comprador@viva-local.com",
          payerName: sellerName || currentUser.displayName || "Anunciante",
          paymentMethod: selectedGateway === "mp_card" ? "cartao" : "pix",
          status: "approved",
          createdAt: Date.now()
        };
        await addDoc(collection(db, "payments"), paymentPayload);
      }

      // Sync phone
      if (sellerPhone) {
        localStorage.setItem(`viva_phone_${currentUser.uid}`, sellerPhone);
      }

      // Celebration Trigger Confetti!!
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (ce) {
        console.warn("Confetti effect failed silently", ce);
      }

      // Open Success Confirmation Overlay Screen
      setShowSuccessScreen(true);

    } catch (err: any) {
      console.error("VIVALOCAL_PUBLISH_FAIL", { error: err, payload: { title, category, price, adPlan } });
      setFormError("Ocorreu uma falha ao cadastrar seu anúncio. Motivo: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleFinishAndClose = () => {
    // Reset all form states
    setTitle("");
    setDetails("");
    setPrice("");
    setImages(["", "", "", "", ""]);
    setVideoUrl("");
    setSellerPhotoUrl("");
    setAdPlan("gratis");
    setShowCheckout(false);
    setCheckoutStep("payment");
    setShowSuccessScreen(false);

    onSuccess();
    onClose();
  };

  // Submit ad automatically when payment is approved ("confirmed")
  useEffect(() => {
    if (showCheckout && checkoutStep === "confirmed" && adPlan !== "gratis" && !publishing && !showSuccessScreen) {
      console.log("VIVALOCAL_AUTO_PUBLISHING: Payment approved, auto-submitting...");
      handleSubmit();
    }
  }, [showCheckout, checkoutStep, adPlan, publishing, showSuccessScreen]);

  // Handle success screen countdown automatic redirect
  useEffect(() => {
    let timer: any;
    if (showSuccessScreen) {
      setRedirectCountdown(3);
      timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishAndClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showSuccessScreen]);

  const activePlanPrice = planPrices[adPlan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto" id="viva-post-modal">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100 my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 select-none">
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#E52B50] uppercase">
              {showCheckout ? "PROCESSO DE COMPENSAÇÃO" : "PUBLICAR CLASSIFICADO"}
            </span>
            <h2 className="text-sm font-extrabold text-gray-900 tracking-tight mt-0.5" id="viva-post-modal-title">
              {showCheckout ? `⚡ Ativar Plano ${adPlan === "destaque_7" ? "Destaque 7 Dias" : adPlan === "destaque_30" ? "Destaque 30 Dias" : "VIP"}` : "Anunciar no VivaLocal Classificados"}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 px-1.5 bg-gray-150 hover:bg-gray-200 text-gray-500 rounded-lg cursor-pointer transition-colors"
            id="viva-post-close"
          >
            <X className="h-4 w-4 stroke-[2]" />
          </button>
        </div>

        {/* Success screen celebratory view block */}
        {showSuccessScreen ? (
          <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
            </div>

            <div className="space-y-3 max-w-md">
              <h2 className="text-xl font-black text-gray-950">🎉 Obrigado pela preferência!</h2>
              <p className="text-sm text-gray-700 leading-relaxed font-bold">
                Seu anúncio foi publicado com sucesso.
              </p>
              <div className="py-2.5 px-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-2 flex gap-2 items-center text-left">
                <Info className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-[11px] text-emerald-800 font-bold">
                  Redirecionando automaticamente para o painel de <strong>Meus Anúncios</strong> em {redirectCountdown} segundos...
                </p>
              </div>
            </div>

            <button
              onClick={handleFinishAndClose}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all w-full max-w-xs cursor-pointer"
            >
              Ir para Meus Anúncios Agora
            </button>
          </div>
        ) : showCheckout ? (
          // ================== SIMULATED AUTOMATIC CHECKOUT GATEWAY PANEL ==================
          <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col items-center justify-center text-center relative" id="viva-checkout-panel">
            
            {formError && (
              <div className="w-full max-w-md p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold text-left mb-2 animate-bounce">
                ⚠️ Erro: {formError}
              </div>
            )}

            {/* Real-time Bank Push Notification */}
            {showPushNotification && (
              <div className="absolute top-2 inset-x-4 z-55 bg-gray-950 border border-emerald-500/30 text-white rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                <div className="bg-emerald-500 text-gray-950 p-2 rounded-xl shrink-0">
                  <Bell className="h-5 w-5 animate-bounce" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[10px] font-black text-emerald-400 tracking-wider uppercase">VivaLocal Pay • Banco Central</div>
                  <p className="text-xs text-gray-200 mt-0.5 truncate">
                    PIX Recebido: <strong>R$ {activePlanPrice.toFixed(2)}</strong>. Transação compensada!
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded-md shrink-0">Agora</span>
              </div>
            )}

            {checkoutStep === "payment" ? (
              <div className="max-w-md w-full space-y-5 animate-in fade-in slide-in-from-bottom-3">
                <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl text-left">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 uppercase tracking-wider mb-1">
                    <Award className="h-4.5 w-4.5 animate-pulse" />
                    <span>Plano Ativo: {adPlan === "vip" ? "👑 VIP" : "⭐ Destaque"} • Mercado Pago Integrado</span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium">
                    Ao confirmar o pagamento com Mercado Pago, seu anúncio será destacado imediatamente no topo.
                  </p>
                </div>

                {/* Gateway Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGateway("mp_pix");
                      setMpError("");
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${selectedGateway === "mp_pix" ? "bg-[#E52B50] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    ⚡ MP Pix Online
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGateway("mp_card");
                      setMpError("");
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${selectedGateway === "mp_card" ? "bg-[#E52B50] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    💳 Cartão MP
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGateway("fake_pix")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${selectedGateway === "fake_pix" ? "bg-amber-500 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    🧪 Faux Pix (Simulação)
                  </button>
                </div>

                {selectedGateway === "mp_pix" && (
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-2xs relative">
                    {mpLoading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 rounded-2xl">
                        <RefreshCw className="h-8 w-8 text-[#E52B50] animate-spin mb-2" />
                        <span className="text-xs font-bold text-gray-600">Conectando com o Mercado Pago...</span>
                      </div>
                    )}

                    <span className="text-[10px] font-extrabold text-[#E52B50] uppercase tracking-widest flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md">
                      <span>CHAVE PÚBLICA ATIVA • PIX GERADO</span>
                    </span>

                    {mpPixQrCodeBase64 ? (
                      <div className="w-44 h-44 bg-white border-2 border-[#E52B50] rounded-2xl p-2.5 flex items-center justify-center relative shadow-md group transform hover:scale-105 transition-all">
                        <img 
                          src={`data:image/jpeg;base64,${mpPixQrCodeBase64}`}
                          alt="Mercado Pago Pix Real QR"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute -bottom-2 flex justify-center">
                          <span className="bg-[#E52B50] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider scale-95">
                            R$ {activePlanPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-44 h-44 bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-405 p-2 border border-gray-200">
                        <QrCode className="h-10 w-10 mb-2 stroke-[1.5]" />
                        <span className="text-[10px] font-bold text-center">Nenhum PIX oficial gerado. Clique abaixo em recarregar.</span>
                      </div>
                    )}

                    {mpPixQrCode && (
                      <div className="space-y-2 w-full pt-1">
                        <div className="flex justify-between items-center text-xs px-1">
                          <span className="text-gray-500 font-bold">Pix Copia e Cola Oficial:</span>
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(mpPixQrCode);
                              setPixCopiado(true);
                              setTimeout(() => setPixCopiado(false), 2000);
                            }}
                            className="text-[#E52B50] hover:text-rose-600 font-bold flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                          >
                            {pixCopiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{pixCopiado ? "Copiado!" : "Copiar Código"}</span>
                          </button>
                        </div>
                        <code className="text-[10px] bg-white border border-gray-150 px-3 py-2 rounded-xl text-gray-650 font-mono select-all block break-all font-semibold text-left max-h-16 overflow-y-auto">
                          {mpPixQrCode}
                        </code>
                      </div>
                    )}

                    {mpPaymentId && (
                      <div className="pt-2 border-t border-gray-200/60 w-full flex flex-col items-center space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-955">
                          <RefreshCw className="h-3.5 w-3.5 text-[#E52B50] animate-spin" />
                          <span>Aguardando liquidação Mercado Pago PIX...</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-500">ID: {mpPaymentId} | Status: <span className="text-[#E52B50] tracking-wide uppercase">{mpStatus}</span></span>
                        
                        <button
                          type="button"
                          onClick={() => checkMercadoPagoStatus(false)}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer"
                        >
                          🔄 Verificar Compensação Agora
                        </button>
                      </div>
                    )}

                    {mpError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-left text-[10px] text-rose-800 font-semibold leading-relaxed">
                        ⚠️ MP: {mpError}
                      </div>
                    )}
                  </div>
                )}

                {selectedGateway === "mp_card" && (
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 flex flex-col items-center space-y-5 shadow-2xs relative">
                    {mpLoading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 rounded-2xl">
                        <RefreshCw className="h-8 w-8 text-[#E52B50] animate-spin mb-2" />
                        <span className="text-xs font-bold text-gray-600">Conectando ao Checkout Pro...</span>
                      </div>
                    )}

                    <span className="text-[10px] font-extrabold text-[#E52B50] uppercase tracking-widest flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md">
                      <span>Checkout Pro • Mercado Pago Oficial</span>
                    </span>

                    <p className="text-xs text-gray-600 font-semibold">
                      Ao clicar no link abaixo, abriremos uma guia oficial segura de pagamentos do Mercado Pago para você concluir via Cartão de Crédito, Boleto ou Saldo.
                    </p>

                    {mpPreferenceUrl ? (
                      <a
                        href={mpPreferenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-blue-650 hover:bg-blue-700 active:bg-blue-805 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" /> Ir para Mercado Pago Realizar Pagamento Online (R$ {activePlanPrice.toFixed(2)})
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={initiateMercadoPagoPayment}
                        className="w-full py-3 bg-gray-205 text-gray-750 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Gerar Link de Cobrança (R$ {activePlanPrice.toFixed(2)})
                      </button>
                    )}

                    {mpPaymentId && (
                      <div className="pt-2 border-t border-gray-200/60 w-full flex flex-col items-center space-y-1.5">
                        <button
                          type="button"
                          onClick={() => checkMercadoPagoStatus(false)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-black uppercase shadow-xs hover:shadow-md transition-all cursor-pointer"
                        >
                          ✅ Já paguei! Verificar Status da Transação
                        </button>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Status atual: {mpStatus}</span>
                      </div>
                    )}

                    {mpError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-left text-[10px] text-rose-800 font-semibold leading-relaxed">
                        ⚠️ MP Setup Error: {mpError}
                      </div>
                    )}
                  </div>
                )}

                {selectedGateway === "fake_pix" && (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-md">
                      <span>Chave Pix de Simulação</span>
                    </span>
                    
                    {/* Faux QRCode Image */}
                    <div className="w-44 h-44 bg-white border-2 border-amber-500 rounded-2xl p-2.5 flex items-center justify-center relative shadow-md group transform hover:scale-105 transition-all">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=00020126360014BR.GOV.BCB.PIX0114viva-local-pago-auto-conf-plan-${adPlan}`}
                        alt="Simulated Pix QR Code"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute -bottom-2 flex justify-center">
                        <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider scale-95">
                          R$ {activePlanPrice.toFixed(2)} (Simulado)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 w-full pt-1">
                      <div className="flex justify-between items-center text-xs px-1">
                        <span className="text-gray-500 font-bold">Chave de Transferência Pix:</span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("00020126360014BR.GOV.BCB.PIX0114viva-local-pago-auto-conf");
                            setPixCopiado(true);
                            setTimeout(() => setPixCopiado(false), 2000);
                          }}
                          className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                        >
                          {pixCopiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{pixCopiado ? "Copiado!" : "Copiar Código"}</span>
                        </button>
                      </div>
                      <code className="text-[11px] bg-white border border-gray-150 px-3 py-2 rounded-xl text-gray-650 font-mono select-all block break-all font-semibold text-left">
                        00020126360014BR.GOV.BCB.PIX0114viva-local-pago-auto-conf
                      </code>
                    </div>

                    <div className="pt-3 border-t border-gray-200/60 w-full flex flex-col items-center space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                        <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
                        <span>Confirmando transação Pix em <strong className="text-sm font-black text-amber-500">{paymentTicker}s</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  {selectedGateway === "fake_pix" && (
                    <button
                      type="button"
                      onClick={() => {
                        playSuccessChime();
                        setShowPushNotification(true);
                        setCheckoutStep("confirmed");
                        setTimeout(() => setShowPushNotification(false), 4500);
                      }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold rounded-xl text-xs transition-style hover:-translate-y-0.5 active:translate-y-0.5 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      id="viva-checkout-manual-confirm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirmar PIX Simulador Manualmente</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckout(false);
                      setAdPlan("gratis");
                    }}
                    className="text-xs text-gray-500 hover:text-[#E52B50] font-semibold transition-all mt-1"
                  >
                    Voltar e escolher Plano Grátis
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-md w-full space-y-6 py-6 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-100/55 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-200 text-emerald-600">
                  <Check className="h-8 w-8 stroke-[3]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">🎉 Pagamento Simulado Compensado!</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    Nosso sistema de PIX automático detectou o recebimento da transação de <span className="text-emerald-600 font-extrabold">R$ {activePlanPrice.toFixed(2)}</span> e habilitou os destaques do plano!
                  </p>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-150 rounded-2xl p-4 text-left font-semibold space-y-1.5 text-xs text-emerald-950">
                  <div className="flex justify-between items-center text-[10px] text-emerald-800 uppercase tracking-widest font-mono border-b border-emerald-200/50 pb-1 mb-1">
                    <span>Recibo Técnico de Compensação</span>
                    <span className="bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded-sm uppercase font-extrabold text-[8px]">Pago</span>
                  </div>
                  <div>Plano Selecionado: <span className="text-emerald-700 font-bold">{adPlan.toUpperCase()} (VivaLocal Premium)</span></div>
                  <div>Valor Compensado: <span className="text-emerald-700 font-bold">R$ {activePlanPrice.toFixed(2)}</span></div>
                  <div>Sistema: <span className="text-emerald-700 font-mono text-[10px]">PIX / Mercado Pago Link</span></div>
                  <div>Transação ID: <span className="font-mono text-[10px] text-emerald-600 select-all">TX_AUTO_{Date.now().toString().slice(-6)}</span></div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmit()} 
                  disabled={publishing}
                  className="w-full py-3 bg-[#E52B50] hover:bg-rose-600 active:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  id="viva-checkout-complete-publish"
                >
                  {publishing ? "Gravando no Banco de Dados..." : `Concluir & Publicar Plano ${adPlan.toUpperCase()}`}
                </button>
              </div>
            )}
          </div>
        ) : (
          // ================== TRADITIONAL POST AD FORM BODY ==================
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Title with AI enhance trigger */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  Título do Anúncio <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAIEnhance}
                  disabled={aiLoading}
                  className="text-amber-600 hover:text-amber-700 text-xs font-bold flex items-center gap-1 border border-amber-200/60 hover:bg-amber-50 px-2.5 py-1 rounded-md transition-colors shadow-2xs pointer-events-auto cursor-pointer"
                  title="Melhorar título e conteúdo de descrição com Gemini AI"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>Otimizar anúncio com IA</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Ex: iPhone 14 Pro Max 256GB Preto Espacial Caixa e NF"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/10 placeholder:text-gray-400 font-semibold"
                id="viva-post-title"
              />
            </div>

            {/* Category / Subcategory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Categoria <span className="text-red-500">*</span></label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AdCategory)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white leading-relaxed font-semibold text-gray-705"
                  id="viva-post-category"
                >
                  {(Object.keys(CATEGORY_LABELS) as AdCategory[]).map((catKey) => (
                    <option key={catKey} value={catKey}>
                      {CATEGORY_LABELS[catKey].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Subcategoria <span className="text-gray-405">(Opcional)</span></label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white leading-relaxed font-semibold text-gray-705"
                  id="viva-post-subcategory"
                >
                  {(localStorage.getItem("viva_custom_subcategories") 
                    ? JSON.parse(localStorage.getItem("viva_custom_subcategories")!)[category] || []
                    : DEFAULT_SUBCATEGORIES[category] || []
                  ).map((subItem: string) => (
                    <option key={subItem} value={subItem}>
                      {subItem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing Section with AI Suggestion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Condition input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Estado de Conservação <span className="text-red-500">*</span></label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AdCondition)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white leading-relaxed font-semibold text-gray-705"
                  disabled={category === "empregos" || category === "servicos"}
                  id="viva-post-condition"
                >
                  <option value="usado">Usado</option>
                  <option value="novo">Novo</option>
                  <option value="nao_aplica">Não se Aplica</option>
                </select>
              </div>

              {/* Price input value */}
              <div className="space-y-1 md:col-span-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-gray-700">
                    Preço {category === "empregos" ? "Salarial Mensal (R$)" : "Preço de Venda (R$)"} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAIEstimatePrice}
                    className="text-emerald-600 hover:text-emerald-700 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Avaliar valor médio e sentimentos com Inteligência Artificial"
                  >
                    <DollarSign className="h-3 w-3" />
                    <span>Precificar com IA</span>
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">R$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Ex: 1450"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/10 placeholder:text-gray-400 font-mono font-bold text-amber-600"
                    id="viva-post-price"
                  />
                </div>
              </div>
            </div>

            {/* AI Suggestions Indicators list */}
            {aiSuggestions && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-2 animate-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                  <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider">Metas de Avaliação Sugeridas Pela IA</span>
                  <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{aiSuggestions.sentiment || "Estável"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
                  <div className="bg-white p-1.5 rounded-lg shadow-2xs border border-emerald-100">
                    <div className="text-[9px] text-gray-450 uppercase">Mínimo Estimado</div>
                    <div className="text-gray-800 mt-0.5 font-mono">R$ {aiSuggestions.minPrice}</div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg shadow-2xs border border-emerald-200">
                    <div className="text-[9px] text-emerald-805 uppercase">Recomendado</div>
                    <div className="text-emerald-650 mt-0.5 font-mono">R$ {aiSuggestions.recommendedPrice}</div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg shadow-2xs border border-emerald-100">
                    <div className="text-[9px] text-gray-450 uppercase">Máximo Estimado</div>
                    <div className="text-gray-800 mt-0.5 font-mono">R$ {aiSuggestions.maxPrice}</div>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-950/70 leading-relaxed pt-1 font-semibold">{aiSuggestions.reasoning}</p>
              </div>
            )}

            {/* City State Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Estado (UF) <span className="text-red-500">*</span></label>
                <select
                  required
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                  id="viva-post-state"
                >
                  {BRAZIL_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Cidade <span className="text-red-500">*</span></label>
                {loadingCities ? (
                  <select
                    disabled
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50 font-semibold cursor-not-allowed text-gray-400"
                  >
                    <option>Carregando cidades...</option>
                  </select>
                ) : citiesList.length > 0 ? (
                  <select
                    required
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                    id="viva-post-city"
                  >
                    {citiesList.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Digite a cidade..."
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                    id="viva-post-city"
                  />
                )}
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Descrição Detalhada do Anúncio <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={4}
                placeholder="Descreva as especificações do item, formas de entrega, estado de conservação ou termos do serviço..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/10 placeholder:text-gray-400 leading-relaxed font-semibold text-gray-700"
                id="viva-post-details"
              />
            </div>

            {/* ================== UP TO 5 IMAGES COMPREHENSIVE MANAGER ================== */}
            <div className="space-y-2.5 p-4 bg-slate-50 rounded-2xl border border-gray-150">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-gray-700 uppercase tracking-wider block">Fotos do Anúncio (Até 5 Fotos)</span>
                <span className="text-[10px] text-slate-500 font-bold">{images.filter(Boolean).length} / 5 Adicionadas</span>
              </div>
              
              {/* Photo slots bento list */}
              <div className="grid grid-cols-5 gap-2.5">
                {images.map((imgUrl, index) => {
                  const isSlotActive = index === activeImageIndex;
                  const hasImage = !!imgUrl.trim();
                  const fallbackStockCollection = STOCK_THEMATIC_IMAGES[category] || [];
                  const displayedSrc = hasImage ? imgUrl : (index === 0 ? fallbackStockCollection[0] : "");

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`aspect-square rounded-xl overflow-hidden bg-white relative flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                        isSlotActive ? "border-amber-500 ring-4 ring-amber-100/50" : hasImage ? "border-gray-300" : "border-gray-200 border-dashed hover:border-gray-300"
                      }`}
                    >
                      {displayedSrc ? (
                        <img 
                          src={displayedSrc} 
                          alt={`Slot ${index + 1}`} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Camera className="h-4.5 w-4.5" />
                          <span className="text-[8px] font-black mt-0.5">+{index + 1}</span>
                        </div>
                      )}
                      
                      {index === 0 && (
                        <span className="absolute top-1 left-1 bg-amber-500 text-white text-[6px] font-black px-1 py-0.2 rounded-xs uppercase tracking-wide">CAPA</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* URL & stock image custom triggers for active index slot */}
              <div className="p-3 bg-white rounded-xl border border-gray-150 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-650 uppercase">Configurar Foto #{activeImageIndex + 1} Selected</span>
                  <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">Slot #{activeImageIndex + 1}</span>
                </div>
                
                <div className="space-y-1">
                  <input
                    type="url"
                    placeholder="Cole aqui a URL da imagem (Ex: https://imagens.com/foto.jpg)"
                    value={images[activeImageIndex]}
                    onChange={(e) => {
                      const newImages = [...images];
                      newImages[activeImageIndex] = e.target.value;
                      setImages(newImages);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400 font-semibold">Ou preencha com fotos inteligentes do viva:</span>
                  <button
                    type="button"
                    onClick={cycleThematicImage}
                    className="text-amber-600 hover:text-amber-700 font-extrabold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3 shrink-0" />
                    <span>Usar foto randômica</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Video link options (paid plans only) */}
            <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-gray-150">
              <div className="flex items-center justify-between text-xs">
                <label className="font-extrabold text-gray-700 flex items-center gap-1">
                  <Video className="h-4 w-4 text-[#E52B50]" />
                  <span>Vídeo do Anúncio (YouTube ou Vimeo)</span>
                </label>
                {adPlan === "gratis" && (
                  <span className="bg-red-50 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">BLOQUEADO</span>
                )}
              </div>
              
              {adPlan === "gratis" ? (
                <p className="text-[10px] text-red-800 bg-red-50 p-2 rounded-xl border border-red-100 font-semibold">
                  ⚠️ Adicionar vídeos é um privilégio exclusivo dos planos <strong>Destaque</strong> ou <strong>VIP</strong>. Mude seu plano abaixo para habilitar!
                </p>
              ) : (
                <div className="space-y-1">
                  <input 
                    type="url" 
                    placeholder="Ex: https://www.youtube.com/watch?v=VIDEO_ID"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#E52B50] focus:border-[#E52B50] bg-white font-semibold"
                  />
                  <p className="text-[9px] text-slate-450 leading-relaxed font-semibold">Insira um link do YouTube ou do Vimeo do seu produto/imóvel/serviço.</p>
                </div>
              )}
            </div>

            {/* VIP profile photo (VIP plan only) */}
            <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-gray-150">
              <div className="flex items-center justify-between text-xs">
                <label className="font-extrabold text-gray-700 flex items-center gap-1">
                  <User className="h-4 w-4 text-amber-500" />
                  <span>Avatar do Anunciante (Disponível apenas no VIP)</span>
                </label>
                {adPlan !== "vip" && (
                  <span className="bg-amber-50 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">MÁXIMO VIP ONLY</span>
                )}
              </div>
              
              {adPlan !== "vip" ? (
                <p className="text-[10px] text-amber-800 bg-amber-50 p-2   rounded-xl border border-amber-100 font-semibold">
                  👑 Estampar sua foto de perfil do anunciante para gerar 15x mais autoridade e confiança é exclusivo do <strong>Plano VIP</strong>.
                </p>
              ) : (
                <div className="space-y-1">
                  <input 
                    type="url" 
                    placeholder="Insira URL da sua foto (Ex: https://minhafoto.com/perfil.jpg)"
                    value={sellerPhotoUrl}
                    onChange={(e) => setSellerPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl focus:ring-1 focus:ring-amber-500 bg-white font-semibold"
                  />
                  <p className="text-[9px] text-slate-450 leading-relaxed font-semibold">Pressione VIP abaixo e insira o link direto do seu avatar/foto de perfil.</p>
                </div>
              )}
            </div>

            {/* ================== FOUR RECONFIGURED REGISTER PLANS PLATES ================== */}
            <div className="space-y-3.5 p-4 bg-[#1C2C54]/5 rounded-2xl border border-[#1C2C54]/15">
              <span className="text-xs font-black text-[#1C2C54] uppercase tracking-wider block">Escolha seu Plano de Publicação</span>
              
              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Plano Gratuito */}
                <label 
                  className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    adPlan === "gratis" 
                      ? "bg-white border-lime-650 ring-2 ring-lime-100 text-gray-901" 
                      : "bg-white/80 border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="adPlan" 
                    value="gratis" 
                    checked={adPlan === "gratis"}
                    onChange={() => setAdPlan("gratis")}
                    className="mt-1 accent-[#1C2C54]"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span className="text-[#122244] font-black">Plano Gratuito</span>
                      <span className="bg-gray-100 text-gray-700 text-[8px] font-black px-2 py-0.5 rounded-sm">R$ 0,00</span>
                    </div>
                    <p className="text-[10px] text-gray-450 leading-relaxed mt-0.5">
                      Até 5 fotos por anúncio. Sem vídeo, publicação simples reordenada conforme novos anúncios aparecem.
                    </p>
                  </div>
                </label>

                {/* 2. Destaque 7 dias */}
                <label 
                  className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    adPlan === "destaque_7" 
                      ? "bg-rose-50/50 border-rose-500 ring-2 ring-rose-100 text-rose-950" 
                      : "bg-white/80 border-gray-200 text-gray-500 hover:border-rose-300"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="adPlan" 
                    value="destaque_7" 
                    checked={adPlan === "destaque_7"}
                    onChange={() => setAdPlan("destaque_7")}
                    className="mt-1 accent-rose-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span className="text-rose-900 font-extrabold flex items-center gap-1">⭐ Destaque 7 Dias</span>
                      <span className="bg-rose-100 text-rose-800 text-[8px] font-black px-2 py-0.5 rounded-sm">R$ {planPrices["destaque_7"].toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-rose-900/60 leading-relaxed mt-0.5">
                      Até 5 fotos + 1 vídeo. Exibição com selo &ldquo;Destaque&rdquo;, aparecendo prioritariamente por cima dos gratuitos por 7 dias.
                    </p>
                  </div>
                </label>

                {/* 3. Destaque 30 dias */}
                <label 
                  className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    adPlan === "destaque_30" 
                      ? "bg-blue-50/55 border-blue-500 ring-2 ring-blue-100 text-blue-950" 
                      : "bg-white/80 border-gray-200 text-gray-500 hover:border-blue-300"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="adPlan" 
                    value="destaque_30" 
                    checked={adPlan === "destaque_30"}
                    onChange={() => setAdPlan("destaque_30")}
                    className="mt-1 accent-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span className="text-blue-900 font-extrabold flex items-center gap-1">⭐ Destaque 30 Dias</span>
                      <span className="bg-blue-100 text-blue-800 text-[8px] font-black px-2 py-0.5 rounded-sm">R$ {planPrices["destaque_30"].toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-blue-900/60 leading-relaxed mt-0.5">
                      Até 5 fotos + 1 vídeo. Selo de Destaque Premium, permanecendo tracionado acima de anúncios comuns por 30 dias.
                    </p>
                  </div>
                </label>

                {/* 4. Plano VIP */}
                <label 
                  className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    adPlan === "vip" 
                      ? "bg-amber-50/70 border-amber-500 ring-2 ring-amber-100/60 text-amber-950 shadow-[0_4px_12px_rgba(245,158,11,0.15)]" 
                      : "bg-white/80 border-gray-200 text-gray-500 hover:border-amber-300"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="adPlan" 
                    value="vip" 
                    checked={adPlan === "vip"}
                    onChange={() => setAdPlan("vip")}
                    className="mt-1 accent-amber-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span className="text-amber-800 font-black flex items-center gap-1">🏆 Plano VIP Máximo</span>
                      <span className="bg-amber-150 text-amber-900 text-[8px] font-black px-2 py-0.5 rounded-sm border border-amber-300">R$ {planPrices["vip"].toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-amber-900/60 leading-relaxed mt-0.5 font-semibold">
                      Até 5 fotos + 1 vídeo + foto de perfil. Selo VIP dourado e exibição prioritária no topo do site, pesquisas e categorias.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 p-4 bg-amber-50/20 rounded-xl border border-amber-100">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-widest">Informações de Contato</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Seller Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">Seu Nome <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Nome de exibição"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-white"
                    id="viva-post-sellername"
                  />
                </div>

                {/* Seller Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">WhatsApp / Telefone <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: (11) 99888-7766"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-white"
                    id="viva-post-sellerphone"
                  />
                </div>

                {/* Seller Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">E-mail <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="Seu e-mail cadastrado"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-white"
                    id="viva-post-selleremail"
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Modal Submit Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0 bg-gray-50/50 select-none">
          <button
            type="button"
            onClick={showCheckout ? () => setShowCheckout(false) : onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            id="viva-post-cancel"
          >
            {showCheckout && checkoutStep === "payment" ? "Voltar ao Formulário" : "Cancelar"}
          </button>
          
          {!showCheckout && !showSuccessScreen && (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={publishing || aiLoading}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-gray-950 font-black rounded-lg text-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              id="viva-post-submit"
            >
              {publishing ? "Processando..." : adPlan !== "gratis" ? `Contratar Plano VIP/Destaque (R$ ${activePlanPrice.toFixed(2)})` : "Publicar Anúncio Agora"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export { STOCK_THEMATIC_IMAGES };

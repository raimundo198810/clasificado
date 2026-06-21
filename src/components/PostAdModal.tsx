import React, { useState } from "react";
import { X, Sparkles, HelpCircle, Check, DollarSign, Camera, RefreshCw, Copy, Bell, QrCode, Award, CheckCircle2 } from "lucide-react";
import { Ad, AdCategory, AdCondition, UserProfile } from "../types";
import { CATEGORY_LABELS } from "../lib/initialSeed";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

interface PostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSuccess: () => void;
}

const STOCK_THEMATIC_IMAGES: Record<AdCategory, string[]> = {
  imoveis: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800"
  ],
  veiculos: [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800"
  ],
  compra_venda: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
  ],
  empregos: [
    "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800"
  ],
  servicos: [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800"
  ],
  comunidade: [
    "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800"
  ],
  adulto: [
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1501901604258-fc48048f4a3c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800"
  ]
};

export default function PostAdModal({ isOpen, onClose, currentUser, onSuccess }: PostAdModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<AdCategory>("compra_venda");
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

  // Paid Ads Features States
  const [adPlan, setAdPlan] = useState<"gratis" | "premium">("gratis");
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"payment" | "confirmed">("payment");
  const [simulatedPaymentType, setSimulatedPaymentType] = useState<"pix" | "cartao">("pix");
  const [paymentTicker, setPaymentTicker] = useState(3);
  const [isConfirmingAuto, setIsConfirmingAuto] = useState(false);
  
  // High fidelity Pix indicators
  const [pixCopiado, setPixCopiado] = useState(false);
  const [showPushNotification, setShowPushNotification] = useState(false);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    minPrice?: number;
    maxPrice?: number;
    recommendedPrice?: number;
    sentiment?: string;
    reasoning?: string;
  } | null>(null);

  // Custom Image URL or thematic choice
  const [imageUrl, setImageUrl] = useState("");
  const [thematicImageIndex, setThematicImageIndex] = useState(0);

  const [formError, setFormError] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Sound Synth Generator for modern 3D UI response
  const playSuccessChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Note 1 (C5, warm bell)
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

      // Note 2 (E5, major harmony) after a tiny delay
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
        } catch (e) {
          console.warn(e);
        }
      }, 100);
    } catch (e) {
      console.warn("WebAudio disabled or blocked by browser gesture permissions", e);
    }
  };

  // Auto-confirmation effect for simulate payment
  React.useEffect(() => {
    let interval: any;
    if (showCheckout && checkoutStep === "payment" && simulatedPaymentType === "pix") {
      setPaymentTicker(4); // 4 seconds total
      interval = setInterval(() => {
        setPaymentTicker((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsConfirmingAuto(true);
            setTimeout(() => {
              // Trigger Chime
              playSuccessChime();
              // Trigger push notification banner
              setShowPushNotification(true);
              setCheckoutStep("confirmed");
              setIsConfirmingAuto(false);
              
              // auto hide push notification after 4.5 seconds
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
  }, [showCheckout, checkoutStep, simulatedPaymentType]);

  if (!isOpen) return null;

  // AI-Based content enrichment API triggers
  const handleAIEnhance = async () => {
    if (!title) {
      setFormError("Por favor, digite pelo menos um título para que a IA possa otimizar seu anúncio.");
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
        throw new Error("Erro na solicitação da API.");
      }

      const data = await response.json();
      if (data.enhancedTitle) setTitle(data.enhancedTitle);
      if (data.enhancedDescription) setDetails(data.enhancedDescription);
    } catch (err: any) {
      console.error(err);
      setFormError("Não foi possível conectar ao assistente de IA. Certifique-se de carregar sua chave de API.");
    } finally {
      setAiLoading(false);
    }
  };

  // AI-Based Pricing suggest assessment
  const handleAIEstimatePrice = async () => {
    if (!title) {
      setFormError("Por favor, preencha o título antes de consultar a avaliação de preço.");
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
        throw new Error("Erro na solicitação.");
      }

      const data = await response.json();
      setAiSuggestions(data);
      if (data.recommendedPrice) {
        setPrice(data.recommendedPrice.toString());
      }
    } catch (err: any) {
      console.error(err);
      setFormError("Não foi possível carregar a estimativa de preço pela IA. Tente preencher manualmente.");
    } finally {
      setAiLoading(false);
    }
  };

  const cycleThematicImage = () => {
    const list = STOCK_THEMATIC_IMAGES[category] || [];
    setThematicImageIndex((prev) => (prev + 1) % list.length);
  };

  // Submit ad
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!currentUser) {
      setFormError("Você precisa estar logado para publicar um anúncio.");
      return;
    }

    if (!title || !price || !locationCity || !details) {
      setFormError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Direct to payment checkout if it's premium and not paid yet
    if (adPlan === "premium" && !showCheckout) {
      setShowCheckout(true);
      setCheckoutStep("payment");
      return;
    }

    // Validate that if showing checkout, it has to be confirmed
    if (adPlan === "premium" && showCheckout && checkoutStep !== "confirmed") {
      setFormError("Por favor, aguarde a confirmação automática do pagamento para prosseguir.");
      return;
    }

    setPublishing(true);

    try {
      // Determine image to attach (priority: user input URL else stock thematic image)
      const stockCollection = STOCK_THEMATIC_IMAGES[category] || [];
      const imageToApply = imageUrl.trim() || stockCollection[thematicImageIndex] || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800";

      const newAd: Omit<Ad, "id"> = {
        title,
        description: details,
        category,
        price: parseFloat(price) || 0,
        condition: category === "empregos" || category === "servicos" ? "nao_aplica" : condition,
        locationState,
        locationCity,
        sellerName: sellerName || currentUser.displayName || "Anunciante VivaLocal",
        sellerEmail: sellerEmail || currentUser.email || "",
        sellerPhone: sellerPhone || "(11) 99999-9999",
        sellerId: currentUser.uid,
        images: [imageToApply],
        views: 0,
        featured: adPlan === "premium", // true for paid premium ads!
        createdAt: Date.now(),
        tags: [category, condition, adPlan === "premium" ? "premium" : "gratis"].filter(Boolean) as string[]
      };

      // Add to Firestore database
      const docRef = await addDoc(collection(db, "ads"), newAd);
      await updateDoc(doc(db, "ads", docRef.id), { id: docRef.id });

      // Save phone backup in localStorage
      if (sellerPhone) {
        localStorage.setItem(`viva_phone_${currentUser.uid}`, sellerPhone);
      }

      // Reset states
      setAdPlan("gratis");
      setShowCheckout(false);
      setCheckoutStep("payment");

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError("Erro ao publicar anúncio no banco de dados. " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto" id="viva-post-modal">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100 my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {showCheckout ? "⚡ Pagamento do Anúncio Pago" : "Anunciar no VivaLocal"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {showCheckout 
                ? "Conclua seu PIX simulado para confirmar o destaque de topo automaticamente."
                : "Crie seu anúncio classificado e conte com o auxílio da nossa Inteligência Artificial integrada."
              }
            </p>
          </div>
          <button 
            id="viva-post-close"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {showCheckout ? (
          // ================== SIMULATED AUTOMATIC CHECKOUT GATEWAY PANEL ==================
          <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col items-center justify-center text-center relative" id="viva-checkout-panel">
            
            {/* Sliding Real-time Bank Push Notification Indicator */}
            {showPushNotification && (
              <div className="absolute top-2 inset-x-4 z-55 bg-gray-950 border border-emerald-500/30 text-white rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                <div className="bg-emerald-500 text-gray-950 p-2 rounded-xl shrink-0">
                  <Bell className="h-5 w-5 animate-bounce" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[10px] font-black text-emerald-400 tracking-wider uppercase">VivaLocal Pay • Banco Central</div>
                  <p className="text-xs text-gray-200 mt-0.5 truncate">
                    PIX Recebido: <strong>R$ 14,90</strong>. Transação compensada e ativa!
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded-md shrink-0">Agora</span>
              </div>
            )}

            {checkoutStep === "payment" ? (
              <div className="max-w-md w-full space-y-5 animate-in fade-in slide-in-from-bottom-3">
                <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl text-left">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#E52B50] uppercase tracking-wider mb-1">
                    <Award className="h-4.5 w-4.5 animate-pulse" />
                    <span>Destaque Premium Selecionado</span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium">
                    Seu anúncio ficará fixado no topo de sua categoria com borda dourada e atrairá até 10 vezes mais visitas imediatas dos usuários.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <QrCode className="h-3.5 w-3.5 text-[#E52B50]" />
                    <span>Pague com o Pix Imediato</span>
                  </span>
                  
                  {/* Faux QRCode Image with 3D gradient borders */}
                  <div className="w-44 h-44 bg-white border-2 border-[#E52B50] rounded-2xl p-2.5 flex items-center justify-center relative shadow-md group transform hover:scale-105 transition-all">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=00020126360014BR.GOV.BCB.PIX0114viva-local-pago-auto-conf"
                      alt="Pix QR Code"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute -bottom-2 flex justify-center">
                      <span className="bg-[#E52B50] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider scale-95">
                        R$ 14,90
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 w-full pt-1">
                    <div className="flex justify-between items-center text-xs px-1">
                      <span className="text-gray-500 font-bold">Chave de Pagamento Pix:</span>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("00020126360014BR.GOV.BCB.PIX0114viva-local-pago-auto-conf");
                          setPixCopiado(true);
                          setTimeout(() => setPixCopiado(false), 2000);
                        }}
                        className="text-[#E52B50] hover:text-rose-600 font-bold flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                      >
                        {pixCopiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{pixCopiado ? "Copiado!" : "Copiar Código"}</span>
                      </button>
                    </div>
                    <code className="text-[11px] bg-white border border-gray-150 px-3 py-2 rounded-xl text-gray-600 font-mono select-all block break-all font-semibold text-left">
                      00020126360014BR.GOV.BCB.PIX0114viva-local-pago-auto-conf
                    </code>
                  </div>

                  {/* High Tech Confirmation Progress tracker list */}
                  <div className="pt-3 border-t border-gray-200/60 w-full flex flex-col items-center space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
                      <RefreshCw className="h-4 w-4 text-[#E52B50] animate-spin" />
                      <span>Confirmando PIX em <strong className="text-sm font-black text-[#E52B50]">{paymentTicker}s</strong></span>
                    </div>
                    
                    <div className="flex gap-4 text-[9px] text-gray-400 font-bold uppercase tracking-wider pt-1">
                      <span className="text-emerald-500 flex items-center gap-0.5">● Gerado</span>
                      <span className="text-[#E52B50] animate-pulse flex items-center gap-0.5">● Escaneando</span>
                      <span className={isConfirmingAuto ? "text-amber-500 animate-pulse" : "text-gray-300"}>● Liquidando</span>
                    </div>

                    {isConfirmingAuto && (
                      <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
                        Processando transações junto ao COPOM...
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSuccessChime();
                      setShowPushNotification(true);
                      setCheckoutStep("confirmed");
                      setTimeout(() => setShowPushNotification(false), 4500);
                    }}
                    className="w-full py-3 bg-[#E52B50] hover:bg-rose-600 active:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    id="viva-checkout-manual-confirm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pular Espera e Confirmar PIX Manualmente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckout(false);
                      setAdPlan("gratis");
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline font-semibold transition-all mt-1"
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
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">🎉 Pagamento Confirmado com Sucesso!</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    Nosso sistema de PIX automático detectou o recebimento da transação de <span className="text-[#E52B50] font-black">R$ 14,90</span> e habilitou o destaque de topo imediatamente!
                  </p>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-150 rounded-2xl p-4 text-left font-semibold space-y-1.5 text-xs text-emerald-950">
                  <div className="flex justify-between items-center text-[10px] text-emerald-800 uppercase tracking-widest font-mono border-b border-emerald-200/50 pb-1 mb-1">
                    <span>Recibo Técnico de Compensação</span>
                    <span className="bg-emerald-250 text-emerald-950 px-1.5 py-0.5 rounded-sm uppercase font-extrabold text-[8px]">Pago</span>
                  </div>
                  <div>Plano: <span className="text-emerald-700 font-bold">Destaque de Topo Semanal (VivaLocal Premium)</span></div>
                  <div>Valor: <span className="text-emerald-700 font-bold">R$ 14,90</span></div>
                  <div>Banco Autenticador: <span className="text-emerald-700 font-mono text-[10px]">Banco Central do Brasil / PIX</span></div>
                  <div>Transação ID: <span className="font-mono text-[10px] text-emerald-600 select-all">TX_AUTO_{Date.now().toString().slice(-6)}</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit} // will now actually create the ad on Firestore with featured: true
                  disabled={publishing}
                  className="w-full py-3 bg-[#E52B50] hover:bg-rose-600 active:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  id="viva-checkout-complete-publish"
                >
                  {publishing ? "Gravando no Banco de Dados..." : "Concluir & Publicar Anúncio com Destaque"}
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
                  className="text-amber-600 hover:text-amber-700 text-xs font-bold flex items-center gap-1 border border-amber-200/60 hover:bg-amber-50 px-2.5 py-1 rounded-md transition-colors shadow-2xs pointer-events-auto"
                  title="Melhorar título e conteúdo de descrição com Gemini AI"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>Otimizar anúncio com IA</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Ex: iPhone 14 Pro Max Preto Espacial 256GB Impecável"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/10 placeholder:text-gray-400"
                id="viva-post-title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Categoria <span className="text-red-500">*</span></label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as AdCategory);
                    setThematicImageIndex(0);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  id="viva-post-category"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Condição do Item</label>
                <select
                  value={condition}
                  disabled={category === "empregos" || category === "servicos"}
                  onChange={(e) => setCondition(e.target.value as AdCondition)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  id="viva-post-condition"
                >
                  <option value="usado">Usado / Seminovo</option>
                  <option value="novo">Novo / Lacrado</option>
                  <option value="nao_aplica">Não Se Aplica</option>
                </select>
              </div>
            </div>

            {/* Pricing Row with AI Estimation trigger */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  Preço ou Rendimento (R$) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAIEstimatePrice}
                  disabled={aiLoading}
                  className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 border border-indigo-200/60 hover:bg-indigo-50 px-2.5 py-1 rounded-md transition-colors shadow-2xs pointer-events-auto"
                  title="Consultar avaliação de preço ou salário estimado baseado no mercado atual"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Sugerir preço por IA</span>
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-semibold">R$</span>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  placeholder="Ex: 1450.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-505 bg-gray-50/10 placeholder:text-gray-400"
                  id="viva-post-price"
                />
              </div>

              {/* AI suggestion panel */}
              {aiSuggestions && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1 my-1">
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                    <span>📈 Estimativa VivaLocal de Mercado Inteligente</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-sm uppercase">{aiSuggestions.sentiment}</span>
                  </div>
                  <div className="text-xs text-indigo-950 font-medium font-mono">
                    Sugerido: R$ {aiSuggestions.minPrice} - R$ {aiSuggestions.maxPrice} | Ideal: <span className="text-bold text-indigo-700">R$ {aiSuggestions.recommendedPrice}</span>
                  </div>
                  {aiSuggestions.reasoning && (
                    <p className="text-[10px] text-indigo-600 leading-relaxed italic">{aiSuggestions.reasoning}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location State */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Estado <span className="text-red-500">*</span></label>
                <select
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  id="viva-post-state"
                >
                  <option value="SP">São Paulo (SP)</option>
                  <option value="RJ">Rio de Janeiro (RJ)</option>
                  <option value="MG">Minas Gerais (MG)</option>
                  <option value="PR">Paraná (PR)</option>
                  <option value="RS">Rio Grande do Sul (RS)</option>
                  <option value="BA">Bahia (BA)</option>
                  <option value="CE">Ceará (CE)</option>
                </select>
              </div>

              {/* Location City */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Cidade <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Campinas / Copacabana"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/10 placeholder:text-gray-400"
                  id="viva-post-city"
                />
              </div>
            </div>

            {/* Ad description details */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Descrição Detalhada do Anúncio <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={4}
                placeholder="Descreva as especificações do item, formas de entrega, estado de conservação ou termos do serviço..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-gray-50/10 placeholder:text-gray-450 leading-relaxed"
                id="viva-post-details"
              />
            </div>

            {/* Image visual attachments */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-150">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Foto do Anúncio</span>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Photo preview block */}
                <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-200 relative flex items-center justify-center border border-gray-300">
                  <img
                    src={imageUrl.trim() || (STOCK_THEMATIC_IMAGES[category] || [])[thematicImageIndex]}
                    alt="Anúncio visual"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-xs">
                    Prévia
                  </span>
                </div>

                {/* URL or Stock picker */}
                <div className="flex-1 space-y-2">
                  <div className="space-y-0.5">
                    <label className="text-[11px] font-semibold text-gray-500">Insira URL da Imagem (Opcional):</label>
                    <input
                      type="url"
                      placeholder="https://exemplo/minha-foto.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white placeholder:text-gray-400"
                      id="viva-post-imageurl"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Ou use nossa foto de categoria inteligente:</span>
                    <button
                      type="button"
                      onClick={cycleThematicImage}
                      className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer pointer-events-auto"
                      title="Alternar imagens de banco padrão"
                    >
                      <RefreshCw className="h-3 w-3 shrink-0" />
                      <span>Mudar foto padrão</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AD PLAN TYPE SELECTOR */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl space-y-3" id="viva-post-plans">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-widest">Escolha a Visibilidade do Anúncio</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Free Plan option */}
                <label 
                  className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    adPlan === "gratis" 
                      ? "bg-white border-gray-400 ring-2 ring-gray-200 text-gray-900" 
                      : "bg-white/80 border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="adPlan" 
                    value="gratis" 
                    checked={adPlan === "gratis"}
                    onChange={() => setAdPlan("gratis")}
                    className="mt-1 accent-gray-700 text-gray-700 focus:ring-gray-400"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>Anúncio Grátis</span>
                      <span className="bg-gray-100 text-gray-600 text-[8px] font-bold px-1.5 py-0.5 rounded-sm">R$ 0,00</span>
                    </div>
                    <p className="text-[10px] text-gray-450 leading-relaxed mt-1">
                      Posicionamento normal nos resultados por data de criação.
                    </p>
                  </div>
                </label>

                {/* Premium Featured Plan option */}
                <label 
                  className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    adPlan === "premium" 
                      ? "bg-amber-50/50 border-amber-500 ring-2 ring-amber-100/60 text-amber-950" 
                      : "bg-white/85 border-gray-200 text-gray-500 hover:border-amber-300 hover:bg-amber-50/5"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="adPlan" 
                    value="premium" 
                    checked={adPlan === "premium"}
                    onChange={() => setAdPlan("premium")}
                    className="mt-1 accent-amber-500 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-xs font-extrabold flex items-center gap-1">
                      <span className="text-amber-800">Destaque Premium Paid</span>
                      <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-sm">R$ 14,90</span>
                    </div>
                    <p className="text-[10px] text-amber-900/70 leading-relaxed mt-1">
                      Fica no topo, ganha moldura dourada e gera até 10x mais contatos no PIX!
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
                  <label className="text-[11px] font-bold text-gray-600">Telefone para Contato <span className="text-red-500">*</span></label>
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
                  <label className="text-[11px] font-bold text-gray-600">E-mail para Retorno <span className="text-red-500">*</span></label>
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
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            id="viva-post-cancel"
          >
            {showCheckout && checkoutStep === "payment" ? "Voltar ao Formulário" : "Cancelar"}
          </button>
          
          {!showCheckout && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={publishing || aiLoading}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-lg text-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              id="viva-post-submit"
            >
              {adPlan === "premium" ? "Prosseguir para Pagamento (R$ 14,90)" : publishing ? "Publicando..." : "Publicar Anúncio Agora"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export { STOCK_THEMATIC_IMAGES };

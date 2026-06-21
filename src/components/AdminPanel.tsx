import React, { useState, useEffect } from "react";
import { 
  X, 
  Settings, 
  Layers, 
  Coins, 
  TrendingUp, 
  Check, 
  Trash2, 
  AlertCircle, 
  TrendingDown, 
  Tag, 
  BarChart3, 
  Play, 
  Calendar, 
  CheckCircle, 
  User, 
  ChevronRight, 
  Plus,
  RefreshCw
} from "lucide-react";
import { Ad, AdCategory, PaymentLog } from "../types";
import { CATEGORY_LABELS } from "../lib/initialSeed";
import { collection, getDocs, updateDoc, doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_SUBCATEGORIES } from "./PostAdModal";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  allAds: Ad[];
}

export default function AdminPanel({ isOpen, onClose, allAds }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "ads" | "plans" | "categories" | "payments">("stats");
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // States for Plan pricing updates
  const [planPrices, setPlanPrices] = useState<Record<string, number>>({
    gratis: 0,
    destaque_7: 20,
    destaque_30: 35,
    vip: 49.90
  });

  // State for Custom Subcategories management
  const [customSubcategories, setCustomSubcategories] = useState<Record<string, string[]>>({});
  const [selectedSubCatCategory, setSelectedSubCatCategory] = useState<AdCategory>("compra_venda");
  const [newSubCategoryInput, setNewSubCategoryInput] = useState("");

  // Statistics summaries
  const [simulatedViewsCount, setSimulatedViewsCount] = useState(4820);

  // Load custom values on init
  useEffect(() => {
    if (isOpen) {
      // Load custom subcategories
      const savedSubs = localStorage.getItem("viva_custom_subcategories");
      if (savedSubs) {
        try {
          setCustomSubcategories(JSON.parse(savedSubs));
        } catch (e) {
          console.error("Error loading custom subs", e);
        }
      } else {
        setCustomSubcategories(DEFAULT_SUBCATEGORIES);
      }

      // Load custom plans
      const savedPrices = localStorage.getItem("viva_plan_prices");
      if (savedPrices) {
        try {
          setPlanPrices(JSON.parse(savedPrices));
        } catch (e) {
          console.error("Error loading plan prices", e);
        }
      } else {
        const defaults = { gratis: 0, destaque_7: 20, destaque_30: 35, vip: 49.90 };
        setPlanPrices(defaults);
        localStorage.setItem("viva_plan_prices", JSON.stringify(defaults));
      }

      // Sync and load payments logged in Firestore
      setLoadingPayments(true);
      const unsubscribe = onSnapshot(collection(db, "payments"), (snapshot) => {
        const list: PaymentLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as PaymentLog);
        });
        // Sort newest payments first
        list.sort((a, b) => b.createdAt - a.createdAt);
        setPayments(list);
        setLoadingPayments(false);
      }, (err) => {
        console.error("Error watching payments:", err);
        setLoadingPayments(false);
      });

      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Plan Prices updates
  const handleUpdatePrice = (plan: string, val: string) => {
    const num = parseFloat(val);
    const updated = { ...planPrices, [plan]: isNaN(num) ? 0 : num };
    setPlanPrices(updated);
    localStorage.setItem("viva_plan_prices", JSON.stringify(updated));
    
    // Dispatch general price change trigger so PostAd modal can update dynamically
    window.dispatchEvent(new Event("viva_pricing_changed"));
  };

  // Add subcategory
  const handleAddSubcategory = () => {
    if (!newSubCategoryInput.trim()) return;
    const list = customSubcategories[selectedSubCatCategory] || [];
    if (list.includes(newSubCategoryInput.trim())) return;

    const updated = {
      ...customSubcategories,
      [selectedSubCatCategory]: [...list, newSubCategoryInput.trim()]
    };

    setCustomSubcategories(updated);
    localStorage.setItem("viva_custom_subcategories", JSON.stringify(updated));
    setNewSubCategoryInput("");
    
    // Dispatch custom event to notify categories loaded components
    window.dispatchEvent(new Event("viva_subcategories_changed"));
  };

  // Delete subcategory
  const handleDeleteSubcategory = (cat: string, sub: string) => {
    const list = customSubcategories[cat] || [];
    const updated = {
      ...customSubcategories,
      [cat]: list.filter(item => item !== sub)
    };

    setCustomSubcategories(updated);
    localStorage.setItem("viva_custom_subcategories", JSON.stringify(updated));
    
    // Dispatch custom event
    window.dispatchEvent(new Event("viva_subcategories_changed"));
  };

  // Approve Ad System
  const handleApproveAd = async (adId: string) => {
    try {
      const adDocRef = doc(db, "ads", adId);
      await updateDoc(adDocRef, { status: "approved" });
    } catch (err) {
      console.error("Failed to approve ad in firestore:", err);
    }
  };

  // Decline/Remove Ad from Firestore
  const handleRemoveAd = async (adId: string) => {
    if (window.confirm("Você tem certeza de que deseja remover e excluir este anúncio permanentemente?")) {
      try {
        await deleteDoc(doc(db, "ads", adId));
      } catch (err) {
        console.error("Failed to delete ad in firestore:", err);
      }
    }
  };

  // Computation of statistics
  const pendingAds = allAds.filter(ad => ad.status === "pending");
  const approvedAds = allAds.filter(ad => ad.status === "approved");
  const vipCount = allAds.filter(ad => ad.planType === "vip" && ad.status === "approved").length;
  const destaque30Count = allAds.filter(ad => ad.planType === "destaque_30" && ad.status === "approved").length;
  const destaque7Count = allAds.filter(ad => ad.planType === "destaque_7" && ad.status === "approved").length;
  const gratisCount = allAds.filter(ad => ad.planType === "gratis" && ad.status === "approved").length;

  // Sum total payments received
  const totalArrecadado = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs overflow-y-auto" id="viva-admin-modal">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 text-slate-100 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner header with premium administrative tone */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 py-3.5 px-6 flex justify-between items-center select-none shrink-0 border-b border-amber-450">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 rounded-md bg-black/20 text-white font-black text-xs uppercase tracking-wider">MODERADOR</span>
            <h2 className="text-sm font-black text-gray-950 uppercase tracking-widest flex items-center gap-1.5">
              👑 PAINEL DE CONTROLE ADMINISTRATIVO VIVALOCAL
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 bg-black/10 hover:bg-black/20 text-gray-900 hover:text-black rounded-lg transition-transform duration-150 active:scale-95 cursor-pointer"
            id="viva-admin-close"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Controls Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 shrink-0 scrollbar-none overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all outline-hidden cursor-pointer ${activeTab === "stats" ? "bg-slate-900 text-amber-500 border-b-2 border-amber-500" : "text-slate-400 hover:text-slate-200"}`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Resumo</span>
          </button>
          
          <button
            onClick={() => setActiveTab("ads")}
            className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all outline-hidden cursor-pointer ${activeTab === "ads" ? "bg-slate-900 text-amber-500 border-b-2 border-amber-500" : "text-slate-400 hover:text-slate-200"}`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Moderação ({pendingAds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all outline-hidden cursor-pointer ${activeTab === "plans" ? "bg-slate-900 text-amber-500 border-b-2 border-amber-500" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Preços Planos</span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all outline-hidden cursor-pointer ${activeTab === "categories" ? "bg-slate-900 text-amber-500 border-b-2 border-amber-500" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Subcategorias</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all outline-hidden cursor-pointer ${activeTab === "payments" ? "bg-slate-900 text-amber-500 border-b-2 border-amber-500" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Pagamentos ({payments.length})</span>
          </button>
        </div>

        {/* Tab Contents Frame */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/90 text-slate-100">
          
          {/* A) STATS RESUMO TAB */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-widest mb-4">Estatísticas Gerais do Sistema</h3>
              
              {/* Stat Tiles row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total payments collected tile */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Arrecadado PIX</span>
                    <h4 className="text-lg font-black text-emerald-400 mt-0.5">{formatCurrency(totalArrecadado)}</h4>
                  </div>
                </div>

                {/* Approved ads count tile */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Anúncios Ativos</span>
                    <h4 className="text-lg font-black text-amber-400 mt-0.5">{approvedAds.length} anúncios</h4>
                  </div>
                </div>

                {/* Pending moderation queue tile */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl">
                    <AlertCircle className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Aguardando Avaliação</span>
                    <h4 className="text-lg font-black text-red-400 mt-0.5">{pendingAds.length} pendentes</h4>
                  </div>
                </div>

                {/* Total view analytics tile */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Visualizações de Páginas</span>
                    <h4 className="text-lg font-black text-teal-300 mt-0.5">{simulatedViewsCount + allAds.reduce((acc, ad) => acc + (ad.views || 0), 0)} visitas</h4>
                  </div>
                </div>
              </div>

              {/* Plans Metrics breakdown grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                
                {/* Visual Listing distributions chart */}
                <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Distribuição por Plano de Anúncio</h4>
                  
                  <div className="space-y-3.5">
                    {/* VIP Item */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-350">👑 Plano VIP (R$ 49,90)</span>
                        <span className="font-extrabold text-amber-500">{vipCount} anúncios ({approvedAds.length ? Math.round((vipCount / approvedAds.length)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${approvedAds.length ? (vipCount / approvedAds.length)*100 : 0}%` }}></div>
                      </div>
                    </div>

                    {/* Destaque 30 Item */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-350">⭐ Destaque 30 Dias (R$ 35,00)</span>
                        <span className="font-extrabold text-blue-400">{destaque30Count} anúncios ({approvedAds.length ? Math.round((destaque30Count / approvedAds.length)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full rounded-full transition-all" style={{ width: `${approvedAds.length ? (destaque30Count / approvedAds.length)*100 : 0}%` }}></div>
                      </div>
                    </div>

                    {/* Destaque 7 Item */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-350">⭐ Destaque 7 Dias (R$ 20,00)</span>
                        <span className="font-extrabold text-[#E52B50]">{destaque7Count} anúncios ({approvedAds.length ? Math.round((destaque7Count / approvedAds.length)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#E52B50] h-full rounded-full transition-all" style={{ width: `${approvedAds.length ? (destaque7Count / approvedAds.length)*100 : 0}%` }}></div>
                      </div>
                    </div>

                    {/* Gratis Item */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-350">🆓 Gratuito (R$ 0,00)</span>
                        <span className="font-extrabold text-gray-400">{gratisCount} anúncios ({approvedAds.length ? Math.round((gratisCount / approvedAds.length)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-gray-400 h-full rounded-full transition-all" style={{ width: `${approvedAds.length ? (gratisCount / approvedAds.length)*100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Server Quick Info */}
                <div className="bg-slate-950/65 rounded-2xl p-5 border border-slate-800 space-y-3.5 text-xs text-slate-400">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Informações Técnicas do Sistema</h4>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span>Instância do Banco de Dados:</span>
                    <strong className="font-mono text-emerald-400 text-[11px]">Firestore Live Container</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span>Sessão de Autenticação:</span>
                    <strong className="font-mono text-amber-500 text-[11px]">Multi-Auth Hybrid Fallback</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span>Gateway Principal:</span>
                    <strong className="font-mono text-rose-400 text-[11px]">Mercado Pago v2 (API Ativa)</strong>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Chave Pública PIX:</span>
                    <strong className="font-mono text-slate-200 text-[11px]">APP_USR-206eeaba...2d</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B) ADS MODERACAO LISTING TAB */}
          {activeTab === "ads" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-widest">Controle de Moderação e Auditoria</h3>
                <span className="px-3 py-1 bg-red-600/30 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase">
                  Fila Pendente: {pendingAds.length} anúncios
                </span>
              </div>

              {pendingAds.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-3xl border border-slate-800 text-slate-400">
                  <Check className="h-10 w-10 text-emerald-400 mx-auto mb-2.5 stroke-[2.5]" />
                  <p className="font-bold text-sm">Ótimo! Nenhum anúncio aguardando aprovação na fila.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Todas as novas publicações estão revisadas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAds.map(ad => (
                    <div key={ad.id} className="p-4 bg-slate-950/50 border border-slate-855 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                          <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-100">{ad.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              ad.planType === "vip" ? "bg-amber-400 text-gray-950" :
                              ad.planType?.startsWith("destaque") ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
                            }`}>
                              {ad.planType === "vip" ? "VIP" : ad.planType === "destaque_30" ? "Destaque 30" : ad.planType === "destaque_7" ? "Destaque 7" : "Grátis"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-450 line-clamp-1 mt-0.5">{ad.description}</p>
                          <div className="flex gap-3 text-[10px] text-slate-500 mt-1 flex-wrap">
                            <span>Preço: <strong className="text-amber-500 font-mono">{formatCurrency(ad.price)}</strong></span>
                            <span>Anunciante: <strong>{ad.sellerName}</strong> ({ad.sellerPhone})</span>
                            <span>Local: <strong>{ad.locationCity}, {ad.locationState}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end pt-1 md:pt-0">
                        <button
                          onClick={() => handleRemoveAd(ad.id)}
                          className="px-3.5 py-1.5 bg-red-650/20 hover:bg-red-700/40 text-red-400 border border-red-500/20 rounded-xl text-xs font-black uppercase transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Recusar</span>
                        </button>
                        <button
                          onClick={() => handleApproveAd(ad.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 text-white rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Aprovar Anúncio</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Approved ads count tracker box */}
              <div className="pt-4 mt-4 border-t border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Todos os Anúncios Ativos ({approvedAds.length})</h4>
                {approvedAds.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">Nenhum anúncio ativo publicado no momento.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {approvedAds.map(ad => (
                      <div key={ad.id} className="p-3 bg-slate-950/20 hover:bg-slate-950/30 border border-slate-850 rounded-xl flex justify-between items-center gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={ad.images[0]} alt="" className="w-10 h-8 rounded-md bg-slate-800 object-cover shrink-0" />
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-slate-200 truncate">{ad.title}</h5>
                            <span className="text-[9px] text-[#E52B50] font-black uppercase font-mono">{formatCurrency(ad.price)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAd(ad.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remover Ad"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C) PLAN PRICING MANAGER TAB */}
          {activeTab === "plans" && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-widest">Alterar Preço dos Planos do Site</h3>
              <p className="text-xs text-slate-400">
                Ajuste os valores de contratação abaixo. A alteração reconfigura o checkout e os formulários de publicação imediatamente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
                {/* Free plan */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-[8px] font-black uppercase rounded">FREE</span>
                    <h4 className="text-xs font-bold text-slate-200 mt-1">Plano Gratuito</h4>
                    <p className="text-[10px] text-slate-500 leading-snug mt-1">Anúncio simples por tempo indeterminado.</p>
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Preço Atual</label>
                    <input 
                      type="text" 
                      disabled 
                      value="R$ 0,00" 
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Destaque 7 dias */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase rounded">POPULAR</span>
                    <h4 className="text-xs font-bold text-slate-200 mt-1">Destaque 7 Dias</h4>
                    <p className="text-[10px] text-slate-500 leading-snug mt-1">Posicionamento no topo, selo em destaque.</p>
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Preço em BRL (R$)</label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      value={planPrices["destaque_7"] || ""} 
                      onChange={(e) => handleUpdatePrice("destaque_7", e.target.value)}
                      className="w-full bg-slate-905 border border-slate-750 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Destaque 30 dias */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-450 text-[8px] font-black uppercase rounded">PROMOÇÃO</span>
                    <h4 className="text-xs font-bold text-slate-200 mt-1">Destaque 30 Dias</h4>
                    <p className="text-[10px] text-slate-500 leading-snug mt-1">Selo Destaque Premium e destaque de topo.</p>
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Preço em BRL (R$)</label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      value={planPrices["destaque_30"] || ""} 
                      onChange={(e) => handleUpdatePrice("destaque_30", e.target.value)}
                      className="w-full bg-slate-905 border border-slate-750 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Plano VIP */}
                <div className="bg-slate-950/50 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-amber-500/15 text-amber-450 text-[8px] font-black uppercase rounded">EXCLUSIVE VIP</span>
                    <h4 className="text-xs font-semibold text-amber-400 mt-1 flex items-center gap-1">👑 Plano VIP</h4>
                    <p className="text-[10px] text-slate-500 leading-snug mt-1">Exibição prioritária máxima, foto e borda dourada.</p>
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] text-amber-450 uppercase font-bold block mb-1">Preço em BRL (R$)</label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      value={planPrices["vip"] || ""} 
                      onChange={(e) => handleUpdatePrice("vip", e.target.value)}
                      className="w-full bg-slate-905 border border-slate-755 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-400 outline-hidden bg-amber-500/5 focus:bg-amber-500/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* D) SUBCATEGORIES MANAGEMENT TAB */}
          {activeTab === "categories" && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-widest">Gerenciar Categorias & Subcategorias</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Selecione uma Macrocategoria à esquerda e adicione ou remova suas respectivas subcategorias. Essas subcategorias aparecem no seletor do PostAdModal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3">
                {/* Left select */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-350 uppercase">1. Escolha Macrocategoria</label>
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {(Object.keys(CATEGORY_LABELS) as AdCategory[]).map(catId => (
                      <button
                        key={catId}
                        onClick={() => setSelectedSubCatCategory(catId)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-between items-center cursor-pointer ${selectedSubCatCategory === catId ? "bg-amber-500 text-gray-950" : "bg-slate-950/40 hover:bg-slate-950/70 text-slate-300"}`}
                      >
                        <span>{CATEGORY_LABELS[catId].label}</span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Lists editing view */}
                <div className="md:col-span-2 space-y-4 bg-slate-950/30 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-3">
                      <h4 className="text-xs font-black uppercase text-slate-300">
                        Subcategorias de: <span className="text-amber-500">{CATEGORY_LABELS[selectedSubCatCategory]?.label}</span>
                      </h4>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {(customSubcategories[selectedSubCatCategory] || []).length} cadastradas
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 mb-4">
                      {(customSubcategories[selectedSubCatCategory] || []).map((subItem) => (
                        <div key={subItem} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200">
                          <span>{subItem}</span>
                          <button
                            onClick={() => handleDeleteSubcategory(selectedSubCatCategory, subItem)}
                            className="text-slate-500 hover:text-red-400 p-0.5 rounded cursor-pointer"
                            title={`Remover subcategoria "${subItem}"`}
                          >
                            <X className="h-3 w-3 shrink-0" />
                          </button>
                        </div>
                      ))}
                      {(customSubcategories[selectedSubCatCategory] || []).length === 0 && (
                        <p className="text-xs text-slate-500 font-bold uppercase py-2">Sem nenhuma subcategoria criada para esta macrocategoria.</p>
                      )}
                    </div>
                  </div>

                  {/* Add Input trigger */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-850">
                    <label className="text-[11px] font-bold text-slate-400 block uppercase">Adicionar Nova Subcategoria</label>
                    <div className="flex gap-2.5">
                      <input 
                        type="text" 
                        placeholder="Ex: Apartamentos de Luxo, Carros Elétricos..."
                        value={newSubCategoryInput}
                        onChange={(e) => setNewSubCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSubcategory();
                        }}
                        className="flex-1 bg-slate-905 border border-slate-750 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs font-semibold placeholder:text-slate-500 outline-hidden"
                      />
                      <button
                        onClick={handleAddSubcategory}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-gray-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4 shrink-0 stroke-[2.5]" />
                        <span>Inserir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* E) PAYMENTS LISTINGS AUDIT TAB */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-widest">Extrato de Compensações PIX & Mercado Pago</h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Total Arrecadado: {formatCurrency(totalArrecadado)}</span>
              </div>

              {loadingPayments ? (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                  <RefreshCw className="h-6 w-6 text-amber-500 animate-spin mb-1.5" />
                  <span className="text-xs font-medium">Buscando transações logged do Firestore...</span>
                </div>
              ) : payments.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-3xl border border-slate-800 text-slate-500">
                  <Coins className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="font-bold text-sm">Não há nenhum registro de pagamento compensado no momento.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Processos do Pix Simulator aparecerão aqui em tempo real.</p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/45">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-350">
                      <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3">Data</th>
                          <th className="p-3">Cliente / Ad</th>
                          <th className="p-3">Plano</th>
                          <th className="p-3 text-right">Valor</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3">Transação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {payments.map(log => (
                          <tr key={log.id} className="hover:bg-slate-800/25 transition-colors">
                            <td className="p-3 font-medium whitespace-nowrap text-slate-450">
                              {new Date(log.createdAt).toLocaleDateString("pt-BR")} {" "}
                              <span className="text-[10px] text-slate-600 font-normal">
                                {new Date(log.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-200">{log.payerName || "Usuário"}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={log.adTitle}>{log.adTitle || "Destaque Premium"}</div>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-300">
                                {log.planType === "vip" ? "👑 VIP" : log.planType === "destaque_30" ? "⭐ Destaque 30" : log.planType === "destaque_7" ? "⭐ Destaque 7" : log.planType}
                              </span>
                            </td>
                            <td className="p-3 text-right font-black font-mono text-emerald-400">
                              {formatCurrency(log.amount)}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Pago
                              </span>
                            </td>
                            <td className="p-3">
                              <code className="text-[10px] bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded select-all font-mono font-bold">
                                {log.id || `TX_${log.createdAt.toString().slice(-6)}`}
                              </code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ModalFooter close control */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-855 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
}

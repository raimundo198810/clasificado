import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { Ad, AdCategory, AdCondition, Chat, UserProfile } from "./types";
import { ensureSeedData } from "./lib/initialSeed";

// Components
import Header from "./components/Header";
import CategoryBar from "./components/CategoryBar";
import AdCard from "./components/AdCard";
import AdDetailModal from "./components/AdDetailModal";
import PostAdModal from "./components/PostAdModal";
import ChatInbox from "./components/ChatInbox";
import AuthModal from "./components/AuthModal";
import FooterModal from "./components/FooterModal";
import AdminPanel from "./components/AdminPanel";

// Icons
import { SlidersHorizontal, ArrowUpDown, RefreshCw, X, HelpCircle, MessageSquare, Plus, Info, Check, MessageCircle, Phone, ExternalLink, ShieldAlert, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Listings States
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  
  // Filter Fields
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AdCategory | "">("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showingMyAdsOnly, setShowingMyAdsOnly] = useState(false);
  
  // Advanced Extra Filters
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [conditionFilter, setConditionFilter] = useState<AdCondition | "">("");
  const [sortBy, setSortBy] = useState<"recent" | "price_asc" | "price_desc">("recent");

  // Chat Inbox states
  const [unreadCount, setUnreadCount] = useState(0);

  // Modal Triggers
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPostAdOpen, setIsPostAdOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const [footerTab, setFooterTab] = useState<"sobre" | "privacidade" | "cookies" | "termos" | "mapa" | "contato" | "ajuda">("sobre");

  // 3D Tilt State for Hero Banner
  const [tiltStyle, setTiltStyle] = useState({ rotateX: 0, rotateY: 0 });
  const [isHoveringHero, setIsHoveringHero] = useState(false);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHoveringHero(true);
    const banner = e.currentTarget;
    const rect = banner.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const maxTilt = 10;
    const tiltX = -((y - centerY) / centerY) * maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;
    
    setTiltStyle({ rotateX: tiltX, rotateY: tiltY });
  };

  const handleHeroMouseLeave = () => {
    setIsHoveringHero(false);
    setTiltStyle({ rotateX: 0, rotateY: 0 });
  };

  // 1. App Startup: Trigger Firebase Custom Database Seeding Check
  useEffect(() => {
    ensureSeedData();
  }, []);

  // 2. Auth State Synchronizer
  useEffect(() => {
    const checkLocalMock = () => {
      const savedMock = localStorage.getItem("viva_mock_user");
      if (savedMock) {
        try {
          setCurrentUser(JSON.parse(savedMock));
        } catch {
          setCurrentUser(null);
          setShowingMyAdsOnly(false);
        }
      } else {
        setCurrentUser(null);
        setShowingMyAdsOnly(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: Date.now()
        });
      } else {
        checkLocalMock();
      }
    });

    // Listen to custom local auth change triggers for simulated operations
    window.addEventListener("viva_local_auth_changed", checkLocalMock);

    return () => {
      unsubscribe();
      window.removeEventListener("viva_local_auth_changed", checkLocalMock);
    };
  }, []);

  // 3. Real-time listings Firestore snapshot sync
  useEffect(() => {
    setLoadingAds(true);
    const adsQuery = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(adsQuery, (snapshot) => {
      const activeAds: Ad[] = [];
      snapshot.forEach((doc) => {
        activeAds.push(doc.data() as Ad);
      });
      setAds(activeAds);
      setLoadingAds(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      setLoadingAds(false);
      handleFirestoreError(error, OperationType.GET, "ads");
    });

    return () => unsubscribe();
  }, []);

  // 4. Real-time Message Badges listener (counts total incoming chats for current user)
  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    const chatsQuery = query(collection(db, "chats"));
    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const chatObj = doc.data() as Chat;
        // If current user is part of the chat
        if (chatObj.sellerId === currentUser.uid || chatObj.buyerId === currentUser.uid) {
          // Simplistic count based on presence of active conversation threads
          count++;
        }
      });
      // In realistic apps, we would compare read timestamps; here we show active thread volumes!
      setUnreadCount(count);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "chats");
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle signOut
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("Logout discrepancy:", e);
    }
    localStorage.removeItem("viva_mock_user");
    setCurrentUser(null);
    window.dispatchEvent(new Event("viva_local_auth_changed"));
  };

  // 5. Client-side Search, Filtering, and Sorting computation
  const filteredAds = ads.filter((ad) => {
    // A) Search string check
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = ad.title.toLowerCase().includes(q);
      const descMatch = ad.description.toLowerCase().includes(q);
      const tagMatch = ad.tags?.some(t => t.toLowerCase().includes(q)) ?? false;
      if (!titleMatch && !descMatch && !tagMatch) return false;
    }

    // B) Category check
    if (selectedCategory && ad.category !== selectedCategory) return false;

    // C) State check
    if (selectedState && ad.locationState !== selectedState) return false;

    // D) City check
    if (selectedCity && !ad.locationCity.toLowerCase().includes(selectedCity.toLowerCase())) return false;

    // E) Ownership check
    if (showingMyAdsOnly && ad.sellerId !== currentUser?.uid) return false;

    // F) Min Price check
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min) && ad.price < min) return false;
    }

    // G) Max Price check
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max) && ad.price > max) return false;
    }

    // H) Condition check
    if (conditionFilter && ad.condition !== conditionFilter) return false;

    // I) Approval Status validation: Hide pending draft ads from standard tourists, unless user is creator
    if (ad.status === "pending" && ad.sellerId !== currentUser?.uid) {
      return false;
    }

    return true;
  });

  // Apply sorting option: VIP > Destaque 30 Dias > Destaque 7 Dias > Gratuitos
  const sortedAds = [...filteredAds].sort((a, b) => {
    const planPriority: Record<string, number> = {
      vip: 4,
      destaque_30: 3,
      destaque_7: 2,
      gratis: 1
    };

    const priorityA = planPriority[a.planType] || 1;
    const priorityB = planPriority[b.planType] || 1;

    if (priorityB !== priorityA) {
      return priorityB - priorityA; // Higher plan priority first
    }

    if (sortBy === "price_asc") {
      return a.price - b.price;
    }
    if (sortBy === "price_desc") {
      return b.price - a.price;
    }
    // Default: 'recent' newest to oldest
    return b.createdAt - a.createdAt;
  });

  // Quick reset filters helper
  const handleClearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setConditionFilter("");
    setSelectedState("");
    setSelectedCity("");
    setSearchQuery("");
    setSelectedCategory("");
    setSortBy("recent");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 three-dimension-mesh flex flex-col text-gray-800 selection:bg-rose-100 selection:text-rose-800" id="viva-app">
      {/* 1. Header Toolbar Component */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPostAd={() => {
          if (currentUser) {
            setIsPostAdOpen(true);
          } else {
            setIsAuthOpen(true);
          }
        }}
        onOpenInbox={() => setIsInboxOpen(true)}
        onLogout={handleLogout}
        onShowMyAdsOnly={(show) => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setShowingMyAdsOnly(show);
          }
        }}
        showingMyAdsOnly={showingMyAdsOnly}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        onToggleFilters={() => setShowFilters(!showFilters)}
        unreadCount={unreadCount}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
      />

      {/* 2. Category Navigation Badges */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col gap-6">

        {/* Stunning Homepage Hero Banner - Styled with magnificent floating 3D perspective depth */}
        {!selectedCategory && !searchQuery && (
          <motion.div 
            className="bg-gradient-to-r from-orange-500 via-rose-500 to-[#E52B50] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shrink-0 mb-4 border border-rose-400/30 shadow-[0_15px_35px_-5px_rgba(229,43,80,0.25),_0_10px_10px_-5px_rgba(0,0,0,0.05),_0_6px_0_0_#ad1835] cursor-default select-none pointer-events-auto" 
            id="viva-hero-banner"
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
            animate={{
              rotateX: tiltStyle.rotateX,
              rotateY: tiltStyle.rotateY,
              scale: isHoveringHero ? 1.015 : 1,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            style={{ 
              transformStyle: "preserve-3d", 
              perspective: "1000px",
            }}
          >
            <div className="absolute right-0 bottom-0 opacity-15 translate-x-10 translate-y-10 scale-125 select-none pointer-events-none" style={{ transform: "translateZ(40px)" }}>
              <svg viewBox="0 0 200 200" className="w-80 h-80 fill-current text-white">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 2.21.72 4.25 1.94 5.91l-.86 3.1c-.24.87.59 1.6 1.41 1.25l2.9-.12C8.61 22.68 10.26 23 12 23c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14.28c-.28.1-.53.12-.76.12-.47 0-.78-.17-.91-.48l-.94-2.12c-.22-.52-.51-.89-.92-1.07l-1.92-.81c-.49-.15-.76-.48-.76-.92s.27-.78.73-.93l2.12-.64c.54-.15.91-.45 1.1-.92l.82-1.93c.15-.36.46-.57.85-.57s.71.21.87.57l.81 1.92c.19.47.56.77 1.1.92l2.12.64c.48.15.75.49.75.93s-.27.77-.76.92l-1.92.81c-.41.18-.7.55-.92 1.07l-.94 2.12a.93.93 0 01-.15.35c.01.01.01.01 0 0z"/>
              </svg>
            </div>
            <div className="max-w-2xl relative z-10 space-y-4" style={{ transform: "translateZ(30px)" }}>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Novo Portal de Classificados VivaLocal 2026
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-sans tracking-tight leading-tight" style={{ transform: "translateZ(40px)" }}>
                Anuncie Grátis no Portal <br />
                <span className="text-amber-305 font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-250 to-amber-300">Nº 1 em Negócios Locais</span>
              </h1>
              <p className="text-xs sm:text-sm text-rose-50 leading-relaxed font-semibold" style={{ transform: "translateZ(30px)" }}>
                Milhares de pessoas compram e vendem diariamente. Publique carros, celulares, imóveis, serviços urbanos, vagas de emprego e encontros no canal adulto com total segurança comercial e anonimato garantido.
              </p>
              <div className="flex flex-wrap gap-3 pt-3" style={{ transform: "translateZ(35px)" }}>
                <button
                  onClick={() => {
                    if (currentUser) {
                      setIsPostAdOpen(true);
                    } else {
                      setIsAuthOpen(true);
                    }
                  }}
                  className="px-5 py-3 bg-white hover:bg-rose-50 text-[#E52B50] rounded-xl text-xs font-black shadow-[0_4px_0_0_#e2e8f0,0_8px_16px_rgba(0,0,0,0.1)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_0px_0_0_#cbd5e1] flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Anunciar Agora Grátis
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/25 rounded-xl text-xs font-bold transition-all text-white shadow-[0_3px_0_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1"
                >
                  Ver Todos os Anúncios
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Expandable Advanced Side Panels */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
            id="viva-advanced-filters-bar"
          >
            {/* Min Price inputs */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Preço Mínimo (R$)</label>
              <input
                type="number"
                placeholder="Ex: 50"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Max Price inputs */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Preço Máximo (R$)</label>
              <input
                type="number"
                placeholder="Ex: 5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Condition state */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Estado de Uso</label>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value as AdCondition | "")}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500 bg-white"
              >
                <option value="">Qualquer Estado</option>
                <option value="novo">Novo / Lacrado</option>
                <option value="usado">Usado / Seminovo</option>
              </select>
            </div>

            {/* Action buttons resetting */}
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-colors cursor-pointer w-full"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-[#E52B50] hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer w-full"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1">
          {/* Main Listings Grid Panel */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Context Stats Bar with 3D base depth */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-[0_3px_0_0_#e2e8f0,0_4px_8px_-2px_rgba(0,0,0,0.04)] flex justify-between items-center shrink-0">
              <div className="text-xs text-gray-500 font-semibold">
                Mostrando <span className="text-gray-800 font-extrabold">{sortedAds.length}</span> anúncios encontrados
                {selectedCategory && ` em "${selectedCategory}"`}
              </div>

              {/* Sorting triggers */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs text-gray-700 bg-transparent py-0.5 border-none focus:outline-hidden font-bold cursor-pointer"
                  id="viva-select-sort"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                </select>
              </div>
            </div>

            {/* Loading Grid State */}
            {loadingAds ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20 gap-3">
                <RefreshCw className="h-10 w-10 animate-spin text-amber-500" />
                <p className="text-sm text-gray-500 font-medium">Buscando classificados locais...</p>
              </div>
            ) : sortedAds.length === 0 ? (
              <div className="flex-1 bg-white border border-gray-150 shadow-[0_4px_0_0_#cbd5e1,0_8px_16px_rgba(0,0,0,0.04)] rounded-2xl flex flex-col items-center justify-center text-center p-12">
                <Info className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-800">Nenhum anúncio correspondente</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4 leading-relaxed">
                  Não encontramos classificados para os critérios de busca atuais. Tente expandir sua busca para outros bairros ou mude as palavras-chave.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-[0_3px_0_0_#b45309,0_4px_8px_rgba(245,158,11,0.2)] transition-all transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="viva-ads-grid">
                {sortedAds.map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    onClick={() => setSelectedAd(ad)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Tips & Fast Promo Section */}
          <div className="w-full md:w-[280px] shrink-0 space-y-5">
            {/* Fast Tips Card - Elegant 3D Lift */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-[0_4px_0_0_#cbd5e1,0_6px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_30px_-6px_rgba(0,0,0,0.08),_0_5px_0_0_#cbd5e1] hover:-translate-y-0.5 transition-all duration-200">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">
                Dicas VivaLocal
              </h4>
              <ul className="space-y-2.5 text-[11px] text-gray-650 font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Nunca faça depósitos antecipados sem inspecionar o produto presencialmente primeiro.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Para trocas de eletrônicos ou veículos, agende encontros em shoppings ou postos policiais na luz do dia.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mantenha as conversações no nosso chat nativo seguro para manter registros em caso de disputas.</span>
                </li>
              </ul>
            </div>

            {/* AI Callout Panel - Radiant Volumetric 3D Card */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-2xl p-5 shadow-[0_5px_0_0_#4338ca,0_10px_20px_rgba(67,56,202,0.18)] hover:shadow-[0_18px_32px_rgba(67,56,202,0.25),_0_6px_0_0_#4338ca] hover:-translate-y-0.5 transition-all duration-200 space-y-2.5 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-indigo-500/20 rounded-full shrink-0" />
              <span className="bg-indigo-305 text-white bg-indigo-500/40 border border-indigo-400/30 text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider block w-max">
                IA VivaLocal
              </span>
              <h4 className="text-sm font-bold leading-snug">
                Melhore seus lucros com assistência do Gemini AI!
              </h4>
              <p className="text-[10px] text-indigo-150 leading-relaxed font-semibold">
                Escreva apenas o título do item e deixe que nossa automação de IA integrada escreva a melhor descrição persuasiva e avalie o preço sugerido do mercado automaticamente.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Branding Area with Columns */}
      <footer className="bg-white border-t border-gray-150 pt-16 pb-12 mt-16 shrink-0 font-medium" id="viva-footer">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 text-left">
            {/* Column 1: Brand presentation */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#E52B50] to-rose-500 flex items-center justify-center text-white font-heavy text-lg font-black shadow-lg shadow-rose-500/20 shrink-0">
                  V
                </span>
                <div>
                  <h4 className="text-sm font-black text-gray-900 tracking-tight leading-none">VivaLocal</h4>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Classificados do Brasil</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm font-semibold">
                O VivaLocal ajuda você a vender e comprar perto de casa de forma rápida, segura e sem intermediários. Publique anúncios grátis ou turbine seus ganhos com o Destaque Premium.
              </p>
              
              {/* WhatsApp Footer Badge button */}
              <div className="pt-2">
                <a 
                  href="https://wa.me/5549998057924" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-550 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-emerald-500/10 hover:shadow-md cursor-pointer"
                  id="viva-footer-whatsapp-badge"
                  title="Chame no WhatsApp de suporte"
                >
                  {/* WhatsApp SVG logo */}
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.86.002-2.635-1.023-5.11-2.884-6.974C16.59 1.907 14.12 1.01 11.5 1.012c-5.437.001-9.864 4.422-9.868 9.863-.001 1.714.453 3.39 1.316 4.873L1.97 21l5.42-1.42a9.718 9.718 0 0 0 4.613 1.15L12 20.76h-.003zm9.646-7.391c-.26-.13-.1.1-.383-.415-.083-.15-.17-.3-.265-.45a4.234 4.234 0 0 0-.5-.65c-.173-.186-.36-.282-.54-.282h-.24c-.11-.005-.224-.002-.338.008a1.29 1.29 0 0 0-.66.25c-.21.164-.4.364-.567.594-.288.397-.506.877-.66 1.378a5.55 5.55 0 0 0-.173 1.396c0 .484.072.966.214 1.428.14.462.366.9.67 1.293a9.42 1.42 0 0 0 2.456 2.27c.48.33.91.564 1.36.75a4.43 4.43 0 0 0 1.944.25c.543-.075 1.055-.316 1.472-.693.385-.355.67-.803.818-1.3.064-.216.1-.44.11-.665v-.19c-.01-.06-.037-.12-.083-.15l-.2-.1a38.45 38.45 0 0 0-1.848-.925z" />
                  </svg>
                  <span>Suporte Contato Rápido (49) 99805-7924</span>
                </a>
              </div>
            </div>

            {/* Column 2: Legal links */}
            <div className="space-y-3 text-xs">
              <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">Políticas e Regras</h5>
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => { setFooterTab("privacidade"); setIsFooterOpen(true); }}
                  className="text-gray-500 hover:text-[#E52B50] font-bold transition-all text-left cursor-pointer"
                >
                  Política de Privacidade
                </button>
                <button 
                  onClick={() => { setFooterTab("cookies"); setIsFooterOpen(true); }}
                  className="text-gray-500 hover:text-[#E52B50] font-bold transition-all text-left cursor-pointer"
                >
                  Política de Cookies
                </button>
                <button 
                  onClick={() => { setFooterTab("termos"); setIsFooterOpen(true); }}
                  className="text-gray-500 hover:text-[#E52B50] font-bold transition-all text-left cursor-pointer"
                >
                  Termos de Uso
                </button>
              </div>
            </div>

            {/* Column 3: Navegação */}
            <div className="space-y-3 text-xs">
              <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">Sobre o Site</h5>
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => { setFooterTab("sobre"); setIsFooterOpen(true); }}
                  className="text-gray-500 hover:text-[#E52B50] font-bold transition-all text-left cursor-pointer"
                >
                  Sobre Nós
                </button>
                <button 
                  onClick={() => { setFooterTab("mapa"); setIsFooterOpen(true); }}
                  className="text-gray-500 hover:text-[#E52B50] font-bold transition-all text-left cursor-pointer"
                >
                  Mapa do Site
                </button>
              </div>
            </div>

            {/* Column 4: Suporte */}
            <div className="space-y-3 text-xs">
              <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">Central e FAQ</h5>
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => { setFooterTab("contato"); setIsFooterOpen(true); }}
                  className="text-gray-500 hover:text-[#E52B50] font-bold transition-all text-left cursor-pointer"
                >
                  Fale Conosco
                </button>
                <button 
                  onClick={() => { setFooterTab("ajuda"); setIsFooterOpen(true); }}
                  className="text-gray-500 hover:text-[#E52B50] font-bold transition-all text-left cursor-pointer"
                >
                  Central de Ajuda
                </button>
              </div>
            </div>
          </div>

          <div className="pt-10 mt-10 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-semibold" id="viva-footer-rights-row">
            <p>© 2026 Todos os direitos reservados. Vivalocal Classificados</p>
            <div className="flex gap-6">
              <span className="flex items-center gap-1.5 text-gray-450">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Ambiente Protegido SSL
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Dynamic Floating Support Balloon Widget */}
      <div 
        className="fixed bottom-6 right-6 z-40 group flex flex-col items-end"
        id="viva-floating-support-balloon"
      >
        <div className="mb-2 bg-white border border-gray-150 p-4 rounded-2xl shadow-xl w-64 space-y-2.5 text-left opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atendimento Premium</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
            Olá! Como podemos ajudar você hoje? Fale diretamente com nossa equipe ou consulte as respostas instantâneas.
          </p>
          <div className="space-y-1.5 pt-1">
            <a 
              href="https://wa.me/5549998057924" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-800 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 fill-current" />
                Chamar no WhatsApp
              </span>
              <ExternalLink className="h-3 w-3 stroke-[3]" />
            </a>
            <button 
              onClick={() => { setFooterTab("ajuda"); setIsFooterOpen(true); }}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl text-[11px] font-bold text-gray-700 transition-colors text-left cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-[#E52B50]" />
                Ver Dúvidas Frequentes
              </span>
              <ChevronRight className="h-3 w-3 stroke-[3]" />
            </button>
            <button 
              onClick={() => { setFooterTab("contato"); setIsFooterOpen(true); }}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl text-[11px] font-bold text-gray-700 transition-colors text-left cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-indigo-550" />
                Mandar Mensagem
              </span>
              <ChevronRight className="h-3 w-3 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Pulsating support button */}
        <button 
          onClick={() => { setFooterTab("contato"); setIsFooterOpen(true); }}
          className="h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg text-white flex items-center justify-center relative cursor-pointer transform hover:scale-110 active:scale-95 transition-all shadow-emerald-500/20 group/btn animate-pulse hover:animate-none"
          id="viva-floating-trigger-button"
          title="Fale Conosco"
        >
          <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.86.002-2.635-1.023-5.11-2.884-6.974C16.59 1.907 14.12 1.01 11.5 1.012c-5.437.001-9.864 4.422-9.868 9.863-.001 1.714.453 3.39 1.316 4.873L1.97 21l5.42-1.42a9.718 9.718 0 0 0 4.613 1.15L12 20.76h-.003zm9.646-7.391c-.26-.13-.1.1-.383-.415-.083-.15-.17-.3-.265-.45a4.234 4.234 0 0 0-.5-.65c-.173-.186-.36-.282-.54-.282h-.24c-.11-.005-.224-.002-.338.008a1.29 1.29 0 0 0-.66.25c-.21.164-.4.364-.567.594-.288.397-.506.877-.66 1.378a5.55 5.55 0 0 0-.173 1.396c0 .484.072.966.214 1.428.14.462.366.9.67 1.293a9.42 1.42 0 0 0 2.456 2.27c.48.33.91.564 1.36.75a4.43 4.43 0 0 0 1.944.25c.543-.075 1.055-.316 1.472-.693.385-.355.67-.803.818-1.3.064-.216.1-.44.11-.665v-.19c-.01-.06-.037-.12-.083-.15l-.2-.1a38.45 38.45 0 0 0-1.848-.925z" />
          </svg>
        </button>
      </div>

      {/* Core Dialog Sub-Modals */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={() => {}}
          />
        )}

        {isPostAdOpen && (
          <PostAdModal
            isOpen={isPostAdOpen}
            onClose={() => setIsPostAdOpen(false)}
            currentUser={currentUser}
            onSuccess={() => {
              setShowingMyAdsOnly(true);
            }}
          />
        )}

        {isInboxOpen && (
          <ChatInbox
            isOpen={isInboxOpen}
            onClose={() => setIsInboxOpen(false)}
            currentUser={currentUser}
          />
        )}

        {selectedAd && (
          <AdDetailModal
            ad={selectedAd}
            isOpen={!!selectedAd}
            onClose={() => setSelectedAd(null)}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenInbox={() => setIsInboxOpen(true)}
          />
        )}

        {isFooterOpen && (
          <FooterModal
            isOpen={isFooterOpen}
            onClose={() => setIsFooterOpen(false)}
            initialTab={footerTab}
          />
        )}

        {isAdminPanelOpen && currentUser?.isAdmin && (
          <AdminPanel
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
            allAds={ads}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

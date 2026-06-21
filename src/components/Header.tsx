import React from "react";
import { Search, MapPin, PlusCircle, MessageSquare, User, LogOut, SlidersHorizontal, BookOpen, RefreshCw } from "lucide-react";
import { UserProfile } from "../types";

interface HeaderProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenPostAd: () => void;
  onOpenInbox: () => void;
  onLogout: () => void;
  onShowMyAdsOnly: (show: boolean) => void;
  showingMyAdsOnly: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  onToggleFilters: () => void;
  unreadCount: number;
  onOpenAdmin: () => void;
}

const BRAZIL_STATES = [
  { code: "", name: "Todos os Estados" },
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

export default function Header({
  currentUser,
  onOpenAuth,
  onOpenPostAd,
  onOpenInbox,
  onLogout,
  onShowMyAdsOnly,
  showingMyAdsOnly,
  searchQuery,
  setSearchQuery,
  selectedState,
  setSelectedState,
  selectedCity,
  setSelectedCity,
  onToggleFilters,
  unreadCount,
  onOpenAdmin
}: HeaderProps) {
  const [cep, setCep] = React.useState("");
  const [isFetchingCep, setIsFetchingCep] = React.useState(false);
  const [cepError, setCepError] = React.useState("");
  const [cepSuccess, setCepSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!selectedState && !selectedCity) {
      setCep("");
      setCepSuccess(false);
      setCepError("");
    }
  }, [selectedState, selectedCity]);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    let formattedValue = value;
    if (value.length > 5) {
      formattedValue = `${value.slice(0, 5)}-${value.slice(5)}`;
    }

    setCep(formattedValue);
    setCepError("");
    setCepSuccess(false);

    if (value.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        if (!response.ok) {
          throw new Error("Erro de rede");
        }
        const data = await response.json();
        if (data.erro) {
          setCepError("Desconhecido");
          setCepSuccess(false);
        } else {
          setSelectedState(data.uf || "");
          setSelectedCity(data.localidade || "");
          setCepSuccess(true);
          setCepError("");
        }
      } catch (err) {
        setCepError("Erro na API");
        setCepSuccess(false);
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  return (
    <div className="sticky top-0 z-44 flex flex-col w-full" id="viva-header-root">
      {/* 0. Top utility notice bar - Gives massive authority & professional trust */}
      <div className="bg-[#1C2C54] text-[#EEF2F6] text-[10px] font-medium py-1.5 px-4 sm:px-6 lg:px-8 flex justify-between items-center border-b border-white/[0.08]" id="viva-topbar">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-450 animate-pulse bg-emerald-450" />
          <span className="tracking-tight hidden sm:inline">Bem-vindo ao Novo Portal Oficial de Classificados VivaLocal</span>
          <span className="tracking-tight sm:hidden font-bold">VivaLocal Oficial</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-350">
          <span className="hidden md:inline font-semibold">Suporte Permanente: <strong className="text-white">atendimento@vivalocalclassificado.com.br</strong></span>
          <span className="font-extrabold uppercase tracking-widest text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-300/10">100% SEGURO</span>
        </div>
      </div>

      <header className="bg-white border-b border-gray-150 shadow-sm" id="viva-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Branding Bar */}
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer transition-transform duration-150 active:scale-95" 
              onClick={() => onShowMyAdsOnly(false)}
              id="viva-logo-container"
            >
              {/* Premium VivaLocal Logo Symbol */}
              <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-rose-600 text-white p-2 rounded-xl shadow-md flex items-center justify-center animate-pulse">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                  {/* speech bubble heart icon typical of premium vivalocal */}
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 2.21.72 4.25 1.94 5.91l-.86 3.1c-.24.87.59 1.6 1.41 1.25l2.9-.12C8.61 22.68 10.26 23 12 23c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14.28c-.28.1-.53.12-.76.12-.47 0-.78-.17-.91-.48l-.94-2.12c-.22-.52-.51-.89-.92-1.07l-1.92-.81c-.49-.15-.76-.48-.76-.92s.27-.78.73-.93l2.12-.64c.54-.15.91-.45 1.1-.92l.82-1.93c.15-.36.46-.57.85-.57s.71.21.87.57l.81 1.92c.19.47.56.77 1.1.92l2.12.64c.48.15.75.49.75.93s-.27.77-.76.92l-1.92.81c-.41.18-.7.55-.92 1.07l-.94 2.12a.93.93 0 01-.15.35c.01.01.01.01 0 0z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-black font-sans tracking-tight text-[#E52B50]">
                    viva<span className="text-[#122A50]">local</span>
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 font-mono">.com.br</span>
                </div>
                <p className="text-[9px] font-bold font-mono text-gray-400 tracking-wider uppercase leading-none">
                  Líder em Anúncios Locais do Brasil
                </p>
              </div>
            </div>

            {/* Quick Stats & Account Tools */}
            <div className="flex items-center space-x-3" id="viva-user-menu">
              {currentUser ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Inbox Button */}
                  <button
                    id="viva-btn-inbox"
                    onClick={onOpenInbox}
                    className="relative p-2 text-gray-650 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                    title="Mensagens"
                  >
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-extrabold h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                    <span className="hidden md:inline text-xs font-semibold">Mensagens</span>
                  </button>

                  {/* My Ads Toggle */}
                  <button
                    id="viva-btn-myads"
                    onClick={() => onShowMyAdsOnly(!showingMyAdsOnly)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      showingMyAdsOnly
                        ? "bg-[#FFE8EC] text-[#E52B50] border-[#FFB3C1] shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {showingMyAdsOnly ? "Ver Todos os Anúncios" : "Meus Anúncios"}
                  </button>

                  {/* Admin Panel Toggle */}
                  {currentUser?.isAdmin && (
                    <button
                      id="viva-btn-admin-panel"
                      onClick={onOpenAdmin}
                      className="px-3 py-1.5 text-xs font-black rounded-lg border bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-gray-950 border-amber-500 hover:border-amber-600 transition-all select-none cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Acessar o Painel de Controle de Moderadores"
                    >
                      👑 Painel Admin
                    </button>
                  )}

                  {/* Account info */}
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-bold text-gray-800">
                      {currentUser.displayName || currentUser.email?.split("@")[0]}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 font-bold flex items-center gap-0.5 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                      Online
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    id="viva-btn-logout"
                    onClick={onLogout}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="viva-btn-login"
                  onClick={onOpenAuth}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 text-xs font-bold text-gray-750 hover:text-[#E52B50] bg-white hover:bg-[#FFE8EC]/30 rounded-xl border border-gray-200 shadow-[0_3px_0_0_#e2e8f0,0_4px_8px_-2px_rgba(0,0,0,0.05)] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_0px_0_0_#cbd5e1,0_2px_4px_rgba(0,0,0,0.02)]"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  <span>Entrar / Cadastrar</span>
                </button>
              )}

              {/* Post Ad CTA - Beautiful Brilliant Orange to Red Gradient which now includes satisfying 3D push feel */}
              <button
                id="viva-btn-publish"
                onClick={onOpenPostAd}
                className="flex items-center space-x-1.5 px-4.5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-orange-500 via-orange-600 to-rose-600 hover:from-orange-600 hover:via-orange-700 hover:to-rose-700 shadow-[0_4px_0_0_#ad1835,0_8px_16px_rgba(229,43,80,0.22)] rounded-xl transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_#ad1835,0_2px_4px_rgba(0,0,0,0.1)] cursor-pointer pointer-events-auto"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Anunciar Grátis</span>
                <span className="sm:hidden">Anunciar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Central Search Controls (Wrapped in max-w-7xl for responsive layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-1 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="O que você está procurando hoje? Ex: iPhone, Aluguel Moema, Honda Civic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#E52B50] focus:border-[#E52B50] bg-gray-50/50 placeholder:text-gray-400"
              id="viva-input-search"
            />
          </div>

          <div className="flex gap-2.5">
            {/* CEP Input Filter */}
            <div className="relative flex-1 md:flex-initial w-[110px]">
              <div className="absolute left-3 top-2.5 flex items-center justify-center">
                {isFetchingCep ? (
                  <RefreshCw className="h-4 w-4 text-[#E52B50] animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 text-[#E52B50]" />
                )}
              </div>
              <input
                type="text"
                placeholder=" CEP"
                value={cep}
                onChange={handleCepChange}
                maxLength={9}
                className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#E52B50] focus:border-[#E52B50] bg-white placeholder:text-gray-400 font-medium transition-all ${
                  cepError
                    ? "border-red-400 text-red-600 focus:ring-red-300"
                    : cepSuccess
                    ? "border-emerald-400 text-emerald-800"
                    : "border-gray-200"
                }`}
                title="Insira o CEP para autopreenchimento de Estado e Cidade"
                id="viva-input-cep"
              />
              {cepError && (
                <span className="absolute left-0 top-[38px] text-[9px] text-red-500 font-extrabold bg-white px-2 py-0.5 rounded-md border border-red-200 shadow-xs z-50 whitespace-nowrap">
                  {cepError === "Desconhecido" ? "Não encontrado" : cepError === "Erro na API" ? "Erro de conexão" : cepError}
                </span>
              )}
            </div>

            {/* State Selector */}
            <div className="relative flex-1 md:flex-initial min-w-[140px]">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity(""); // clear city when state changes
                }}
                className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#E52B50] focus:border-[#E52B50] bg-white appearance-none text-gray-700 font-medium"
                id="viva-select-state"
              >
                {BRAZIL_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City input filter */}
            {selectedState && (
              <div className="relative flex-1 md:flex-initial">
                <input
                  type="text"
                  placeholder="Cidade..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full md:w-[120px] px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#E52B50] focus:border-[#E52B50] bg-white"
                  title="Filtro de cidade"
                  id="viva-input-city"
                />
              </div>
            )}

            {/* Filter Toggle Button */}
            <button
              id="viva-btn-toggle-filters"
              onClick={onToggleFilters}
              className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-[#E52B50] bg-gray-50 hover:bg-[#FFE8EC]/35 border border-gray-200 hover:border-[#FFB3C1] rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline">Mais Filtros</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

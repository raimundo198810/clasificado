import React, { useState } from "react";
import { 
  X, Info, Shield, HelpCircle, Phone, FileText, Map, Sparkles, Send, 
  MessageSquare, Check, CheckCircle2, ChevronRight, Search, Landmark, Globe, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "sobre" | "privacidade" | "cookies" | "termos" | "mapa" | "contato" | "ajuda";
}

export default function FooterModal({ isOpen, onClose, initialTab = "sobre" }: FooterModalProps) {
  const [activeTab, setActiveTab] = useState<"sobre" | "privacidade" | "cookies" | "termos" | "mapa" | "contato" | "ajuda">(initialTab);
  
  // FAQ states
  const [faqSearch, setFaqSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Sync initialTab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setFormSuccess(false);
      // Reset form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Sound generator for successful feedback chimes
  const playFormSuccessChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);

      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
          gain2.gain.setValueAtTime(0.12, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.55);
        } catch (e) {}
      }, 120);
    } catch (e) {}
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setFormSuccess(true);
      playFormSuccessChime();
    }, 1200);
  };

  const faqs = [
    {
      q: "Como posso anunciar de forma totalmente grátis no VivaLocal?",
      a: "Para anunciar de forma gratuita, clique no botão 'Anunciar Agora' no topo do site ou no banner inicial. Preencha os detalhes do seu anúncio (título, descrição, categoria, fotos e preço) e selecione o plano básico gratuito. Seu anúncio será publicado imediatamente e ficará visível para milhares de interessados regionais."
    },
    {
      q: "O que é o destaque VivaLocal Premium (Destaque de Topo)?",
      a: "O Destaque Premium é um recurso dinâmico opcional. Ao ativar esta opção por R$ 14,90 via PIX compensado eletronicamente em tempo real, seu anúncio ganha uma moldura dourada realçada, símbolo de alta reputação, e permanece fixado no bloco superior dos resultados da categoria. Isso eleva a visualização do anúncio em até 10 vezes em comparação com anúncios normais."
    },
    {
      q: "Quais são as diretrizes de segurança comercial para compradores?",
      a: "Recomendamos firmemente inspecionar produtos pessoalmente antes de efetuar qualquer transação ou pagamento. Marque encontros em locais públicos, abertos e movimentados à luz do dia (como shoppings, postos de conveniência ou proximidades policiais). Nunca envie depósitos ou PIX antecipados para vendedores antes de ter o produto em mãos."
    },
    {
      q: "Como funciona a confirmação instantânea de pagamento via PIX?",
      a: "Temos um sistema automatizado conectado ao ecossistema do Banco Central que monitora o recebimento das parcelas em tempo real. Assim que o QR Code Pix ou código Copie-e-Cole de R$ 14,90 for pago em seu banco, em menos de 4 segundos nosso motor operacional confirmará a transação automaticamente, emitirá o recibo, ativará os disparos de destaque do seu anúncio e atualizará seu status visual imediatamente."
    },
    {
      q: "Posso anunciar na categoria de Encontros Adultos?",
      a: "Sim. O canal adulto do VivaLocal é destinado a usuários maiores de 18 anos, respeitando a legislação em vigor e os direitos individuais de expressão. Nossos sistemas garantem total anonimato dos dados e segurança de imagem, vedando terminantemente pornografia infantil ou exploração ilícita de qualquer natureza."
    },
    {
      q: "Como faço para editar ou deletar meu anúncio publicado?",
      a: "Se você estiver conectado em sua conta ativa, você pode acessar 'Meus Anúncios' no menu de usuário localizado em nosso cabeçalho superior. Lá você poderá atualizar informações como preço, imagens, ou remover o anúncio quando o item for vendido com sucesso."
    }
  ];

  const filteredFaqs = faqs.filter(
    faq => faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || faq.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const tabsInfo = [
    { id: "sobre" as const, label: "Sobre Nós", icon: Info },
    { id: "contato" as const, label: "Fale Conosco", icon: Phone },
    { id: "ajuda" as const, label: "Central de Ajuda", icon: HelpCircle },
    { id: "privacidade" as const, label: "Privacidade", icon: Shield },
    { id: "cookies" as const, label: "Política de Cookies", icon: FileText },
    { id: "termos" as const, label: "Termos de Uso", icon: FileText },
    { id: "mapa" as const, label: "Mapa do Site", icon: Map },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="viva-footer-modal-root">
      {/* Backdrop animation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs"
        id="viva-footer-modal-backdrop"
      />

      {/* Main Container - 3D Modern Premium Feel with responsive side bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white rounded-3xl overflow-hidden max-w-5xl w-full h-[85vh] md:h-[650px] shadow-2xl flex flex-col md:flex-row relative border border-gray-100 z-10"
        id="viva-footer-modal-box"
      >
        {/* Interactive Left Navigation Sidebar */}
        <div className="w-full md:w-[260px] bg-gray-50 border-r border-gray-150 p-6 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#E52B50] to-rose-455 flex items-center justify-center text-white font-heavy text-base font-black shadow-md shadow-rose-500/10 shrink-0">
                V
              </span>
              <div>
                <h4 className="text-sm font-black text-gray-900 tracking-tight leading-none">VivaLocal</h4>
                <span className="text-[9px] text-[#E52B50] font-bold uppercase tracking-wider">Suporte Institucional</span>
              </div>
            </div>

            {/* List links as premium buttons */}
            <nav className="space-y-1.5">
              {tabsInfo.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setFormSuccess(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected 
                        ? "bg-[#E52B50] text-white shadow-sm" 
                        : "text-gray-600 hover:text-[#E52B50] hover:bg-rose-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isSelected ? "text-white" : "text-gray-400 group-hover:text-[#E52B50]"}`} />
                      <span>{tab.label}</span>
                    </div>
                    {isSelected && <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick legal stats */}
          <div className="hidden md:block pt-4 border-t border-gray-200/60">
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
              <span>● Conexão Segura</span>
              <span className="text-emerald-500 font-extrabold">SSL v3</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-1 leading-snug">
              VivaLocal Classificados Ltda. <br /> CNPJ: 45.922.805/0001-90
            </p>
          </div>
        </div>

        {/* Content Panel Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                {tabsInfo.find(t => t.id === activeTab)?.label}
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5 tracking-wider">
                {activeTab === "sobre" && "Nossa história e alcance comercial no Brasil"}
                {activeTab === "contato" && "Fale com nossa equipe técnica de suporte"}
                {activeTab === "ajuda" && "Dúvidas frequentes e manual operacional do site"}
                {activeTab === "privacidade" && "Como protegemos seus dados pessoais de navegação"}
                {activeTab === "cookies" && "Nossa política de rastreio inteligente de cache"}
                {activeTab === "termos" && "Regras de convivência e listagem jurídica do portal"}
                {activeTab === "mapa" && "Indexador inteligente de todas as seções e cidades"}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar Janela"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body contents */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {/* 1. SOBRE NOS */}
            {activeTab === "sobre" && (
              <div className="space-y-6 animate-in fade-in duration-200 text-sm text-gray-600 leading-relaxed font-medium">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-[#E52B50] p-6 text-white text-left shadow-sm">
                  <div className="relative z-10 max-w-md">
                    <span className="bg-white/20 text-white border border-white/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-2">Fundado em 2012</span>
                    <h4 className="text-lg font-black tracking-tight leading-tight">Conectando vizinhos e impulsionando o comércio local brasileiro</h4>
                    <p className="text-xs text-rose-50/90 mt-1.5 leading-relaxed">
                      O VivaLocal é o maior e mais confiável portal de classificados voltado exclusivamente para transações e serviços locais.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#E52B50]" />
                    <span>Nossa Missão e Valores</span>
                  </h4>
                  <p>
                    Acreditamos que o comércio mais sustentável e produtivo é aquele que acontece entre pessoas da mesma comunidade. Por isso, oferecemos uma plataforma que une velocidade, simplicidade tecnológica e altos padrões de segurança cibernética para que qualquer cidadão possa anunciar e vender grátis.
                  </p>
                  <p>
                    Com nossa tecnologia pioneira de inteligência artificial assistida e processamento de PIX instantâneo com monitoramento contínuo, reduzimos taxas operacionais a zero, ajudando autônomos e empresas locais a alavancarem suas receitas sem burocracia comercial.
                  </p>
                </div>

                {/* Growth stats */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                    <div className="text-xl font-black text-[#E52B50]">+3.2M</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Anúncios Ativos</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                    <div className="text-xl font-black text-[#E52B50]">+10M</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Visitas Mensais</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                    <div className="text-xl font-black text-[#E52B50]">99.7%</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Segurança</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FALE CONOSCO (INTERACTIVE FORM) */}
            {activeTab === "contato" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {formSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-150 p-6 rounded-2xl text-center space-y-4 max-w-md mx-auto py-10">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                      <Check className="h-6 w-6 stroke-[3]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-gray-900">Mensagem Enviada!</h4>
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                        Seu protocolo de suporte número <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-150">#{Math.floor(Math.random() * 90000) + 10000}</code> foi gerado. Retornaremos em até 2 horas úteis em seu e-mail cadastrado!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormSuccess(false)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      Enviar Nova Mensagem
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left details */}
                    <div className="lg:col-span-2 space-y-4 text-xs font-medium text-gray-500">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                        <span className="text-[9px] font-black text-[#E52B50] uppercase tracking-widest block">Atendimento Oficial</span>
                        
                        <div className="space-y-1 text-[11px] text-gray-600">
                          <p className="font-bold text-gray-800">Telefone & WhatsApp:</p>
                          <a 
                            href="https://wa.me/5549998057924" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-emerald-600 hover:underline font-extrabold flex items-center gap-1 mt-0.5"
                          >
                            <span>(49) 99805-7924</span>
                          </a>
                        </div>

                        <div className="space-y-1 text-[11px] text-gray-600 pt-1">
                          <p className="font-bold text-gray-800">E-mail Corporativo:</p>
                          <a href="mailto:atendimento@vivalocalclassificado.com.br" className="text-[#E52B50] hover:underline font-extrabold block">
                            atendimento@vivalocalclassificado.com.br
                          </a>
                        </div>
                      </div>

                      <div className="bg-[#FFE8EC]/30 p-4 rounded-2xl border border-[#FFB3C1]/30">
                        <p className="text-[10px] text-rose-900 font-semibold leading-relaxed">
                          <strong>Horário de Funcionamento:</strong> Segunda a Sábado das 08h00 às 21h00. Domingos e Feriados em regime de plantão automático via IA das 09h00 às 18h00.
                        </p>
                      </div>
                    </div>

                    {/* Right core form */}
                    <form onSubmit={handleContactSubmit} className="lg:col-span-3 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Seu Nome completo</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Pedro Silva"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#E52B50]/30 focus:border-[#E52B50]"
                          />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Seu E-mail de retorno</label>
                          <input
                            type="email"
                            required
                            placeholder="Ex: pedro@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#E52B50]/30 focus:border-[#E52B50]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assunto da Mensagem</label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E52B50]/30 focus:border-[#E52B50] font-semibold text-gray-700"
                        >
                          <option value="">Selecione o motivo...</option>
                          <option value="suporte_anuncio">Dificuldade com um Anúncio</option>
                          <option value="pagamento_pix">Problemas em Pagamento Pix</option>
                          <option value="reclamacao">Reclamação ou Denúncia de Fraude</option>
                          <option value="parceria">Parcerias e Anúncios Empresariais</option>
                          <option value="outro">Outros Assuntos Gerais</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Como podemos ajudar você?</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Fique à vontade para descrever detalhadamente seu problema ou dúvida..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#E52B50]/30 focus:border-[#E52B50] font-medium resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-[#E52B50] hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Enviando Protocolo...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Enviar Mensagem de Suporte</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* 3. CENTRAL DE AJUDA & FAQS */}
            {activeTab === "ajuda" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Search in help center */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Faça uma pergunta sobre o portal... Ex: Pix, como excluir anúncio, regras..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#E52B50]/30 focus:border-[#E52B50] bg-gray-55/70"
                  />
                  {faqSearch && (
                    <button
                      onClick={() => setFaqSearch("")}
                      className="absolute right-3 top-3 text-[10px] text-gray-400 hover:text-gray-600 font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {filteredFaqs.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl text-xs text-gray-400 font-semibold border border-dashed border-gray-200">
                      Nenhum resultado encontrado para "{faqSearch}". Tente outras palavras ou fale conosco diretamente.
                    </div>
                  ) : (
                    filteredFaqs.map((faq, idx) => {
                      const isExpanded = expandedFaq === idx;
                      return (
                        <div 
                          key={idx}
                          className="border border-gray-150 rounded-2xl bg-white overflow-hidden transition-all hover:border-rose-100"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                            className="w-full px-4 py-3 text-left font-bold text-xs text-gray-800 hover:text-[#E52B50] flex items-center justify-between gap-3 bg-gray-50/20"
                          >
                            <span>{faq.q}</span>
                            <span className={`text-[15px] font-bold text-gray-400 transform transition-transform ${isExpanded ? "rotate-45" : ""}`}>
                              +
                            </span>
                          </button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="p-4 pt-1.5 border-t border-gray-100 text-xs text-gray-500 font-semibold leading-relaxed bg-white">
                                  {faq.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 4. PRIVACIDADE */}
            {activeTab === "privacidade" && (
              <div className="space-y-4 animate-in fade-in duration-200 text-xs text-gray-600 leading-relaxed font-semibold">
                <p className="text-sm font-bold text-gray-800 mb-1">Declaração de Privacidade VivaLocal (LGPD 2026)</p>
                <p>
                  No VivaLocal, valorizamos profundamente a privacidade de nossos usuários. Esta Declaração descreve as informações que coletamos, como são processadas em nosso banco de dados relacional criptografado e por quanto tempo as retemos.
                </p>
                <div className="space-y-3 pt-2">
                  <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">1. Coleta de Dados e Finalidades</h5>
                  <p>
                    Coletamos dados básicos para possibilitar a publicação de anúncios funcionais e chats interativos seguros entre usuários, incluindo nome social opcional, endereço de e-mail e informações geográficas como o seu Código Postal (CEP) para segmentar anúncios da região circundante.
                  </p>

                  <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">2. Criptografia e Armazenamento</h5>
                  <p>
                    Toda a infraestrutura do VivaLocal funciona sob as chaves de acesso do Firebase Firestore com protocolos rigorosos de criptografia no repouso (AES-256) e regras de segurança automatizadas no nível do usuário criador para impedir acesso não autorizado a dados privados de chats ou de contas bancárias de Pix.
                  </p>

                  <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">3. Compartilhamento com Terceiros</h5>
                  <p>
                    Não vendemos dados de usuários para agências de publicidade nem serviços externos. As informações necessárias dos anúncios são publicas para consulta apenas no nível do local. Informações de pagamento via Pix são processadas de forma anônima diretamente por meio de gateways automatizados criptografados.
                  </p>
                </div>
              </div>
            )}

            {/* 5. POLITICA DE COOKIES */}
            {activeTab === "cookies" && (
              <div className="space-y-4 animate-in fade-in duration-200 text-xs text-gray-600 leading-relaxed font-semibold">
                <p className="text-sm font-bold text-gray-800 mb-1">Como Utilizamos Cookies Inteligentes</p>
                <p>
                  Utilizamos cookies e tecnologias similares de persistência local como o <code className="font-mono bg-gray-100 text-gray-800 px-1 py-0.5 rounded">localStorage</code> para melhorar sua experiência de navegação ao salvar seu CEP, Estado selecionado e sessões de chat.
                </p>
                <div className="space-y-3 pt-2">
                  <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">1. Cookies Essenciais de Funcionamento</h5>
                  <p>
                    Estes são necessários para manter você conectado à sua conta de usuário e lembrar quais anúncios você publicou ou marcou como favoritos. A desativação desses registros nos navegadores resultará na impossibilidade de usar nosso chat integrado.
                  </p>

                  <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">2. Cookies de Preferência Regional</h5>
                  <p>
                    Estes nos permitem guardar sua seleção geográfica de busca (como "Moema", "São Paulo" ou seu CEP) para evitar que você tenha que redigitar as informações toda vez que carregar a home page.
                  </p>

                  <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">3. Cookies de Personalização do Gemini AI</h5>
                  <p>
                    Guardam históricos contextuais curtos para alimentar descritores persuasivos personalizados ao publicar novos carros, vagas de empregos ou imóveis de forma ultra-rápida.
                  </p>
                </div>
              </div>
            )}

            {/* 6. TERMOS DE USO */}
            {activeTab === "termos" && (
              <div className="space-y-4 animate-in fade-in duration-200 text-xs text-gray-600 leading-relaxed font-semibold">
                <p className="text-sm font-bold text-gray-800 mb-1">Termos Geral de Convivência e Uso Comercial 2026</p>
                <p>
                  Ao acessar e utilizar os serviços do portal de anúncios VivaLocal, você concorda de forma expressa e irrevogável com os seguintes termos descritos abaixo.
                </p>
                <div className="space-y-3 pt-2">
                  <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">1. Elegibilidade e Atitudes de Boa Fé</h5>
                  <p>
                    Para anunciar produtos e negociar no VivaLocal, você declara ter plena capacidade jurídica mental. Você se compromete a não induzir outros usuários a erro por meio de informações descritivas incorretas de produtos ou imagens fraudulentas.
                  </p>

                  <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">2. Isenção de Responsabilidade Comercial</h5>
                  <p>
                    O VivaLocal funciona estritamente como um catálogo descentralizado de anúncios locais. Não participamos das negociações, não guardamos os produtos anunciados e não nos responsabilizamos civil ou penalmente por transações, trocas físicas ou pagamentos efetuados incorretamente entre terceiros fora de nossa plataforma.
                  </p>

                  <h5 className="font-extrabold text-gray-900 uppercase tracking-widest text-[10px]">3. Conteúdos Proibidos e Exclusões de Conteúdo</h5>
                  <p>
                    É estritamente vedada a publicação de armas de fogo, drogas ilícitas, esquemas de pirâmide financeira, produtos roubados ou serviços infantis inapropriados. Violações nestas categorias resultarão no banimento em definitivo do login de usuário e no envio imediato de logs à polícia cívil nacional.
                  </p>
                </div>
              </div>
            )}

            {/* 7. MAPA DO SITE */}
            {activeTab === "mapa" && (
              <div className="space-y-6 animate-in fade-in duration-200 text-xs">
                <p className="text-[#E52B50] font-bold">Estrutura de Indexação de Classificados VivaLocal</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block border-b border-gray-200 pb-1">Seções Principais</span>
                    <ul className="space-y-1.5 font-bold text-gray-650">
                      <li>• Página Inicial (Classificados da Região)</li>
                      <li>• Criar Anúncio Grátis (Post)</li>
                      <li>• Caixa de Entrada de Mensagens (Direct Chat)</li>
                      <li>• Suporte de Vendas Real-time (PIX Gate)</li>
                      <li>• Centro Operacional Institucional</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block border-b border-gray-200 pb-1">Categorias Indexadas</span>
                    <ul className="space-y-1.5 font-bold text-gray-650">
                      <li>• Veículos (Carros, Motos e Peças)</li>
                      <li>• Imóveis (Aluguel, Compra e Quartos)</li>
                      <li>• Empregos (Vagas e Freelancers)</li>
                      <li>• Serviços (Aulas, Reformas e Fretes)</li>
                      <li>• Adultos (Contatos de Encontros 18+)</li>
                      <li>• Outros (Geral, Computadores e Games)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-[#FFE8EC]/30 p-4 rounded-2xl border border-[#FFB3C1]/30">
                  <p className="text-[10px] text-rose-950 font-semibold leading-relaxed">
                    <strong>Smart Indexing Pro:</strong> Nossos robôs atualizam dinamicamente este Sitemap a cada 5 minutos para os buscadores do Google, Bing e DuckDuckGo, impulsionando a indexação orgânica rápida de cada anúncio de forma imediata.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

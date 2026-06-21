import React, { useState, useEffect } from "react";
import { X, MapPin, Eye, Phone, Mail, User, ShieldCheck, MessageSquare, ArrowRight, Check } from "lucide-react";
import { Ad, UserProfile } from "../types";
import { CATEGORY_LABELS } from "../lib/initialSeed";
import { getRelativeDateString } from "./AdCard";
import { doc, updateDoc, increment, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

interface AdDetailModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenInbox: () => void;
}

export default function AdDetailModal({
  ad,
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onOpenInbox
}: AdDetailModalProps) {
  const [activeImage, setActiveImage] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);

  // Increment view count on open
  useEffect(() => {
    if (isOpen && ad) {
      setActiveImage(ad.images[0] || "");
      setChatMessage("");
      setMsgSuccess(false);

      // Async Firestore increment
      const incrementView = async () => {
        try {
          const adDoc = doc(db, "ads", ad.id);
          await updateDoc(adDoc, {
            views: increment(1)
          });
          ad.views = (ad.views || 0) + 1; // local state increment simulation
        } catch (err) {
          console.log("Could not increment views:", err);
        }
      };
      incrementView();
    }
  }, [isOpen, ad]);

  if (!isOpen || !ad) return null;

  const categoryInfo = CATEGORY_LABELS[ad.category];

  // Initiate a new chat thread
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!chatMessage.trim()) return;

    setSendingMsg(true);

    try {
      const chatId = `${ad.id}_${currentUser.uid}_${ad.sellerId}`;
      
      // 1. Create or set the main Chat coordinator doc
      const chatDocRef = doc(db, "chats", chatId);
      await setDoc(chatDocRef, {
        id: chatId,
        adId: ad.id,
        adTitle: ad.title,
        adPrice: ad.price,
        buyerId: currentUser.uid,
        buyerName: currentUser.displayName || currentUser.email?.split("@")[0] || "Comprador",
        sellerId: ad.sellerId,
        sellerName: ad.sellerName || "Vendedor",
        lastMessage: chatMessage,
        updatedAt: Date.now()
      });

      // 2. Add individual message
      await addDoc(collection(db, "chatMessages"), {
        chatId: chatId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split("@")[0] || "Comprador",
        text: chatMessage,
        createdAt: Date.now()
      });

      setChatMessage("");
      setMsgSuccess(true);
    } catch (err) {
      console.error("Failed to route chat query:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(ad.price);

  const isOwnAd = currentUser?.uid === ad.sellerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto" id="viva-detail-modal">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100 my-8 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Images & Descriptive Specs - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:border-r border-gray-150 flex flex-col justify-between">
          <div>
            {/* Close trigger for mobile */}
            <div className="flex justify-between items-center md:hidden mb-4">
              <span className="text-xs uppercase font-extrabold text-amber-500 tracking-wider">
                {categoryInfo?.label || "VivaLocal"}
              </span>
              <button 
                onClick={onClose} 
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full"
                id="viva-detail-mobile-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Gallery Image Display */}
            <div className="rounded-xl overflow-hidden aspect-video bg-gray-100 border border-gray-200 relative">
              <img
                src={activeImage || ad.images[0]}
                alt={ad.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800";
                }}
              />
            </div>

            {/* Gallery Thumbnails */}
            {ad.images.length > 1 && (
              <div className="flex gap-2 mt-2.5">
                {ad.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                      activeImage === img ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200"
                    }`}
                  >
                    <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Metadata */}
            <div className="mt-5 space-y-2">
              <div className="flex gap-2 items-center text-[10px] uppercase font-extrabold text-amber-500 tracking-wider">
                <span>{categoryInfo?.label || "Geral"}</span>
                <span>•</span>
                <span className="text-gray-400 font-medium">Publicado {getRelativeDateString(ad.createdAt)}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {ad.title}
              </h1>
              
              <div className="text-2xl font-extrabold text-amber-500 tracking-tight mt-1">
                {ad.category === "empregos" ? `${formattedPrice} / mês` : formattedPrice}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {ad.condition && ad.condition !== "nao_aplica" && (
                  <span className="bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                    Condição: {ad.condition === "novo" ? "Novo" : "Usado"}
                  </span>
                )}
                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center">
                  <MapPin className="h-3 w-3 mr-1" /> {ad.locationCity}, {ad.locationState}
                </span>
                <span className="bg-gray-150 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center font-mono">
                  <Eye className="h-3 w-3 mr-1" /> {ad.views || 0} visualizações
                </span>
              </div>
            </div>

            {/* Description Segment */}
            <div className="mt-6">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest border-b border-gray-150 pb-2 mb-3">
                Descrição do Item
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-150">
                {ad.description}
              </p>
            </div>
          </div>
          
          {/* Tag cloud footer */}
          {ad.tags && ad.tags.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-1">
              {ad.tags.map(t => (
                <span key={t} className="text-[10px] text-gray-400 font-mono">#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Seller Panel & Direct Messenger */}
        <div className="w-full md:w-[340px] p-6 bg-gray-50/50 shrink-0 flex flex-col justify-between" id="viva-detail-actions">
          {/* Close button for desktop layout */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 hidden md:block p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
            id="viva-detail-desktop-close"
          >
            <X className="h-5 w-5" />
          </button>

          <div>
            {/* Seller Quick Info ID card */}
            <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-2xs text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-bold text-lg shadow-2xs">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 leading-tight">
                  {ad.sellerName || "Anunciante"}
                </h4>
                <p className="text-[10px] font-mono text-gray-400 mt-0.5">Membro VivaLocal</p>
              </div>

              {/* Safety banner */}
              <div className="p-2.5 bg-emerald-50 rounded-lg flex items-start text-left gap-2 text-emerald-800 text-[10px] leading-snug">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Vendedor com número verificado. Compre com segurança e prefira encontros públicos.</span>
              </div>
            </div>

            {/* Direct Instant Action Callout and real-time chat */}
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Detalhes de Contato</span>
                
                {/* Contact Phone */}
                <a 
                  href={`tel:${ad.sellerPhone}`}
                  className="p-3 bg-white hover:bg-gray-100 border border-gray-150 rounded-xl flex items-center justify-between text-xs text-gray-750 transition-colors w-full cursor-pointer font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-500" />
                    <span>Ligar: {ad.sellerPhone}</span>
                  </div>
                </a>

                {/* Contact Email */}
                {ad.sellerEmail && (
                  <a 
                    href={`mailto:${ad.sellerEmail}`}
                    className="p-3 bg-white hover:bg-gray-100 border border-gray-150 rounded-xl flex items-center justify-between text-xs text-gray-750 transition-colors w-full cursor-pointer font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate max-w-[200px]">{ad.sellerEmail}</span>
                    </div>
                  </a>
                )}
              </div>

              {/* Core Real-time chat system portal */}
              <div className="border-t border-gray-200/80 pt-4 space-y-2.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                  <span>Fale direto com o vendedor</span>
                </span>

                {isOwnAd ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-xs font-semibold text-amber-900">Este é seu anúncio!</p>
                    <p className="text-[10px] text-amber-700 leading-snug mt-1">
                      Você pode visualizar as mensagens enviadas por interessados no seu painel de mensagens no topo.
                    </p>
                  </div>
                ) : msgSuccess ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>Mensagem enviada com sucesso!</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 leading-normal">
                      Sua mensagem foi entregue em tempo real no chat do vendedor. Continue no seu Inbox!
                    </p>
                    <button
                      onClick={onOpenInbox}
                      className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>Ir para Meu Inbox</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleStartChat} className="space-y-1.5">
                    <textarea
                      placeholder="Ex: Olá! Tenho interesse no seu item. Ele ainda está disponível para retirada?"
                      required
                      rows={3}
                      value={chatMessage}
                      disabled={sendingMsg}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-white placeholder:text-gray-400 leading-relaxed"
                    />

                    {currentUser ? (
                      <button
                        type="submit"
                        disabled={sendingMsg}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                        id="viva-detail-send-msg"
                      >
                        {sendingMsg ? "Enviando..." : "Enviar Mensagem no Chat"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Entrar para Chat com Vendedor
                      </button>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="text-center pt-4 md:pt-0">
            <span className="text-[9px] font-mono text-gray-400">VivaLocal Classificados • ID: {ad.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

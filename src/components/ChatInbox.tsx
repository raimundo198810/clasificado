import React, { useState, useEffect, useRef } from "react";
import { X, Send, User, MessageCircle, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import { Chat, ChatMessage, UserProfile } from "../types";
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface ChatInboxProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export default function ChatInbox({ isOpen, onClose, currentUser }: ChatInboxProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Listen to active conversations for this user (either as buyer or seller)
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setLoadingChats(true);

    // Query for conversations where current user is either buyer or seller
    const chatsQuery = query(
      collection(db, "chats"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const allChats: Chat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Chat;
        // Filter in client to bypass complex Firestore composite index configurations
        if (data.buyerId === currentUser.uid || data.sellerId === currentUser.uid) {
          allChats.push(data);
        }
      });
      setChats(allChats);
      setLoadingChats(false);
    }, (error) => {
      console.error("Error querying conversations:", error);
      setLoadingChats(false);
      handleFirestoreError(error, OperationType.GET, "chats");
    });

    return () => unsubscribe();
  }, [isOpen, currentUser]);

  // 2. Listen to messages for the selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    setLoadingMsgs(true);

    const msgsQuery = query(
      collection(db, "chatMessages"),
      where("chatId", "==", selectedChat.id),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as ChatMessage);
      });
      setMessages(list);
      setLoadingMsgs(false);
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, (error) => {
      console.error("Error querying chat messages:", error);
      setLoadingMsgs(false);
      handleFirestoreError(error, OperationType.GET, "chatMessages");
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // Auto-scroll chats bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  // Handle send message reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedChat || !replyText.trim()) return;

    const currentMsg = replyText.trim();
    setReplyText("");

    try {
      // 1. Add Message document
      try {
        await addDoc(collection(db, "chatMessages"), {
          chatId: selectedChat.id,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.email?.split("@")[0] || "Usuário",
          text: currentMsg,
          createdAt: Date.now()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "chatMessages");
      }

      // 2. Update Chat document with last message
      try {
        const chatDocRef = doc(db, "chats", selectedChat.id);
        await updateDoc(chatDocRef, {
          lastMessage: currentMsg,
          updatedAt: Date.now()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `chats/${selectedChat.id}`);
      }
    } catch (err) {
      console.error("SendMessage error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs" id="viva-inbox-modal">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100 flex flex-col h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inbox Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2">
            {selectedChat && (
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-1.5 hover:bg-gray-205 rounded-lg text-gray-500 mr-1"
                title="Voltar para a lista"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <MessageCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <span>Minhas Conversas VivaLocal</span>
              </h2>
              <p className="text-[10px] text-gray-400 font-medium">Bate-papo seguro em tempo real</p>
            </div>
          </div>
          <button 
            id="viva-inbox-close"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Central Workspace Grid */}
        <div className="flex flex-1 overflow-hidden" id="viva-inbox-workspace">
          
          {/* Left panel: Conversations List */}
          <div className={`w-full md:w-[320px] border-r border-gray-150 flex flex-col shrink-0 overflow-y-auto ${
            selectedChat ? "hidden md:flex" : "flex"
          }`}>
            {loadingChats ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 p-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <span className="text-xs font-medium">Carregando bate-papos...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-gray-50/20">
                <MessageCircle className="h-10 w-10 text-gray-300 stroke-1 mb-2.5" />
                <span className="text-xs font-bold text-gray-700 block">Nenhuma conversa pendente</span>
                <p className="text-[10px] text-gray-500 max-w-[200px] leading-relaxed mt-1">
                  Abra um anúncio de interesse e envie uma pergunta direta para encontrar bate-papos ativos aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 flex-1">
                {chats.map((ch) => {
                  const isSought = selectedChat?.id === ch.id;
                  const otherParty = ch.buyerId === currentUser?.uid ? ch.sellerName : ch.buyerName;
                  const isSellerRole = ch.sellerId === currentUser?.uid;

                  return (
                    <div
                      key={ch.id}
                      onClick={() => setSelectedChat(ch)}
                      className={`p-4 cursor-pointer hover:bg-amber-500/5 transition-all text-left flex gap-3 select-none ${
                        isSought ? "bg-amber-50 border-l-4 border-amber-500" : "bg-white"
                      }`}
                    >
                      <div className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm">
                        {otherParty.slice(0, 1).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-xs font-bold text-gray-800 truncate block max-w-[150px]">{otherParty}</span>
                          <span className="text-[9px] font-mono text-gray-400">
                            {new Date(ch.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mb-1 leading-snug">
                          <ShoppingBag className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="truncate max-w-[130px]">{ch.adTitle}</span>
                          {isSellerRole && (
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1 rounded-sm">Vendedor</span>
                          )}
                        </div>
                        
                        <p className="text-[10px] text-gray-400 truncate leading-relaxed">
                          {ch.lastMessage}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Active Chat Thread */}
          <div className={`flex-1 flex flex-col justify-between overflow-hidden relative bg-gray-50/50 ${
            !selectedChat ? "hidden md:flex items-center justify-center text-center p-8 text-gray-400" : "flex"
          }`}>
            {selectedChat ? (
              <>
                {/* Selected Chat info and Title banner */}
                <div className="px-6 py-3 border-b border-gray-150 bg-white shadow-2xs flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                      {(selectedChat.buyerId === currentUser?.uid ? selectedChat.sellerName : selectedChat.buyerName).slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-900">
                        {selectedChat.buyerId === currentUser?.uid ? selectedChat.sellerName : selectedChat.buyerName}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-semibold truncate max-w-[300px]">
                        Ref: {selectedChat.adTitle} • R$ {selectedChat.adPrice.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages stream log */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingMsgs ? (
                    <div className="h-full flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUser?.uid;

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-100`}
                        >
                          <div className={`max-w-[70%] rounded-2xl p-3.5 shadow-2xs text-left ${
                            isMe 
                              ? "bg-amber-500 text-white rounded-br-none" 
                              : "bg-white border border-gray-150 text-gray-800 rounded-bl-none"
                          }`}>
                            {!isMe && (
                              <div className="text-[9px] font-bold text-amber-600 mb-1 leading-none uppercase">
                                {msg.senderName}
                              </div>
                            )}
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <div className="text-[8px] font-mono mt-1 text-right block opacity-75">
                              {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send action footer input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-150 bg-white flex gap-2.5 items-center shrink-0">
                  <input
                    type="text"
                    required
                    maxLength={500}
                    placeholder="Digite sua resposta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-gray-50/50"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-amber-500 hover:bg-amber-600 border border-amber-400 text-white rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
                    title="Enviar resposta"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-3">
                <MessageCircle className="h-12 w-12 text-gray-300 stroke-1 mx-auto" />
                <h4 className="text-sm font-bold text-gray-700">Selecione uma conversa ao lado</h4>
                <p className="text-[10px] text-gray-500 max-w-[240px] mx-auto leading-relaxed">
                  Escolha qualquer chat ativo para ver o histórico completo de perguntas e respostas ou mandar uma réplica.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

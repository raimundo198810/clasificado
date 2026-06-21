import React, { useState, useRef } from "react";
import { MapPin, Eye, ThumbsUp, Calendar, Sparkles } from "lucide-react";
import { Ad } from "../types";
import { CATEGORY_LABELS } from "../lib/initialSeed";
import { motion } from "motion/react";

interface AdCardProps {
  key?: string;
  ad: Ad;
  onClick: () => void;
}

// Simple human-readable date helper
function getRelativeDateString(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `Há ${Math.max(1, diffMins)} min`;
  }
  if (diffHours < 24) {
    return `Hoje às ${new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return "Ontem";
  }
  if (diffDays < 7) {
    return `Há ${diffDays} dias`;
  }
  return new Date(timestamp).toLocaleDateString("pt-BR");
}

export default function AdCard({ ad, onClick }: AdCardProps) {
  const categoryInfo = CATEGORY_LABELS[ad.category];
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(ad.price);

  // States to control 3D Tilt and Shine reflection
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineX, setShineX] = useState(50);
  const [shineY, setShineY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  // Track cursor coordinates inside the card container to compute high-precision 3D angles
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Gentle 3D Tilt: maximum 7 degrees to guarantee high legibility & premium refinement
    const rY = ((x - centerX) / centerX) * 7;
    const rX = ((centerY - y) / centerY) * 7;

    setRotateX(rX);
    setRotateY(rY);

    // Highly responsive shine pointer tracking
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    setShineX(percentX);
    setShineY(percentY);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  // Determine styles depending on the tier/planType
  const isVip = ad.planType === "vip";
  const isDestaque30 = ad.planType === "destaque_30";
  const isDestaque7 = ad.planType === "destaque_7";
  const isPaid = isVip || isDestaque30 || isDestaque7;

  let borderClasses = "border-gray-150 shadow-[0_4px_12px_rgba(0,0,0,0.03),_0_3px_0_0_#e2e8f0] hover:shadow-[0_16px_30px_-6px_rgba(0,0,0,0.08),_0_5px_0_0_#cbd5e1]";
  if (isVip) {
    borderClasses = "border-amber-400 bg-gradient-to-b from-amber-50/20 to-white shadow-[0_8px_25px_rgba(217,119,6,0.18),_0_4px_0_0_#d97706] hover:shadow-[0_24px_45px_rgba(217,119,6,0.28),_0_6px_0_0_#d97706] ring-1 ring-amber-300";
  } else if (isDestaque30) {
    borderClasses = "border-orange-300 bg-gradient-to-b from-orange-50/10 to-white shadow-[0_6px_18px_rgba(249,115,22,0.12),_0_3px_0_0_#f97316] hover:shadow-[0_20px_35px_rgba(249,115,22,0.22),_0_5px_0_0_#f97316]";
  } else if (isDestaque7) {
    borderClasses = "border-amber-200 bg-gradient-to-b from-amber-50/5 to-white shadow-[0_4px_12px_rgba(245,158,11,0.08),_0_3px_0_0_#f59e0b] hover:shadow-[0_16px_30px_rgba(245,158,11,0.18),_0_5px_0_0_#f59e0b]";
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
        scale: isHovered ? (isPaid ? 1.025 : 1.015) : 1,
        y: isHovered ? -5 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 24,
        mass: 0.6
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      onClick={onClick}
      className={`bg-white rounded-2xl border relative transition-all duration-300 ${borderClasses} overflow-hidden cursor-pointer flex flex-col h-full group`}
      id={`viva-ad-card-${ad.id}`}
    >
      {/* Pending status tag for moderation view */}
      {ad.status === "pending" && (
        <div className="absolute top-0 inset-x-0 bg-yellow-500 text-white text-[10px] font-bold text-center py-1 z-40 shadow-xs">
          Aguardando Aprovação Moderador
        </div>
      )}

      {/* Dynamic Shine Light Reflection Layer for 3D Material Effect */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 opacity-100"
          style={{
            background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 65%)`
          }}
        />
      )}

      {/* Ad Image Container with Perspective depth */}
      <div 
        className="relative aspect-video w-full overflow-hidden bg-gray-100"
        style={{ transform: "translateZ(15px)" }}
      >
        <img
          src={ad.images[0] || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600"}
          alt={ad.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600";
          }}
        />

        {/* Plan overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
          {isVip && (
            <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1.5 border border-amber-300 animate-pulse">
              👑 VIP
            </span>
          )}
          {isDestaque30 && (
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 border border-orange-400">
              ⭐ Destaque Premium
            </span>
          )}
          {isDestaque7 && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 border border-amber-400">
              ⭐ Destaque
            </span>
          )}
          
          {/* Trust Seal: Anunciante Verificado */}
          {(isPaid || ad.sellerId === "system_admin_seed") && (
            <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-xs flex items-center gap-1 w-fit">
              ✅ Verificado
            </span>
          )}
        </div>

        {/* Condition details */}
        {ad.condition && ad.condition !== "nao_aplica" && (
          <span className="absolute bottom-2.5 left-2.5 bg-gray-900/85 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
            {ad.condition === "novo" ? "Novo" : "Usado"}
          </span>
        )}

        {/* Advertiser Premium photo in overlay bottom-right for VIPs */}
        {isVip && ad.sellerPhotoUrl && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 z-20">
            <div className="relative">
              <img
                src={ad.sellerPhotoUrl}
                alt={ad.sellerName}
                className="w-9 h-9 rounded-full object-cover border-2 border-amber-400 bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white p-0.5 rounded-full text-[6px] border border-white">
                👑
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section with translated accent colors to viva[local] brand red */}
      <div 
        className="p-4 flex flex-col flex-1 justify-between"
        style={{ transform: "translateZ(10px)" }}
      >
        <div>
          {/* Category & Date Line */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase font-heavy tracking-wider font-sans text-[#E52B50] font-black">
              {categoryInfo?.label || "Geral"} {ad.subCategory ? `• ${ad.subCategory}` : ""}
            </span>
            <div className="flex items-center text-[10px] text-gray-400 font-medium font-mono">
              <Calendar className="h-3 w-3 mr-1" />
              {getRelativeDateString(ad.createdAt)}
            </div>
          </div>

          {/* Ad Title */}
          <h3 className={`text-sm font-bold leading-snug transition-colors mb-2 line-clamp-2 ${
            isVip 
              ? "text-amber-950 group-hover:text-amber-600 text-[15px] font-extrabold" 
              : "text-gray-800 group-hover:text-[#E52B50]"
          }`}>
            {ad.title}
          </h3>
          
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
            {ad.description}
          </p>
        </div>

        {/* Pricing, Location and Stats Footer */}
        <div className="mt-2 pt-2.5 border-t border-gray-100 flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <div className={`text-base tracking-tight font-black ${isVip ? "text-amber-600 text-lg" : "text-gray-950"}`}>
              {ad.category === "empregos" ? `${formattedPrice} / mês` : formattedPrice}
            </div>
            
            {/* Secures lock badge */}
            {isPaid && (
              <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                🔒 Pagamento Seguro
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <div className="flex items-center text-gray-600 truncate max-w-[70%]">
              <MapPin className="h-3.5 w-3.5 text-gray-400 mr-1 shrink-0" />
              <span className="truncate">{ad.locationCity}, {ad.locationState}</span>
            </div>
            
            <div className="flex items-center text-gray-400 font-mono text-xs">
              <Eye className="h-3 w-3.5 mr-1" />
              <span>{ad.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { getRelativeDateString };

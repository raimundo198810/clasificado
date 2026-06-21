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

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
        scale: isHovered ? (ad.featured ? 1.025 : 1.015) : 1,
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
      className={`bg-white rounded-2xl border relative transition-all duration-300 ${
        ad.featured 
          ? "border-amber-450 shadow-[0_4px_12px_rgba(245,158,11,0.12),_0_4px_0_0_#fbbf24] hover:shadow-[0_20px_35px_-8px_rgba(245,158,11,0.22),_0_6px_0_0_#fbbf24]" 
          : "border-gray-150 shadow-[0_4px_12px_rgba(0,0,0,0.03),_0_3px_0_0_#e2e8f0] hover:shadow-[0_16px_30px_-6px_rgba(0,0,0,0.08),_0_5px_0_0_#cbd5e1]"
      } overflow-hidden cursor-pointer flex flex-col h-full group`}
      id={`viva-ad-card-${ad.id}`}
    >
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
            // Fallback in case of expired Unsplash links
            e.currentTarget.src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600";
          }}
        />

        {/* Highlighted Premium Golden Banner */}
        {ad.featured && (
          <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
            <Sparkles className="h-3 w-3 animate-spin text-amber-100" /> Destaque
          </span>
        )}

        {/* Condition details */}
        {ad.condition && ad.condition !== "nao_aplica" && (
          <span className="absolute bottom-2.5 right-2.5 bg-gray-900/85 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
            {ad.condition === "novo" ? "Novo" : "Usado"}
          </span>
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
              {categoryInfo?.label || "Geral"}
            </span>
            <div className="flex items-center text-[10px] text-gray-400 font-medium">
              <Calendar className="h-3 w-3 mr-1" />
              {getRelativeDateString(ad.createdAt)}
            </div>
          </div>

          {/* Ad Title */}
          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#E52B50] transition-colors mb-2">
            {ad.title}
          </h3>
        </div>

        {/* Pricing, Location and Stats Footer */}
        <div className="mt-2 pt-2.5 border-t border-gray-100 flex flex-col gap-1.5">
          <div className="text-base font-black text-gray-950 tracking-tight">
            {ad.category === "empregos" ? `${formattedPrice} / mês` : formattedPrice}
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

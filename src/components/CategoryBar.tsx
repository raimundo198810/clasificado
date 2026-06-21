import React from "react";
import { Home, Car, ShoppingBag, Briefcase, Wrench, Users, Grid, Heart } from "lucide-react";
import { AdCategory } from "../types";
import { CATEGORY_LABELS } from "../lib/initialSeed";

interface CategoryBarProps {
  selectedCategory: AdCategory | "";
  onSelectCategory: (category: AdCategory | "") => void;
}

const CATEGORY_ICONS: Record<AdCategory | "all", React.ElementType> = {
  all: Grid,
  imoveis: Home,
  veiculos: Car,
  compra_venda: ShoppingBag,
  empregos: Briefcase,
  servicos: Wrench,
  comunidade: Users,
  adulto: Heart
};

export default function CategoryBar({ selectedCategory, onSelectCategory }: CategoryBarProps) {
  return (
    <div className="bg-white border-b border-gray-150 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]" id="viva-category-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 scrollbar-none gap-3 pt-2">
          {/* "TODOS" button with 3D tactile push */}
          <button
            id="viva-cat-all"
            onClick={() => onSelectCategory("")}
            className={`flex items-center space-x-2 px-4.5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
              selectedCategory === ""
                ? "bg-slate-900 border-slate-900 text-white shadow-[0_4px_0_0_#0f172a,0_8px_16px_-4px_rgba(15,23,42,0.3)] -translate-y-1"
                : "bg-white border-slate-200 text-slate-700 shadow-[0_3px_0_0_#e2e8f0,0_4px_8px_-2px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#cbd5e1,0_8px_12px_-3px_rgba(0,0,0,0.08)] active:translate-y-0.5 active:shadow-[0_0px_0_0_#cbd5e1,0_2px_4px_rgba(0,0,0,0.04)]"
            }`}
          >
            <Grid className="h-4 w-4" />
            <span>Todos os Anúncios</span>
          </button>

          {/* Individual Category buttons with rich 3D tactile push */}
          {(Object.keys(CATEGORY_LABELS) as AdCategory[]).map((cat) => {
            const info = CATEGORY_LABELS[cat];
            const Icon = CATEGORY_ICONS[cat];
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                id={`viva-cat-${cat}`}
                onClick={() => onSelectCategory(cat)}
                className={`flex items-center space-x-2 px-4.5 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-150 border cursor-pointer transform ${
                  isSelected
                    ? "bg-[#E52B50] border-[#E52B50] text-white shadow-[0_4px_0_0_#9a1631,0_8px_16px_-4px_rgba(229,43,80,0.35)] -translate-y-1"
                    : "bg-white border-slate-200 text-slate-700 shadow-[0_3px_0_0_#e2e8f0,0_4px_8px_-2px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#cbd5e1,0_8px_12px_-3px_rgba(0,0,0,0.08)] hover:text-[#E52B50] active:translate-y-0.5 active:shadow-[0_0px_0_0_#cbd5e1,0_2px_4px_rgba(0,0,0,0.04)]"
                }`}
                title={info.description}
              >
                {Icon && <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-[#E52B50]"}`} />}
                <span>{info.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

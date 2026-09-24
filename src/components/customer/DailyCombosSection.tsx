"use client";

import React, { useState } from "react";
import { ComboType } from "@/types";
import { useCart } from "@/context/CartContext";
import { Users, ShoppingBag, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface DailyCombosSectionProps {
  combos: ComboType[];
}

export default function DailyCombosSection({ combos }: DailyCombosSectionProps) {
  const { addCombo } = useCart();
  const [addedComboId, setAddedComboId] = useState<string | null>(null);

  if (!combos || combos.length === 0) {
    return null;
  }

  const handleOrderCombo = (combo: ComboType) => {
    if (combo.isPartiallyUnavailable) return;
    addCombo(combo, 1);
    setAddedComboId(combo.id);
    setTimeout(() => {
      setAddedComboId(null);
    }, 1800);
  };

  return (
    <section id="daily-combos" className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-surface/80 via-surface/40 to-background border-y border-border/60 relative overflow-hidden">
      {/* Neon Glow accents */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-60 sm:w-80 h-60 sm:h-80 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] sm:text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 fill-primary" /> SPECIAL MIDNIGHT COMBO
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-heading">
            🔥 DAILY MIDNIGHT COMBOS
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-zinc-300 max-w-xl mx-auto">
            Handcrafted chef specials designed for late-night hunger. Freshly curated and updated daily.
          </p>
        </div>

        {/* Combos Cards Grid: 1 on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {combos.map((combo) => {
            const isAdded = addedComboId === combo.id;
            const isUnavailable = combo.isPartiallyUnavailable;

            return (
              <div
                key={combo.id}
                className={`flex flex-col justify-between rounded-3xl p-5 sm:p-7 bg-surface border transition-all duration-300 relative group overflow-hidden ${
                  isUnavailable
                    ? "border-red-500/30 opacity-80"
                    : "border-primary/40 hover:border-primary shadow-glow hover:scale-[1.01]"
                }`}
              >
                {/* Header Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                    <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-black font-black text-xs uppercase tracking-wider shadow-sm">
                      COMBO {combo.comboNumber}
                    </span>
                    {combo.servingPeople && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-zinc-300 text-xs font-bold">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        {combo.servingPeople}
                      </span>
                    )}
                  </div>

                  {/* Combo Title */}
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2 font-heading group-hover:text-primary transition-colors">
                    {combo.name}
                  </h3>
                  {combo.description && (
                    <p className="text-xs text-zinc-400 mb-4 sm:mb-5 leading-relaxed">
                      {combo.description}
                    </p>
                  )}

                  {/* Included Items List */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-raised border border-border/80 mb-5 sm:mb-6 space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary block border-b border-border/60 pb-1.5 mb-2">
                      Included in this Feast:
                    </span>
                    <ul className="space-y-1.5">
                      {combo.items.map((item, idx) => {
                        const itemName = item.product?.name || item.customItemName || "Item";
                        const isItemOff = item.product && (!item.product.isAvailable || item.product.isDeleted);

                        return (
                          <li
                            key={idx}
                            className={`text-xs flex items-center justify-between gap-2 ${
                              isItemOff ? "text-red-400 line-through" : "text-zinc-200"
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span className="truncate">{itemName}</span>
                            </span>
                            <span className="font-bold text-zinc-400 flex-shrink-0">× {item.quantity}</span>
                          </li>
                        );
                      })}
                    </ul>

                    {isUnavailable && combo.unavailableItemNames && combo.unavailableItemNames.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-red-500/20 flex items-center gap-1.5 text-[11px] text-red-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Unavailable: {combo.unavailableItemNames.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Price & Action */}
                <div>
                  <div className="flex items-baseline justify-between mb-4 pt-3 border-t border-border/60">
                    <div>
                      <span className="text-[11px] text-zinc-400 block font-bold uppercase">Combo Price</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-primary">
                          {formatINR(combo.price)}
                        </span>
                        {combo.originalPrice && combo.originalPrice > combo.price && (
                          <span className="text-xs sm:text-sm text-zinc-500 line-through font-semibold">
                            {formatINR(combo.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOrderCombo(combo)}
                    disabled={isUnavailable}
                    className={`w-full py-3 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 min-h-[48px] ${
                      isUnavailable
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-border"
                        : isAdded
                        ? "bg-emerald-500 text-black scale-95"
                        : "bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-400 text-black shadow-glow hover:scale-105 active:scale-95"
                    }`}
                  >
                    {isUnavailable ? (
                      <>
                        <AlertTriangle className="w-4 h-4" /> Currently Unavailable
                      </>
                    ) : isAdded ? (
                      <>
                        <CheckCircle className="w-4 h-4 stroke-[3]" /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 stroke-[2.5]" /> Order Combo
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

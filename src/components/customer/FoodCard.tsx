"use client";

import React from "react";
import Link from "next/link";
import { Plus, Minus, Flame, Sparkles, Clock } from "lucide-react";
import { ProductType } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";

interface FoodCardProps {
  product: ProductType;
}

export default function FoodCard({ product }: FoodCardProps) {
  const { items, addItem, updateQuantity } = useCart();

  // Find cart entry for this product
  const cartItem = items.find((i) => i.productId === product.id && !i.isCombo);
  const totalQtyInCart = cartItem ? cartItem.quantity : 0;

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.id, 1);
    } else {
      addItem(product, 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.id, -1);
    }
  };

  return (
    <div className="group relative rounded-2xl bg-surface border border-border/80 hover:border-primary/50 transition-all duration-300 flex flex-col overflow-hidden shadow-card hover:shadow-glow glass-card-hover w-full">
      {/* Top Image Container with Controlled Aspect Ratio */}
      <Link
        href={`/product/${product.id}`}
        className="relative w-full aspect-[4/3] bg-surface-raised overflow-hidden block"
      >
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            !product.isAvailable ? "grayscale opacity-50" : ""
          }`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/30" />

        {/* Badges: Veg/Non-Veg + Featured */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1.5 sm:gap-2">
          <div
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center bg-black/70 backdrop-blur-md ${
              product.isVeg
                ? "border-emerald-500"
                : "border-rose-500"
            }`}
            title={product.isVeg ? "Vegetarian" : "Non-Vegetarian"}
          >
            <div
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                product.isVeg ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </div>

          {product.isPopular && (
            <span className="px-2 py-0.5 rounded-full bg-primary/90 text-black text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-glow">
              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-black" /> Best Seller
            </span>
          )}
          {product.isFeatured && !product.isPopular && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 text-[10px] sm:text-[11px] font-bold tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Special
            </span>
          )}
        </div>

        {/* Prep time badge */}
        <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 text-[10px] sm:text-[11px] font-semibold text-zinc-300 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1">
          <Clock className="w-3 h-3 text-primary" /> {product.preparationTime} mins
        </div>

        {/* Unavailable Overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 text-center">
            <span className="px-3 py-1 rounded-full bg-rose-950/90 border border-rose-600 text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              Currently Unavailable
            </span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/product/${product.id}`} className="block">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1 font-heading">
              {product.name}
            </h3>
          </Link>
          <p className="text-[11px] sm:text-xs md:text-sm text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Add Action */}
        <div className="mt-3.5 pt-2.5 sm:pt-3 border-t border-border/60 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] sm:text-xs text-zinc-500 block -mb-0.5 uppercase font-bold">Price</span>
            <span className="text-base sm:text-lg md:text-xl font-extrabold text-white">
              {formatINR(product.price)}
            </span>
          </div>

          {/* Interactive Add to Cart Stepper (Min 44px touch height) */}
          {product.isAvailable ? (
            totalQtyInCart === 0 ? (
              <button
                onClick={handleAddClick}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-600 hover:from-primary-hover hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-glow hover:scale-105 active:scale-95 transition-all min-h-[40px] sm:min-h-[44px]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> ADD
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-surface-raised border border-primary/40 rounded-xl p-1 shadow-glow min-h-[40px] sm:min-h-[44px]">
                <button
                  onClick={handleDecrement}
                  className="w-8 h-8 rounded-lg bg-surface hover:bg-primary/20 text-white hover:text-primary flex items-center justify-center transition-colors active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-xs sm:text-sm text-primary min-w-[18px] text-center">
                  {totalQtyInCart}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-8 h-8 rounded-lg bg-primary text-black hover:bg-primary-hover flex items-center justify-center transition-colors font-bold active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            )
          ) : (
            <button
              disabled
              className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-500 font-bold text-xs cursor-not-allowed uppercase min-h-[40px]"
            >
              Sold Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

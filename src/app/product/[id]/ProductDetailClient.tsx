"use client";

import React, { useState } from "react";
import {
  Flame,
  Clock,
  Plus,
  Minus,
  Check,
  ShoppingBag,
} from "lucide-react";
import { ProductType } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";

interface ProductDetailClientProps {
  product: ProductType;
}

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const unitPrice = product.price;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Left Food Image Showcase */}
      <div className="lg:col-span-6 relative">
        <div className="relative rounded-3xl overflow-hidden bg-surface border border-border shadow-2xl p-2.5">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-80 sm:h-96 lg:h-[420px] object-cover rounded-2xl"
          />

          {/* Badges Overlay */}
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded border flex items-center justify-center bg-black/70 backdrop-blur-md ${
                product.isVeg ? "border-emerald-500" : "border-rose-500"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  product.isVeg ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
            </div>
            {product.isPopular && (
              <span className="px-3 py-1 rounded-full bg-primary text-black font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-glow">
                <Flame className="w-3.5 h-3.5 fill-black" /> Popular Best Seller
              </span>
            )}
          </div>

          <div className="absolute bottom-6 left-6 text-xs font-bold text-zinc-200 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" /> Prep time: {product.preparationTime} mins
          </div>
        </div>
      </div>

      {/* Right Product Details */}
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-1.5">
            {product.category?.name}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">
            {product.name}
          </h1>
          <p className="text-sm text-zinc-300 mt-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing Header */}
        <div className="p-4 rounded-2xl bg-surface border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Price</span>
            <span className="text-2xl font-black text-white">
              {formatINR(product.price)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 block">Total ({quantity} item{quantity > 1 ? "s" : ""})</span>
            <span className="text-2xl font-black text-primary">
              {formatINR(totalPrice)}
            </span>
          </div>
        </div>

        {/* Quantity and Add to Cart Row */}
        <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row items-center gap-4">
          {/* Quantity Stepper */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 bg-surface border border-border rounded-2xl p-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-xl bg-surface-raised hover:bg-primary/20 text-white hover:text-primary flex items-center justify-center transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-lg text-white min-w-[28px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-xl bg-primary text-black hover:bg-primary-hover flex items-center justify-center transition-colors font-bold"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Add to Cart Button */}
          {product.isAvailable ? (
            <button
              onClick={handleAddToCart}
              className={`w-full sm:flex-1 py-4 px-6 rounded-2xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all ${
                isAdded
                  ? "bg-emerald-500 text-black shadow-glow"
                  : "bg-gradient-to-r from-primary to-orange-600 hover:from-primary-hover hover:to-orange-500 text-black shadow-glow hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" /> Added to Order!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                  <span>Add to Order • {formatINR(totalPrice)}</span>
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-zinc-800 text-zinc-500 font-bold text-sm cursor-not-allowed uppercase"
            >
              Currently Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

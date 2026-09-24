"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  Building2,
  AlertCircle,
  Users,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    deliveryCharge,
    grandTotal,
    specialNote,
    setSpecialNote,
    orderType,
    setOrderType,
    updateQuantity,
    clearCart,
  } = useCart();

  const { settings } = useStore();
  const minOrderThreshold = settings?.minOrderAmount ?? 199;
  const isMinOrderMet = subtotal >= minOrderThreshold;

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 300) {
      setSpecialNote(val);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">
              YOUR CART
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Review your late-night food items, add special kitchen requests, and proceed to checkout.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 p-2 rounded-xl hover:bg-rose-950/30 transition-colors min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-surface/40 border border-border rounded-3xl p-6 sm:p-8 max-w-lg mx-auto space-y-4 sm:space-y-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto shadow-glow">
              <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
              Your midnight fuel tank is empty.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              Fuel your cravings with authentic Mandhi, crispy chicken, burgers & daily combos.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/#daily-combos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-glow transition-all min-h-[48px]"
              >
                🔥 DAILY COMBOS
              </Link>
              <Link
                href="/menu"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all min-h-[48px]"
              >
                EXPLORE MENU <ArrowRight className="w-4 h-4 text-primary" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left: Itemized list & Special Request Note */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {/* Order Type Toggle (Delivery vs Pickup) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Order Type:
                </span>
                <div className="grid grid-cols-2 gap-2 bg-surface-raised p-1 rounded-xl border border-border w-full sm:w-auto">
                  <button
                    onClick={() => setOrderType("DELIVERY")}
                    className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                      orderType === "DELIVERY"
                        ? "bg-primary text-black shadow-glow font-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" /> Home Delivery
                  </button>
                  <button
                    onClick={() => setOrderType("PICKUP")}
                    className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                      orderType === "PICKUP"
                        ? "bg-primary text-black shadow-glow font-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Kitchen Pickup
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 sm:space-y-4">
                {items.map((item) => {
                  if (item.isCombo) {
                    const itemTotalPrice = item.price * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 rounded-2xl bg-surface border border-primary/40 shadow-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        {/* Image & Title */}
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-border flex-shrink-0"
                          />
                          <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-primary text-black text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> DAILY COMBO
                              </span>
                              {item.servingPeople && (
                                <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                                  <Users className="w-3 h-3 text-primary" /> {item.servingPeople}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-black text-white font-heading truncate">
                              {item.name}
                            </h3>

                            {/* Included dishes list in cart */}
                            {item.comboItems && item.comboItems.length > 0 && (
                              <div className="text-[10px] sm:text-[11px] text-zinc-300 bg-surface-raised p-2 rounded-lg border border-border/60">
                                <span className="font-bold text-primary block mb-0.5">Includes:</span>
                                <ul className="space-y-0.5">
                                  {item.comboItems.map((ci, idx) => (
                                    <li key={idx} className="text-zinc-400">
                                      • {ci.name} × {ci.quantity}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <span className="text-xs text-zinc-400 block font-semibold">
                              {formatINR(item.price)} each
                            </span>
                          </div>
                        </div>

                        {/* Quantity Stepper & Price */}
                        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4 pt-2.5 sm:pt-0 border-t sm:border-0 border-border/60">
                          <div className="flex items-center gap-1.5 bg-surface-raised border border-border rounded-xl p-1">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 rounded-lg bg-surface hover:bg-rose-950 text-zinc-300 hover:text-rose-400 flex items-center justify-center transition-colors"
                              aria-label="Decrease quantity"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-3.5 h-3.5" />
                              ) : (
                                <Minus className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span className="font-bold text-sm text-white min-w-[20px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 rounded-lg bg-primary text-black hover:bg-primary-hover flex items-center justify-center font-bold transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="text-base sm:text-lg font-black text-primary">
                              {formatINR(itemTotalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Regular Dish (No Add-ons)
                  const itemTotalPrice = item.price * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-5 rounded-2xl bg-surface border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 glass-card-hover"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover border border-border flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                                item.isVeg ? "border-emerald-500" : "border-rose-500"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.isVeg ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-white font-heading truncate">
                              {item.name}
                            </h3>
                          </div>

                          <span className="text-xs text-zinc-400 block mt-1 font-semibold">
                            {formatINR(item.price)} each
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-border/60">
                        <div className="flex items-center gap-1.5 bg-surface-raised border border-border rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-lg bg-surface hover:bg-rose-950 text-zinc-300 hover:text-rose-400 flex items-center justify-center transition-colors"
                            aria-label="Decrease quantity"
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="w-3.5 h-3.5" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="font-bold text-sm text-white min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-lg bg-primary text-black hover:bg-primary-hover flex items-center justify-center font-bold transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="text-base sm:text-lg font-extrabold text-white">
                            {formatINR(itemTotalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SPECIAL NOTE / REQUEST INPUT BOX (Responsive: width 100%, min-h 100px, 0/300 counter) */}
              <div className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-2.5 sm:space-y-3 shadow-card w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
                    <MessageSquare className="w-4 h-4 text-primary" /> SPECIAL NOTE / REQUEST
                  </h3>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {specialNote.length} / 300
                  </span>
                </div>

                <div className="relative w-full">
                  <textarea
                    rows={4}
                    maxLength={300}
                    value={specialNote}
                    onChange={handleNoteChange}
                    placeholder="Any special request? Example: Less spicy, no onions, extra sauce, please pack separately..."
                    className="w-full min-h-[100px] rounded-xl bg-surface-raised border border-border p-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                <p className="text-[10px] sm:text-[11px] text-zinc-500 italic">
                  "Special requests are subject to kitchen availability." (0 extra charge)
                </p>
              </div>

              {/* Add more food CTA */}
              <div className="pt-1 flex items-center gap-4">
                <Link
                  href="/#daily-combos"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  🔥 Add Daily Combos
                </Link>
                <span className="text-zinc-600">•</span>
                <Link
                  href="/menu"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  + Add dishes from menu
                </Link>
              </div>
            </div>

            {/* Right: Order Summary (Single column on mobile, sticky side card on desktop) */}
            <div className="lg:col-span-5 space-y-6 w-full">
              <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-card">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-3 font-heading">
                  Bill Summary
                </h3>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span>Food Subtotal ({itemCount} items)</span>
                    <span className="font-semibold text-white">
                      {formatINR(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-300">
                    <div>
                      <span>Delivery Charge</span>
                      {orderType === "DELIVERY" && (
                        <span className="text-[10px] sm:text-[11px] text-zinc-500 block">
                          Based on delivery distance
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-white">
                      {orderType === "PICKUP" ? (
                        <span className="text-emerald-400 font-bold">FREE</span>
                      ) : (
                        formatINR(deliveryCharge)
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-border/80 flex items-center justify-between">
                    <div>
                      <span className="text-sm sm:text-base font-extrabold text-white block font-heading">
                        Grand Total
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-zinc-500">
                        No GST • No Extra Note Fee
                      </span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-primary font-heading">
                      {formatINR(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Min order check message */}
                {!isMinOrderMet && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Add items worth {formatINR(minOrderThreshold - subtotal)} more to satisfy minimum order of {formatINR(minOrderThreshold)}.
                    </span>
                  </div>
                )}

                {/* Checkout CTA (Min 48px touch height) */}
                <div className="pt-2">
                  {isMinOrderMet ? (
                    <Link
                      href="/checkout"
                      className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-primary to-orange-600 hover:from-primary-hover hover:to-orange-500 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all min-h-[48px]"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-zinc-800 text-zinc-500 font-extrabold text-xs sm:text-sm uppercase tracking-wider cursor-not-allowed text-center min-h-[48px]"
                    >
                      Min. Order {formatINR(minOrderThreshold)} Required
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

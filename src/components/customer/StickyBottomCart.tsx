"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";

export default function StickyBottomCart() {
  const pathname = usePathname();
  const { itemCount, subtotal } = useCart();

  // Hide sticky bar if cart is empty or user is already on cart/checkout/success/admin pages
  if (itemCount === 0) return null;
  if (
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/order-success" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/invoice")
  ) {
    return null;
  }

  return (
    <aside aria-label="Quick cart bar" className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none md:hidden animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto pointer-events-auto">
        <Link
          href="/cart"
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-orange-600 text-black font-extrabold shadow-2xl shadow-primary/40 border border-primary/50 hover:brightness-110 active:scale-[0.99] transition-all min-h-[52px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wider uppercase block leading-tight">
                {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"} • {formatINR(subtotal)}
              </span>
              <span className="text-[10px] text-black/80 font-bold block leading-tight">
                Tap to review order & checkout
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-black tracking-wider uppercase bg-black text-primary px-3 py-1.5 rounded-xl shadow-sm">
            <span>VIEW CART</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </Link>
      </div>
    </aside>
  );
}

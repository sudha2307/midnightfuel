"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";

export default function MobileCartBar() {
  const pathname = usePathname();
  const { itemCount, subtotal } = useCart();

  // Hide on cart, checkout, order success, track, invoice and admin pages
  if (
    itemCount === 0 ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/order-success") ||
    pathname.startsWith("/invoice") ||
    pathname.startsWith("/track-order") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <aside aria-label="Quick cart bar" className="fixed bottom-3 left-3 right-3 z-40 md:hidden animate-in slide-in-from-bottom duration-300 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <Link
          href="/cart"
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-amber-500 text-black font-extrabold shadow-2xl shadow-primary/40 border border-primary/60 active:scale-[0.98] transition-all min-h-[52px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider block leading-tight text-black/90">
                🛒 {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"}
              </span>
              <span className="text-sm font-black tracking-wide block leading-tight text-black">
                {formatINR(subtotal)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-black uppercase tracking-wider bg-black text-primary px-3.5 py-1.5 rounded-xl shadow-sm">
            <span>VIEW CART</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </Link>
      </div>
    </aside>
  );
}

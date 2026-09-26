"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Flame,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  PhoneCall,
  Search,
  Sparkles,
  UtensilsCrossed,
  Clock,
  User,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";

export default function Navbar() {
  const pathname = usePathname();
  const { itemCount, subtotal } = useCart();
  const { settings, status } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cleanWhatsapp = (settings?.whatsapp || "+91 90801 39363").replace(/[^0-9]/g, "");
  const businessName = settings?.businessName || "Midnight Fuel";
  const tagline = settings?.tagline || "Eat • Enjoy • Recharge";

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Menu", href: "/menu" },
    { name: "Combos", href: "/#daily-combos" },
    { name: "My Orders", href: "/orders" },
    { name: "Profile", href: "/profile" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur-xl transition-all">
      {/* Top Operating Hours Status Ticker */}
      <div
        className={`w-full py-1.5 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold border-b transition-colors ${
          status.isOpen
            ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/30"
            : "bg-amber-950/50 text-amber-400 border-amber-900/30"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                status.isOpen
                  ? "bg-emerald-400 animate-ping"
                  : "bg-amber-400"
              }`}
            />
            <span className="font-extrabold tracking-wider whitespace-nowrap">{status.badgeText}</span>
            <span className="text-zinc-300 truncate hidden xs:inline">{status.subText}</span>
            <span className="text-zinc-400 text-[10px] hidden md:inline">
              ({status.nextChangeText})
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-zinc-400 text-[11px] flex-shrink-0">
            <span className="hidden lg:inline">🌙 Authentic Late Night Cloud Kitchen</span>
            <a
              href={`https://wa.me/${cleanWhatsapp || "919080139363"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 font-bold whitespace-nowrap"
            >
              <PhoneCall className="w-3 h-3" /> <span className="hidden sm:inline">WhatsApp</span> Orders
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto pl-1 pr-3 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
        {/* logo */}
        <Link href="/" className="flex items-center group flex-shrink-0 -ml-1 sm:ml-0" aria-label={businessName}>
          <div className="flex items-center justify-start">
            <Image
              src="/images/logo2.png"
              alt={businessName}
              width={260}
              height={80}
              className="h-14 w-auto xs:h-16 sm:h-20 lg:h-22 object-contain object-left group-hover:scale-105 transition-transform"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || (link.href !== "/#daily-combos" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                  isActive
                    ? "text-primary bg-primary/10 border border-primary/20 shadow-sm"
                    : "text-zinc-300 hover:text-white hover:bg-surface-raised"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Search, Cart, Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/profile"
            className={`p-2.5 rounded-xl transition-colors hidden sm:flex items-center gap-1.5 text-xs font-bold ${
              pathname === "/profile"
                ? "bg-primary/20 text-primary border border-primary/40 shadow-glow"
                : "text-zinc-400 hover:text-white hover:bg-surface-raised border border-transparent"
            }`}
            title="User Profile & Order History"
          >
            <User className="w-4 h-4 text-primary" />
            <span className="hidden lg:inline">Profile</span>
          </Link>

          <Link
            href="/menu"
            className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-surface-raised transition-colors hidden sm:flex items-center"
            title="Browse full menu"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Cart Trigger */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/40 text-white hover:border-primary hover:bg-primary/30 transition-all shadow-glow min-h-[44px]"
            aria-label="Shopping Cart"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-primary text-black font-black text-[10px] sm:text-xs flex items-center justify-center animate-bounce shadow-glow">
                  {itemCount}
                </span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[10px] text-zinc-400 block -mb-0.5 font-bold uppercase">Cart</span>
              <span className="text-xs sm:text-sm font-black text-primary">
                ₹{subtotal.toFixed(0)}
              </span>
            </div>
          </Link>

          {/* Mobile Menu Button (Min 44px touch target) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-11 h-11 rounded-xl text-zinc-300 hover:text-white bg-surface-raised border border-border flex items-center justify-center transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || (link.href !== "/#daily-combos" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold min-h-[44px] transition-colors ${
                  isActive
                    ? "text-primary bg-primary/15 border border-primary/30 font-black"
                    : "text-zinc-200 hover:bg-surface-raised"
                }`}
              >
                <span>{link.name}</span>
                <span className="text-xs text-zinc-500">→</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white bg-surface-raised border border-border/60 flex items-center gap-1.5"
            >
              🔒 Kitchen Admin Portal
            </Link>
            <Link
              href="/menu"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" /> Full Menu
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

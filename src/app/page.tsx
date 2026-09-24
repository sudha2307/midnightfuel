import React from "react";
import Link from "next/link";
import {
  Flame,
  ArrowRight,
  Clock,
  Zap,
  ShieldCheck,
  Star,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import prisma from "@/lib/prisma";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import FoodCard from "@/components/customer/FoodCard";
import DailyCombosSection from "@/components/customer/DailyCombosSection";
import { ComboType } from "@/types";

import { formatTime12Hour } from "@/lib/business-hours";

// Fetch popular products, categories, daily combos & live settings on server
async function getHomePageData() {
  try {
    const [popularProducts, categories, combos, settings] = await Promise.all([
      prisma.product.findMany({
        where: { isPopular: true, isAvailable: true, isDeleted: false },
        include: { category: true },
        take: 8,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        take: 8,
      }),
      prisma.combo.findMany({
        where: { isActive: true },
        include: {
          items: {
            include: { product: true },
          },
        },
        orderBy: [{ displayOrder: "asc" }, { comboNumber: "asc" }],
      }),
      prisma.businessSettings.findUnique({
        where: { id: "default-settings" },
      }),
    ]);

    const now = new Date();

    const formattedCombos = combos
      .filter((combo) => {
        if (combo.validFrom && new Date(combo.validFrom) > now) return false;
        if (combo.validUntil) {
          const until = new Date(combo.validUntil);
          until.setHours(23, 59, 59, 999);
          if (now > until) return false;
        }
        return true;
      })
      .map((combo) => {
        const unavailableItems: string[] = [];
        for (const item of combo.items) {
          if (item.product && (!item.product.isAvailable || item.product.isDeleted)) {
            unavailableItems.push(item.product.name);
          }
        }
        return {
          ...combo,
          isPartiallyUnavailable: unavailableItems.length > 0,
          unavailableItemNames: unavailableItems,
        };
      });

    return { popularProducts, categories, combos: formattedCombos as unknown as ComboType[], settings };
  } catch (e) {
    console.error("Failed to load homepage data", e);
    return { popularProducts: [], categories: [], combos: [], settings: null };
  }
}

export default async function HomePage() {
  const { popularProducts, categories, combos, settings } = await getHomePageData();

  const businessName = settings?.businessName || "Midnight Fuel";
  const openTimeDisplay = formatTime12Hour(settings?.openingTime || "19:00");
  const closeTimeDisplay = formatTime12Hour(settings?.closingTime || "02:00");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20 md:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* ===================================================
            HERO SECTION (MOBILE FIRST & FULLY RESPONSIVE)
            =================================================== */}
        <section className="relative pt-8 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden">
          {/* Subtle Background Glow Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-10 right-10 w-48 sm:w-72 h-48 sm:h-72 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Hero Content */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
                {/* Late night operating badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-raised border border-primary/30 shadow-glow">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-primary">
                    🌙 {openTimeDisplay} – {closeTimeDisplay} • LATE NIGHT FOOD
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] font-heading uppercase">
                  {businessName} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-300 neon-text-glow">
                    LATE NIGHT CRAVINGS
                  </span>
                </h1>

                <p className="text-xs sm:text-base lg:text-lg text-zinc-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Fresh, hot and delicious food delivered across the night. Authentic Arabian Mandhi, juicy crispy burgers, butter chicken, and chilled shakes ready when your cravings strike.
                </p>

                {/* Hero CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                  <Link
                    href="/menu"
                    className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-primary to-orange-600 hover:from-primary-hover hover:to-orange-500 text-black font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-glow hover:scale-105 active:scale-95 transition-all uppercase min-h-[48px]"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" /> ORDER NOW
                  </Link>

                  <a
                    href="#daily-combos"
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl bg-surface-raised hover:bg-surface border border-primary/40 hover:border-primary text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all hover:scale-105 min-h-[48px]"
                  >
                    🔥 Daily Combos <ArrowRight className="w-4 h-4 text-primary" />
                  </a>
                </div>

                {/* Key stats row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-border/60 max-w-md mx-auto lg:mx-0 text-center">
                  <div>
                    <span className="block text-base sm:text-2xl font-extrabold text-white">
                      30 Mins
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Avg. Delivery</span>
                  </div>
                  <div>
                    <span className="block text-base sm:text-2xl font-extrabold text-primary">
                      4.9 ★
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Customer Rating</span>
                  </div>
                  <div>
                    <span className="block text-base sm:text-2xl font-extrabold text-white">
                      100%
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Fresh & Hot</span>
                  </div>
                </div>
              </div>

              {/* Right Hero Visual Feature */}
              <div className="lg:col-span-5 relative mt-4 lg:mt-0">
                <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
                  {/* Glowing card container */}
                  <div className="relative rounded-3xl overflow-hidden border border-border/80 bg-surface shadow-2xl p-2">
                    <img
                      src="https://t3.ftcdn.net/jpg/08/04/74/12/240_F_804741299_BYgXICzscExPiPDTWPVh3n0jel9nVtHT.jpg"
                      alt="Grill Chicken Mandhi"
                      className="w-full aspect-[4/3] object-cover rounded-2xl"
                    />
                    <div className="absolute inset-x-2 bottom-2 p-3.5 sm:p-5 bg-gradient-to-t from-black via-black/80 to-transparent rounded-2xl flex items-end justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-primary text-black text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider inline-block mb-1">
                          Signature Dish
                        </span>
                        <h3 className="text-base sm:text-xl font-extrabold text-white">
                          Grill Chicken Mandhi
                        </h3>
                        <p className="text-[10px] sm:text-xs text-zinc-300">Yemeni Spiced • Toum Dip • Fragrant Rice</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] sm:text-xs text-zinc-400 block">From</span>
                        <span className="text-xl sm:text-2xl font-black text-primary">₹220</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            CATEGORY QUICK SCROLLER
            =================================================== */}
        <section className="py-4 sm:py-6 border-y border-border/60 bg-surface/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
              <Link
                href="/menu"
                className="px-4 py-2 sm:py-2.5 rounded-xl bg-primary text-black font-extrabold text-xs sm:text-sm whitespace-nowrap shadow-glow hover:scale-105 transition-all flex items-center gap-1.5 flex-shrink-0 min-h-[40px]"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" /> ALL MENU
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/menu?category=${cat.slug}`}
                  className="px-3.5 py-2 sm:py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-border/80 hover:border-primary/50 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 min-h-[40px]"
                >
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================
            🔥 DAILY COMBOS SECTION
            =================================================== */}
        <DailyCombosSection combos={combos} />

        {/* ===================================================
            POPULAR ITEMS / BEST SELLERS
            =================================================== */}
        <section className="py-12 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-1">
                  Midnight Favorites
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
                  POPULAR BEST SELLERS
                </h2>
              </div>

              <Link
                href="/menu"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-hover transition-colors"
              >
                Explore Full Menu <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Food Cards Grid: 1-2 on mobile, 2-3 on tablet, 3-4 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {popularProducts.map((product) => (
                <FoodCard key={product.id} product={product as any} />
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================
            WHY MIDNIGHT FUEL?
            =================================================== */}
        <section className="py-12 sm:py-20 bg-surface/20 border-t border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-1">
                Our Promise
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
                WHY MIDNIGHT FUEL?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                Crafted specifically for late-night foodies who refuse to compromise on taste, hygiene and temperature.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all group glass-card-hover">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4">
                  <Flame className="w-6 h-6 fill-primary/30" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Freshly Prepared</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  No pre-cooked cold food. Every dish is seasoned, grilled, fried and simmered fresh when you order.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all group glass-card-hover">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Late Night Delivery</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Operating exclusively from 7:00 PM to 2:00 AM so you never have to sleep hungry.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all group glass-card-hover">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Quality Ingredients</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Premium 100% Halal chicken, fresh dairy butter, authentic spices and zero artificial additives.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all group glass-card-hover">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-accent-cyan group-hover:scale-110 transition-transform mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Fast Service</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Insulated thermal packaging keeps your food smoking hot and crispy until it reaches your door.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

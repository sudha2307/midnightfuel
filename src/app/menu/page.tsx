"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  UtensilsCrossed,
} from "lucide-react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import FoodCard from "@/components/customer/FoodCard";
import StoreClosedBanner from "@/components/customer/StoreClosedBanner";
import { ProductType, CategoryType } from "@/types";

function MenuContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"popularity" | "price-asc" | "price-desc" | "name">("popularity");
  const [isLoading, setIsLoading] = useState(true);

  // Sync category param if URL changes
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  // Fetch products and categories
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/menu"),
          fetch("/api/categories"),
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
      } catch (e) {
        console.error("Failed to load menu data", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (selectedCategory !== "all") {
          const matchCat =
            product.category?.slug === selectedCategory ||
            product.category?.id === selectedCategory ||
            product.categoryId === selectedCategory;
          if (!matchCat) return false;
        }

        // Veg filter
        if (vegOnly && !product.isVeg) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description.toLowerCase().includes(q);
          const matchCat = product.category?.name.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "popularity") {
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, selectedCategory, vegOnly, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Menu Header */}
      <div className="text-center max-w-2xl mx-auto mb-6 space-y-1.5 sm:space-y-2">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary block">
          Midnight Fuel Cloud Kitchen
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-heading">
          OUR LATE-NIGHT MENU
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Authentic Mandhi, sizzling chicken, juicy burgers and hot curries prepared fresh to order.
        </p>
      </div>

      {/* Closed Banner if resting */}
      <StoreClosedBanner />

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border/80 rounded-2xl p-3 sm:p-4 mb-6 sm:mb-8 shadow-card space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chicken, mandhi, burger..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-raised border border-border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters: Veg Toggle & Sort */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Veg Only Switch */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                vegOnly
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-glow"
                  : "bg-surface-raised border-border text-zinc-400 hover:text-white"
              }`}
            >
              <div className="w-3 h-3 rounded-full border border-emerald-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <span>Veg Only</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface-raised border border-border px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 min-h-[44px]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="popularity" className="bg-surface text-white">
                  Popular First
                </option>
                <option value="price-asc" className="bg-surface text-white">
                  Price: Low to High
                </option>
                <option value="price-desc" className="bg-surface text-white">
                  Price: High to Low
                </option>
                <option value="name" className="bg-surface text-white">
                  Name: A to Z
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none border-t border-border/60">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 min-h-[40px] ${
              selectedCategory === "all"
                ? "bg-primary text-black shadow-glow"
                : "bg-surface-raised hover:bg-surface border border-border text-zinc-300 hover:text-white"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" /> ALL ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 min-h-[40px] ${
                selectedCategory === cat.slug || selectedCategory === cat.id
                  ? "bg-primary text-black shadow-glow"
                  : "bg-surface-raised hover:bg-surface border border-border text-zinc-300 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid / Loading / Empty States */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-2xl bg-surface border border-border animate-pulse p-4 space-y-3"
            >
              <div className="h-40 bg-surface-raised rounded-xl" />
              <div className="h-4 bg-surface-raised rounded w-3/4" />
              <div className="h-3 bg-surface-raised rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-surface/40 border border-border rounded-3xl p-6 sm:p-8 max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">No Dishes Found</h3>
          <p className="text-xs text-zinc-400">
            We couldn't find any dishes matching your filters or search terms.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
              setVegOnly(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-primary text-black font-bold text-xs uppercase tracking-wider shadow-glow min-h-[44px]"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <span className="text-xs font-semibold text-zinc-400">
              Showing <strong className="text-white">{filteredProducts.length}</strong> items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <FoodCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="text-center py-20 text-zinc-400">Loading menu...</div>}>
          <MenuContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

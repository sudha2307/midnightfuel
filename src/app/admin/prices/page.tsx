"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Search,
  Check,
  History,
  Edit2,
  Save,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatINR, formatTimeOnly, formatDate } from "@/lib/utils";

export default function AdminPriceManagementPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Single Edit Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [newPrice, setNewPrice] = useState<string>("");
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  // Bulk Edit Mode State
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPrices, setBulkPrices] = useState<{ [id: string]: string }>({});
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // History Drawer State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyProduct, setHistoryProduct] = useState<any | null>(null);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/prices");
      if (res.ok) {
        const data = await res.json();
        const prods = data.products || [];
        setProducts(prods);

        // Initialize bulk price map
        const map: { [id: string]: string } = {};
        prods.forEach((p: any) => {
          map[p.id] = p.price.toString();
        });
        setBulkPrices(map);
      }
    } catch (e) {
      console.error("Failed to load prices", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openSingleEdit = (product: any) => {
    setEditingProduct(product);
    setNewPrice(product.price.toString());
  };

  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSavingSingle(true);

    try {
      const res = await fetch(`/api/menu/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(newPrice) }),
      });

      if (res.ok) {
        showToast(`Price for "${editingProduct.name}" updated successfully.`);
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSingle(false);
    }
  };

  const handleSaveBulk = async () => {
    setIsSavingBulk(true);
    try {
      // Find modified items
      const updates = products
        .filter((p) => {
          const updated = parseFloat(bulkPrices[p.id]);
          return !isNaN(updated) && Math.abs(p.price - updated) > 0.01;
        })
        .map((p) => ({
          id: p.id,
          price: parseFloat(bulkPrices[p.id]),
        }));

      if (updates.length === 0) {
        setBulkConfirmOpen(false);
        setBulkMode(false);
        setIsSavingBulk(false);
        return;
      }

      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (res.ok) {
        showToast(`Updated ${updates.length} product prices successfully.`);
        setBulkConfirmOpen(false);
        setBulkMode(false);
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingBulk(false);
    }
  };

  const openPriceHistory = async (product?: any) => {
    setHistoryProduct(product || null);
    setHistoryOpen(true);
    try {
      const url = product
        ? `/api/prices/history?productId=${product.id}`
        : `/api/prices/history`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter products
  const categories = Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean)));
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.category?.name === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const modifiedCount = products.filter((p) => {
    const updated = parseFloat(bulkPrices[p.id]);
    return !isNaN(updated) && Math.abs(p.price - updated) > 0.01;
  }).length;

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Price Management"
        subtitle="Manage food catalog pricing, bulk updates, and audit price history."
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={() => openPriceHistory()}
              className="px-3.5 py-2 rounded-xl bg-surface border border-border hover:border-primary text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors hidden sm:flex min-h-[40px]"
            >
              <History className="w-3.5 h-3.5 text-primary" />
              <span>Audit Log</span>
            </button>

            {!bulkMode ? (
              <button
                onClick={() => setBulkMode(true)}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow min-h-[40px]"
              >
                <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" /> Bulk Editor
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulkMode(false)}
                  className="px-3 py-2 rounded-xl bg-surface-raised border border-border text-zinc-400 text-xs font-bold min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setBulkConfirmOpen(true)}
                  disabled={modifiedCount === 0}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow disabled:opacity-50 min-h-[40px]"
                >
                  <Save className="w-3.5 h-3.5 stroke-[2.5]" /> Save ({modifiedCount})
                </button>
              </div>
            )}
          </div>
        }
      />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-glow animate-in slide-in-from-top duration-300">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish to edit price..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[42px]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[38px] ${
                selectedCategory === "all"
                  ? "bg-primary text-black font-extrabold"
                  : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[38px] ${
                  selectedCategory === cat
                    ? "bg-primary text-black font-extrabold"
                    : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 1. DESKTOP VIEW: Data Table (hidden on mobile) */}
        <div className="hidden md:block rounded-3xl bg-surface border border-border overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised/80 border-b border-border/80 text-zinc-400 uppercase text-[11px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-4 px-6">Food Item</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Current Price</th>
                  {bulkMode && <th className="py-4 px-4">New Price (₹)</th>}
                  <th className="py-4 px-4">Last Updated</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-zinc-300">
                {filteredProducts.map((p) => {
                  const lastHistory = p.priceHistories?.[0];
                  const isModified =
                    bulkMode &&
                    parseFloat(bulkPrices[p.id]) !== p.price &&
                    !isNaN(parseFloat(bulkPrices[p.id]));

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-surface-raised/40 transition-colors ${
                        isModified ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-border"
                          />
                          <div>
                            <span className="font-bold text-white block text-sm">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-zinc-500 line-clamp-1">
                              {p.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-[11px] font-bold text-zinc-300">
                          {p.category?.name || "General"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-sm font-black text-white">
                          {formatINR(p.price)}
                        </span>
                      </td>

                      {bulkMode && (
                        <td className="py-4 px-4">
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={bulkPrices[p.id] || ""}
                              onChange={(e) =>
                                setBulkPrices({ ...bulkPrices, [p.id]: e.target.value })
                              }
                              className={`w-full pl-6 pr-2 py-1.5 rounded-xl border text-sm font-bold text-white bg-surface-raised focus:outline-none focus:border-primary ${
                                isModified
                                  ? "border-primary text-primary ring-1 ring-primary"
                                  : "border-border"
                              }`}
                            />
                          </div>
                        </td>
                      )}

                      <td className="py-4 px-4 text-[11px] text-zinc-400">
                        {lastHistory ? (
                          <div>
                            <span>{formatDate(lastHistory.changedAt)}</span>
                            <span className="text-zinc-500 block">
                              {lastHistory.oldPrice > 0
                                ? `₹${lastHistory.oldPrice} → ₹${lastHistory.newPrice}`
                                : "Initial"}
                            </span>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => openSingleEdit(p)}
                          className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-primary/20 hover:text-primary border border-border text-zinc-300 text-xs font-bold transition-colors"
                        >
                          EDIT PRICE
                        </button>
                        <button
                          onClick={() => openPriceHistory(p)}
                          className="p-1.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-zinc-400 hover:text-white"
                          title="View Price History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. MOBILE VIEW: Responsive Cards */}
        <div className="md:hidden space-y-3">
          {filteredProducts.map((p) => {
            const isModified =
              bulkMode &&
              parseFloat(bulkPrices[p.id]) !== p.price &&
              !isNaN(parseFloat(bulkPrices[p.id]));

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-card ${
                  isModified ? "ring-1 ring-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover border border-border"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.name}</h4>
                      <span className="text-[11px] text-zinc-400 block">{p.category?.name || "General"}</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-primary">
                    {formatINR(p.price)}
                  </span>
                </div>

                {/* Bulk Input or Edit Row */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3">
                  {bulkMode ? (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-zinc-400 font-bold">New:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={bulkPrices[p.id] || ""}
                          onChange={(e) =>
                            setBulkPrices({ ...bulkPrices, [p.id]: e.target.value })
                          }
                          className="w-full pl-6 pr-2 py-2 rounded-xl border text-sm font-bold text-white bg-surface-raised focus:outline-none focus:border-primary min-h-[40px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openSingleEdit(p)}
                      className="px-4 py-2 rounded-xl bg-surface-raised border border-border text-white text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit Price
                    </button>
                  )}

                  <button
                    onClick={() => openPriceHistory(p)}
                    className="p-2.5 rounded-xl bg-surface-raised border border-border text-zinc-400 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Audit History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 1. Quick Edit Price Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#141414] border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-heading">Edit Product Price</h3>
                <span className="text-[11px] text-zinc-400">{editingProduct.name}</span>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-zinc-400 hover:text-white p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between">
                <span className="text-zinc-400 font-bold uppercase">Current Price:</span>
                <span className="text-base font-black text-white">
                  {formatINR(editingProduct.price)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1.5">
                  New Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    step="1"
                    min="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-base font-black text-white focus:outline-none focus:border-primary min-h-[44px]"
                    placeholder="250"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 bg-surface-raised text-zinc-400 rounded-xl font-bold uppercase min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSingle}
                  className="px-6 py-2.5 bg-primary text-black font-extrabold rounded-xl uppercase shadow-glow min-h-[40px]"
                >
                  {isSavingSingle ? "Saving..." : "Save Price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Bulk Confirm Modal */}
      {bulkConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#141414] border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-white font-heading">Confirm Bulk Price Update</h3>
            <p className="text-zinc-300">
              Are you sure you want to update <strong className="text-primary">{modifiedCount}</strong> product price(s)?
            </p>
            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkConfirmOpen(false)}
                className="px-4 py-2.5 bg-surface-raised text-zinc-400 rounded-xl font-bold uppercase min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBulk}
                disabled={isSavingBulk}
                className="px-6 py-2.5 bg-emerald-500 text-black font-extrabold rounded-xl uppercase shadow-glow min-h-[40px]"
              >
                {isSavingBulk ? "Updating..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Price History Audit Drawer */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#121212] border-l border-border h-full p-5 sm:p-6 shadow-2xl flex flex-col justify-between text-xs animate-in slide-in-from-right duration-300">
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-bold text-white font-heading">
                    {historyProduct ? `Price Log: ${historyProduct.name}` : "Global Price Audit Log"}
                  </h3>
                </div>
                <button onClick={() => setHistoryOpen(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {historyData.length === 0 ? (
                  <p className="text-zinc-500 text-center py-10">No price changes recorded yet.</p>
                ) : (
                  historyData.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-2xl bg-surface-raised border border-border/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">
                          {h.product?.name || historyProduct?.name}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {formatTimeOnly(h.changedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">
                          Price: <del className="text-rose-400">₹{h.oldPrice}</del> → <strong className="text-emerald-400 font-bold">₹{h.newPrice}</strong>
                        </span>
                        <span className="text-[10px] text-zinc-400 bg-surface px-2 py-0.5 rounded border border-border">
                          By: {h.changedBy}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block">
                        {formatDate(h.changedAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setHistoryOpen(false)}
                className="w-full py-2.5 rounded-xl bg-surface-raised text-zinc-300 font-bold uppercase min-h-[44px]"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

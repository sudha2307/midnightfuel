"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Search,
  Calendar,
  Layers,
  X,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { ComboType, ProductType } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";

export default function AdminCombosPage() {
  const [combos, setCombos] = useState<ComboType[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [comboNumber, setComboNumber] = useState<number>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servingPeople, setServingPeople] = useState("Serves 3 People");
  const [price, setPrice] = useState<number | string>(555);
  const [originalPrice, setOriginalPrice] = useState<number | string>(650);
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<Array<{ productId?: string; customItemName?: string; quantity: number }>>([
    { productId: "", customItemName: "", quantity: 1 },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchCombosAndProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [combosRes, productsRes] = await Promise.all([
        fetch("/api/combos?admin=true"),
        fetch("/api/products?admin=true"),
      ]);

      if (combosRes.ok) {
        const cData = await combosRes.json();
        setCombos(cData.combos || []);
      }
      if (productsRes.ok) {
        const pData = await productsRes.json();
        setProducts(pData.products || []);
      }
    } catch (e) {
      console.error("Failed to load combos/products", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCombosAndProducts();
  }, [fetchCombosAndProducts]);

  const handleToggleStatus = async (combo: ComboType) => {
    const updatedStatus = !combo.isActive;
    try {
      const res = await fetch(`/api/combos/${combo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });

      if (res.ok) {
        setCombos((prev) =>
          prev.map((c) => (c.id === combo.id ? { ...c, isActive: updatedStatus } : c))
        );
        showToast(`Combo ${combo.comboNumber} is now ${updatedStatus ? "🟢 ACTIVE (ON)" : "🔴 OFF"}`);
      }
    } catch {
      showToast("Failed to toggle combo status");
    }
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setComboNumber(combos.length + 1);
    setName(`Combo ${combos.length + 1}`);
    setDescription("");
    setServingPeople("Serves 3 People");
    setPrice(555);
    setOriginalPrice(650);
    setImage("https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800");
    setIsActive(true);
    setValidFrom("");
    setValidUntil("");
    setItems([
      { productId: products[0]?.id || "", customItemName: products[0]?.name || "", quantity: 1 },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (combo: ComboType) => {
    setIsEditing(true);
    setEditingId(combo.id);
    setComboNumber(combo.comboNumber);
    setName(combo.name);
    setDescription(combo.description || "");
    setServingPeople(combo.servingPeople || "Serves 3 People");
    setPrice(combo.price);
    setOriginalPrice(combo.originalPrice || "");
    setImage(combo.image || "");
    setIsActive(combo.isActive);
    setValidFrom(combo.validFrom ? new Date(combo.validFrom).toISOString().split("T")[0] : "");
    setValidUntil(combo.validUntil ? new Date(combo.validUntil).toISOString().split("T")[0] : "");
    setItems(
      combo.items.map((i) => ({
        productId: i.productId || "",
        customItemName: i.customItemName || i.product?.name || "",
        quantity: i.quantity,
      }))
    );
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { productId: "", customItemName: "", quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === "productId") {
        const prod = products.find((p) => p.id === value);
        updated[index].productId = value;
        updated[index].customItemName = prod ? prod.name : "";
      } else if (field === "customItemName") {
        updated[index].customItemName = value;
      } else if (field === "quantity") {
        updated[index].quantity = Math.max(1, parseInt(value, 10) || 1);
      }
      return updated;
    });
  };

  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === "") {
      showToast("Name and Price are required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        comboNumber: Number(comboNumber),
        name: name.trim(),
        description: description.trim() || undefined,
        servingPeople: servingPeople.trim() || undefined,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        image: image.trim() || undefined,
        isActive,
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
        items: items.map((i) => ({
          productId: i.productId || undefined,
          customItemName: i.customItemName || undefined,
          quantity: i.quantity,
        })),
      };

      const url = isEditing && editingId ? `/api/combos/${editingId}` : "/api/combos";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isEditing ? "Combo updated successfully!" : "New Combo created!");
        setIsModalOpen(false);
        fetchCombosAndProducts();
      } else {
        showToast(data.error || "Failed to save combo");
      }
    } catch {
      showToast("Network error saving combo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCombo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Daily Combo?")) return;
    try {
      const res = await fetch(`/api/combos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCombos((prev) => prev.filter((c) => c.id !== id));
        showToast("Combo deleted successfully");
      }
    } catch {
      showToast("Failed to delete combo");
    }
  };

  const filteredCombos = combos.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0d0d0d] text-white pb-16">
      <AdminHeader
        title="Daily Combos Management"
        subtitle="Configure daily combo packages, included items, serving sizes, and instant ON/OFF availability."
        actionButton={
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow min-h-[40px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Combo
          </button>
        }
      />

      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-surface-raised border border-primary text-primary font-bold text-xs shadow-glow animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-border">
          <div>
            <h2 className="text-base sm:text-xl font-black text-white font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Daily Midnight Combos
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Admin controls all daily combos, included dishes, serving counts, and instant ON/OFF availability.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search combos..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-raised border border-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[40px]"
            />
          </div>
        </div>

        {/* 1. DESKTOP VIEW: Data Table (hidden on mobile) */}
        <div className="hidden md:block bg-surface rounded-2xl border border-border overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-zinc-400 uppercase tracking-wider bg-surface-raised/40">
                  <th className="py-4 px-6 font-bold">COMBO</th>
                  <th className="py-4 px-4 font-bold">SERVES</th>
                  <th className="py-4 px-4 font-bold">INCLUDED ITEMS</th>
                  <th className="py-4 px-4 font-bold">PRICE</th>
                  <th className="py-4 px-4 font-bold">STATUS</th>
                  <th className="py-4 px-4 font-bold">VALIDITY</th>
                  <th className="py-4 px-6 text-right font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Loading daily combos...
                    </td>
                  </tr>
                ) : filteredCombos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      No combos found. Click "+ Add New Combo" above to create today's special.
                    </td>
                  </tr>
                ) : (
                  filteredCombos.map((combo) => {
                    const isUnavailable = combo.isPartiallyUnavailable;

                    return (
                      <tr key={combo.id} className="hover:bg-surface-raised/30 transition-colors">
                        {/* COMBO */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0">
                              #{combo.comboNumber}
                            </span>
                            <div>
                              <span className="font-extrabold text-white text-sm block">
                                {combo.name}
                              </span>
                              {combo.description && (
                                <span className="text-[11px] text-zinc-400 line-clamp-1">
                                  {combo.description}
                                </span>
                              )}
                              {isUnavailable && combo.unavailableItemNames && (
                                <span className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-0.5">
                                  <AlertTriangle className="w-3 h-3" /> Item Off: {combo.unavailableItemNames.join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SERVES */}
                        <td className="py-4 px-4 text-zinc-300 font-medium">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-[11px]">
                            <Users className="w-3 h-3 text-primary" />
                            {combo.servingPeople || "Editable"}
                          </span>
                        </td>

                        {/* INCLUDED ITEMS */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            {combo.items.map((it, idx) => (
                              <div key={idx} className="text-[11px] text-zinc-300">
                                • {it.product?.name || it.customItemName || "Item"} <strong className="text-primary">× {it.quantity}</strong>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* PRICE */}
                        <td className="py-4 px-4 font-black text-primary text-sm">
                          {formatINR(combo.price)}
                          {combo.originalPrice && combo.originalPrice > combo.price && (
                            <span className="text-xs text-zinc-500 line-through block font-normal">
                              {formatINR(combo.originalPrice)}
                            </span>
                          )}
                        </td>

                        {/* STATUS (Quick ON/OFF Toggle) */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleStatus(combo)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                              combo.isActive
                                ? "bg-emerald-950/60 border border-emerald-500/60 text-emerald-400 hover:bg-emerald-900/60"
                                : "bg-rose-950/60 border border-rose-500/60 text-rose-400 hover:bg-rose-900/60"
                            }`}
                          >
                            {combo.isActive ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 ON
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> 🔴 OFF
                              </>
                            )}
                          </button>
                        </td>

                        {/* VALIDITY */}
                        <td className="py-4 px-4 text-[11px] text-zinc-400">
                          {combo.validFrom || combo.validUntil ? (
                            <div>
                              <span>{combo.validFrom ? formatDate(combo.validFrom) : "Now"}</span>
                              <span className="block text-zinc-500">
                                to {combo.validUntil ? formatDate(combo.validUntil) : "Ongoing"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-emerald-400 font-semibold">Active Daily</span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(combo)}
                              className="p-2 rounded-lg bg-surface-raised hover:bg-surface border border-border text-zinc-300 hover:text-white transition-colors"
                              title="Edit Combo"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-primary" />
                            </button>
                            <button
                              onClick={() => handleDeleteCombo(combo.id)}
                              className="p-2 rounded-lg bg-surface-raised hover:bg-rose-950/40 border border-border text-zinc-400 hover:text-rose-400 transition-colors"
                              title="Delete Combo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. MOBILE VIEW: Responsive Cards (1 card/row on mobile) */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-400 text-xs">Loading daily combos...</div>
          ) : filteredCombos.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">No combos found.</div>
          ) : (
            filteredCombos.map((combo) => (
              <div
                key={combo.id}
                className="p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-black text-xs">
                      #{combo.comboNumber}
                    </span>
                    <h3 className="font-extrabold text-white text-sm font-heading">{combo.name}</h3>
                  </div>
                  <span className="text-base font-black text-primary">
                    {formatINR(combo.price)}
                  </span>
                </div>

                {combo.servingPeople && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-surface-raised px-2.5 py-1 rounded-lg border border-border">
                    <Users className="w-3 h-3 text-primary" /> {combo.servingPeople}
                  </span>
                )}

                {/* Included Items */}
                <div className="p-2.5 rounded-xl bg-surface-raised text-[11px] space-y-1 border border-border/60">
                  <span className="font-bold text-primary block">Included Dishes:</span>
                  {combo.items.map((it, idx) => (
                    <div key={idx} className="text-zinc-300">
                      • {it.product?.name || it.customItemName || "Item"} <span className="font-bold text-white">× {it.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(combo)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all min-h-[40px] ${
                      combo.isActive
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-400"
                        : "bg-rose-950/60 border-rose-500/50 text-rose-400"
                    }`}
                  >
                    {combo.isActive ? "🟢 ON" : "🔴 OFF"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(combo)}
                      className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border text-white text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCombo(combo.id)}
                      className="p-2.5 rounded-xl bg-surface-raised hover:bg-rose-950/50 border border-border text-zinc-300 hover:text-rose-400 min-h-[40px] min-w-[40px] flex items-center justify-center"
                      aria-label="Delete combo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add / Edit Combo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-border rounded-3xl p-5 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 sm:space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3 sm:pb-4">
              <h3 className="text-base sm:text-lg font-black text-white font-heading flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {isEditing ? `Edit Combo #${comboNumber}` : "Create New Daily Combo"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCombo} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-zinc-400 font-bold uppercase mb-1">Combo Number *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={comboNumber}
                    onChange={(e) => setComboNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold uppercase mb-1">Combo Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Combo 1 (Midnight Mandhi Combo)"
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold uppercase mb-1">Serving People</label>
                  <input
                    type="text"
                    value={servingPeople}
                    onChange={(e) => setServingPeople(e.target.value)}
                    placeholder="e.g. Serves 3 People"
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold uppercase mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="555"
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary font-bold text-primary min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold uppercase mb-1">Original Price (Strikethrough)</label>
                  <input
                    type="number"
                    min={0}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="650"
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold uppercase mb-1">Combo Image URL</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of the dishes included in this midnight combo..."
                  className="w-full rounded-xl bg-surface-raised border border-border p-3 text-xs sm:text-sm text-white focus:border-primary resize-none"
                />
              </div>

              {/* Dynamic Items Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" /> Included Food Items ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-primary/40 text-primary font-bold text-[11px] flex items-center gap-1 min-h-[36px]"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((row, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-surface-raised p-2.5 rounded-xl border border-border">
                      {/* Product Selector */}
                      <select
                        value={row.productId || ""}
                        onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                        className="flex-1 rounded-lg bg-surface border border-border px-3 py-2 text-xs text-white focus:border-primary min-h-[38px] cursor-pointer"
                      >
                        <option value="">-- Or enter custom dish --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price}) {!p.isAvailable ? "🔴 OFF" : ""}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        {/* Custom Item Name */}
                        <input
                          type="text"
                          value={row.customItemName || ""}
                          onChange={(e) => handleItemChange(idx, "customItemName", e.target.value)}
                          placeholder="Item name / Extra"
                          className="flex-1 rounded-lg bg-surface border border-border px-3 py-2 text-xs text-white focus:border-primary min-h-[38px]"
                        />

                        {/* Quantity */}
                        <div className="w-20">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                            placeholder="Qty"
                            className="w-full rounded-lg bg-surface border border-border px-2.5 py-2 text-xs text-white text-center font-bold min-h-[38px]"
                          />
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 min-h-[38px] min-w-[38px] flex items-center justify-center"
                            aria-label="Remove item row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Switch */}
              <div className="pt-2 flex items-center justify-between bg-surface-raised p-3 rounded-xl border border-border">
                <span className="font-bold text-white">Combo Availability</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className={isActive ? "text-emerald-400 font-bold text-xs" : "text-rose-400 font-bold text-xs"}>
                    {isActive ? "🟢 ACTIVE" : "🔴 OFF"}
                  </span>
                </label>
              </div>

              {/* Save Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-zinc-300 font-bold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold shadow-glow uppercase tracking-wider disabled:opacity-50 min-h-[44px]"
                >
                  {isSaving ? "Saving..." : "[ SAVE COMBO ]"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Flame,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Tag,
  Clock,
  History,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { ProductType, CategoryType } from "@/types";
import { formatINR } from "@/lib/utils";

export default function AdminMenuPage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    description: "",
    image: "",
    isVeg: false,
    isAvailable: true,
    isFeatured: false,
    isPopular: false,
    preparationTime: "20",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
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
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      categoryId: categories[0]?.id || "",
      price: "",
      description: "",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
      isVeg: false,
      isAvailable: true,
      isFeatured: false,
      isPopular: false,
      preparationTime: "20",
    });
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (product: ProductType) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price.toString(),
      description: product.description,
      image: product.image,
      isVeg: product.isVeg,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      isPopular: product.isPopular,
      preparationTime: product.preparationTime.toString(),
    });
    setModalError(null);
    setModalOpen(true);
  };

  const handleToggleAvailability = async (product: ProductType) => {
    const updated = !product.isAvailable;
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: updated } : p))
      );

      await fetch(`/api/menu/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: updated }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      setProducts((prev) => prev.filter((p) => p.id !== deleteModal.id));
      await fetch(`/api/menu/${deleteModal.id}`, { method: "DELETE" });
      setDeleteModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const url = editingProduct ? `/api/menu/${editingProduct.id}` : "/api/menu";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setModalError(data.error || "Failed to save product");
        setIsSubmitting(false);
        return;
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.categoryId !== selectedCategory) return false;
    if (statusFilter === "available" && !p.isAvailable) return false;
    if (statusFilter === "unavailable" && p.isAvailable) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Menu Management"
        subtitle="Manage food items, categories, pricing, stock availability, and dish highlights."
        actionButton={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/prices"
              className="px-3.5 py-2 rounded-xl bg-surface border border-border hover:border-primary text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors hidden sm:flex min-h-[40px]"
            >
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>Price Manager</span>
            </Link>

            <button
              onClick={openAddModal}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow min-h-[40px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add New Food
            </button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or categories..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[42px]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-raised border border-border text-xs text-white focus:border-primary min-h-[42px] cursor-pointer"
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-raised border border-border text-xs text-white focus:border-primary min-h-[42px] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Sold Out / Off</option>
            </select>
          </div>
        </div>

        {/* 1. DESKTOP VIEW: Data Table (hidden on mobile) */}
        <div className="hidden md:block rounded-3xl bg-surface border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-zinc-400 uppercase tracking-wider bg-surface-raised/50">
                  <th className="py-4 px-6 font-bold">Image</th>
                  <th className="py-4 px-4 font-bold">Food Name</th>
                  <th className="py-4 px-4 font-bold">Category</th>
                  <th className="py-4 px-4 font-bold">Price</th>
                  <th className="py-4 px-4 font-bold">Status</th>
                  <th className="py-4 px-4 font-bold">Prep Time</th>
                  <th className="py-4 px-6 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-raised/40 transition-colors">
                    {/* Image */}
                    <td className="py-3.5 px-6">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0"
                      />
                    </td>

                    {/* Dish name & details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {p.name}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.isVeg ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          title={p.isVeg ? "Veg" : "Non-Veg"}
                        />
                        {p.isPopular && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-black uppercase">
                            ★ Best Seller
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 max-w-xs mt-0.5">
                        {p.description}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-semibold text-zinc-300">
                      {p.category?.name || "N/A"}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-extrabold text-white text-sm">
                      {formatINR(p.price)}
                    </td>

                    {/* Availability Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleAvailability(p)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                          p.isAvailable
                            ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-400"
                            : "bg-rose-950/60 border-rose-500/50 text-rose-400"
                        }`}
                      >
                        {p.isAvailable ? (
                          <>
                            <Eye className="w-3 h-3" /> Available
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Unavailable
                          </>
                        )}
                      </button>
                    </td>

                    {/* Prep Time */}
                    <td className="py-3.5 px-4 text-zinc-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{p.preparationTime} min</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 rounded-lg bg-surface-raised hover:bg-surface border border-border text-zinc-300 hover:text-white transition-colors"
                        title="Edit Food Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ id: p.id, name: p.name })}
                        className="p-2 rounded-lg bg-surface-raised hover:bg-rose-950/50 border border-border text-zinc-300 hover:text-rose-400 transition-colors"
                        title="Delete Food Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. MOBILE VIEW: Responsive Cards Grid (Shown on <md screens) */}
        <div className="md:hidden space-y-3">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-card"
            >
              <div className="flex items-start gap-3">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-white text-sm truncate">{p.name}</h4>
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        p.isVeg ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    Category: <strong className="text-zinc-200">{p.category?.name || "N/A"}</strong>
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-base font-black text-primary">
                      {formatINR(p.price)}
                    </span>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" /> {p.preparationTime} min
                    </span>
                  </div>
                </div>
              </div>

              {p.description && (
                <p className="text-[11px] text-zinc-400 line-clamp-2">
                  {p.description}
                </p>
              )}

              {/* Status & Actions Row */}
              <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleAvailability(p)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all min-h-[40px] ${
                    p.isAvailable
                      ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-400"
                      : "bg-rose-950/60 border-rose-500/50 text-rose-400"
                  }`}
                >
                  {p.isAvailable ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> <span>🟢 ON</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> <span>🔴 OFF</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border text-white text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteModal({ id: p.id, name: p.name })}
                    className="p-2.5 rounded-xl bg-surface-raised hover:bg-rose-950/50 border border-border text-zinc-300 hover:text-rose-400 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#141414] border border-border rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-white font-heading">
              Delete Food Item?
            </h3>
            <p className="text-zinc-300 text-sm">
              Are you sure you want to delete <strong className="text-white">"{deleteModal.name}"</strong>?
            </p>
            <p className="text-[11px] text-zinc-500">
              Note: If this food item has appeared in past orders, it will be safely soft-deleted to preserve historical order receipts.
            </p>
            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2.5 bg-surface-raised text-zinc-400 rounded-xl font-bold uppercase min-h-[40px]"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl uppercase shadow-glow min-h-[40px]"
              >
                {isDeleting ? "Deleting..." : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal (Fully Responsive on Mobile & Desktop) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#141414] border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                {editingProduct ? `Edit "${editingProduct.name}"` : "Add New Food Item"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Chicken 65"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary min-h-[44px] cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 180"
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-primary font-bold focus:outline-none focus:border-primary min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Crispy and spicy fried chicken pieces seasoned with southern spices."
                  className="w-full rounded-xl bg-surface-raised border border-border p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Food Image URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary min-h-[44px]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-raised border border-border cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={formData.isVeg}
                      onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                      className="rounded border-zinc-700 bg-surface text-emerald-500 w-4 h-4"
                    />
                    <span className="text-zinc-200 font-bold">Vegetarian Dish</span>
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <label className="flex flex-col items-center p-2 rounded-xl bg-surface-raised border border-border cursor-pointer text-center">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded border-zinc-700 bg-surface text-primary w-4 h-4 mb-1"
                  />
                  <span className="text-[10px] font-bold text-zinc-300">Available</span>
                </label>

                <label className="flex flex-col items-center p-2 rounded-xl bg-surface-raised border border-border cursor-pointer text-center">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="rounded border-zinc-700 bg-surface text-primary w-4 h-4 mb-1"
                  />
                  <span className="text-[10px] font-bold text-zinc-300">Best Seller</span>
                </label>

                <label className="flex flex-col items-center p-2 rounded-xl bg-surface-raised border border-border cursor-pointer text-center">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded border-zinc-700 bg-surface text-primary w-4 h-4 mb-1"
                  />
                  <span className="text-[10px] font-bold text-zinc-300">Special</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-raised text-zinc-400 rounded-xl font-bold uppercase min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-black font-extrabold rounded-xl uppercase shadow-glow min-h-[44px]"
                >
                  {isSubmitting ? "Saving..." : "[ SAVE FOOD ITEM ]"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

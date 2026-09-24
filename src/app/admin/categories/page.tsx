"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Layers, X, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { CategoryType } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [order, setOrder] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setImage("https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80");
    setOrder(categories.length.toString());
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryType) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setOrder(cat.order.toString());
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, image, order }),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchCategories();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Delete category "${catName}"?`)) return;
    try {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Category Management"
        subtitle="Organize menu sections, slugs and visual banner imagery."
        actionButton={
          <button
            onClick={openAdd}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow min-h-[40px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Category
          </button>
        }
      />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 sm:p-5 rounded-3xl bg-surface border border-border shadow-card flex flex-col justify-between space-y-4 glass-card-hover"
            >
              <div>
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-28 sm:h-32 rounded-2xl object-cover border border-border mb-3"
                  />
                )}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-extrabold text-white font-heading">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-zinc-500 font-semibold">
                    Order: #{cat.order}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {cat.description || "No description."}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs text-primary font-bold">
                  {cat._count?.products || 0} Products
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 rounded-xl bg-surface-raised hover:bg-surface border border-border text-zinc-300 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="Edit category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-2 rounded-xl bg-surface-raised hover:bg-rose-950/50 border border-border text-zinc-300 hover:text-rose-400 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#141414] border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-white font-heading">
                {editingCategory ? `Edit "${editingCategory.name}"` : "Add Category"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-white p-1" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MANDHI, BURGERS"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2 text-xs sm:text-sm text-white focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-primary min-h-[44px]"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-raised text-zinc-400 rounded-xl font-bold uppercase min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-primary text-black font-extrabold rounded-xl uppercase shadow-glow min-h-[40px]"
                >
                  {isSubmitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

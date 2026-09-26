"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  CreditCard,
  QrCode,
  Banknote,
  Plus,
  Trash2,
  Building2,
  Phone,
  MessageCircle,
  MapPin,
  Sparkles,
  ChefHat,
  X,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useStore } from "@/context/StoreContext";
import { DeliveryDistanceSlabType, ProductType } from "@/types";

export default function AdminSettingsPage() {
  const { settings, refreshSettings } = useStore();

  // Local Form State with sensible defaults
  const [formData, setFormData] = useState({
    businessName: "Midnight Fuel",
    tagline: "EAT • ENJOY • RECHARGE",
    phone: "+91 90801 39363",
    whatsapp: "+91 90801 39363",
    address: "123 Food Street, Late Night Hub, Tirunelveli - 627001",
    city: "Tirunelveli",
    openingTime: "19:00",
    closingTime: "02:00",
    minOrderAmount: 199,
    upiId: "midnightfuel@upi",
    storeMode: "AUTO",
    isCashEnabled: true,
    isUpiEnabled: true,
    todaySpecialProductId: "",
  });

  // Track if initial database values have been loaded into form state
  const [isLoaded, setIsLoaded] = useState(false);

  // Products state for dropdown selection
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Delivery slabs state
  const [slabs, setSlabs] = useState<DeliveryDistanceSlabType[]>([]);
  const [newSlabMin, setNewSlabMin] = useState("");
  const [newSlabMax, setNewSlabMax] = useState("");
  const [newSlabCharge, setNewSlabCharge] = useState("");

  // Status & Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrTestAmount, setQrTestAmount] = useState("500");

  // Load slabs
  const fetchSlabs = async () => {
    try {
      const res = await fetch("/api/delivery-slabs", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSlabs(data.slabs || []);
      }
    } catch (e) {
      console.error("Failed to fetch delivery slabs:", e);
    }
  };

  // Load available products for Kitchen Special dropdown
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch("/api/menu", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error("Failed to fetch products:", e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Populate initial values once from StoreContext / Database
  useEffect(() => {
    if (settings && !isLoaded) {
      setFormData({
        businessName: settings.businessName || "Midnight Fuel",
        tagline: settings.tagline || "EAT • ENJOY • RECHARGE",
        phone: settings.phone || "+91 90801 39363",
        whatsapp: settings.whatsapp || "+91 90801 39363",
        address: settings.address || "123 Food Street, Late Night Hub, Tirunelveli - 627001",
        city: settings.city || "Tirunelveli",
        openingTime: settings.openingTime || "19:00",
        closingTime: settings.closingTime || "02:00",
        minOrderAmount: settings.minOrderAmount !== undefined ? settings.minOrderAmount : 199,
        upiId: settings.upiId || "midnightfuel@upi",
        storeMode: settings.storeMode || "AUTO",
        isCashEnabled: settings.isCashEnabled !== undefined ? settings.isCashEnabled : true,
        isUpiEnabled: settings.isUpiEnabled !== undefined ? settings.isUpiEnabled : true,
        todaySpecialProductId: settings.todaySpecialProductId || "",
      });
      setIsLoaded(true);
    }
    fetchSlabs();
    fetchProducts();
  }, [settings, isLoaded]);

  // Generic input change handler
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save Settings Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    setErrorMessage(null);

    // Validation
    if (!formData.businessName || !formData.businessName.trim()) {
      setErrorMessage("Kitchen / Business Name is required.");
      setIsSaving(false);
      return;
    }

    if (!formData.upiId || !formData.upiId.trim()) {
      setErrorMessage("Kitchen UPI VPA ID is required (e.g. name@upi).");
      setIsSaving(false);
      return;
    }

    if (!formData.openingTime || !formData.closingTime) {
      setErrorMessage("Daily opening time and closing time are required.");
      setIsSaving(false);
      return;
    }

    const minAmountNum = Number(formData.minOrderAmount);
    if (isNaN(minAmountNum) || minAmountNum < 0) {
      setErrorMessage("Minimum order amount must be a positive number.");
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          ...formData,
          minOrderAmount: minAmountNum,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSavedSuccess(true);
        if (data.settings) {
          setFormData({
            businessName: data.settings.businessName || "Midnight Fuel",
            tagline: data.settings.tagline || "EAT • ENJOY • RECHARGE",
            phone: data.settings.phone || "+91 90801 39363",
            whatsapp: data.settings.whatsapp || "+91 90801 39363",
            address: data.settings.address || "123 Food Street, Late Night Hub, Tirunelveli - 627001",
            city: data.settings.city || "Tirunelveli",
            openingTime: data.settings.openingTime || "19:00",
            closingTime: data.settings.closingTime || "02:00",
            minOrderAmount: data.settings.minOrderAmount ?? 199,
            upiId: data.settings.upiId || "midnightfuel@upi",
            storeMode: data.settings.storeMode || "AUTO",
            isCashEnabled: data.settings.isCashEnabled !== undefined ? data.settings.isCashEnabled : true,
            isUpiEnabled: data.settings.isUpiEnabled !== undefined ? data.settings.isUpiEnabled : true,
            todaySpecialProductId: data.settings.todaySpecialProductId || "",
          });
        }
        await refreshSettings();
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        setErrorMessage(data.error || "Failed to save settings to the database.");
      }
    } catch (err: any) {
      console.error("Save settings error:", err);
      setErrorMessage(err.message || "Network error while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add Distance Slab Handler
  const handleAddSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlabMin || !newSlabMax || !newSlabCharge) return;

    try {
      const res = await fetch("/api/delivery-slabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minDistanceKm: parseFloat(newSlabMin),
          maxDistanceKm: parseFloat(newSlabMax),
          defaultCharge: parseFloat(newSlabCharge),
          displayOrder: slabs.length + 1,
        }),
      });

      if (res.ok) {
        setNewSlabMin("");
        setNewSlabMax("");
        setNewSlabCharge("");
        fetchSlabs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Distance Slab Handler
  const handleDeleteSlab = async (id: string) => {
    try {
      const res = await fetch(`/api/delivery-slabs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSlabs((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Live UPI QR preview calculation
  const previewUpiLink = `upi://pay?pa=${encodeURIComponent(
    formData.upiId || "midnightfuel@upi"
  )}&pn=${encodeURIComponent(
    formData.businessName || "Midnight Fuel"
  )}&am=${parseFloat(qrTestAmount || "500").toFixed(2)}&cu=INR`;

  const previewQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    previewUpiLink
  )}`;

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Kitchen Business & Distance Delivery Settings"
        subtitle="Configure operating schedule, distance delivery slabs, UPI payment credentials (ZERO GST)."
      />

      <main className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Feedback Banners */}
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold">Settings saved successfully!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Distance Delivery Slabs Management */}
        <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-3 gap-1">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                Distance-Based Delivery Slabs
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              Suggested automatically during order dispatch
            </span>
          </div>

          {/* Existing Slabs Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slabs.map((slab) => (
              <div
                key={slab.id}
                className="p-3.5 rounded-2xl bg-surface-raised border border-border flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block">
                    {slab.minDistanceKm} – {slab.maxDistanceKm} KM
                  </span>
                  <span className="text-sm font-black text-primary">
                    ₹{slab.defaultCharge}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSlab(slab.id)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                  title="Delete Slab"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Slab Form */}
          <div className="pt-3 border-t border-border/60">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 text-xs">
              <div className="flex-1">
                <label className="block text-zinc-400 font-bold uppercase mb-1">Min KM</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newSlabMin}
                  onChange={(e) => setNewSlabMin(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[40px]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-zinc-400 font-bold uppercase mb-1">Max KM</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newSlabMax}
                  onChange={(e) => setNewSlabMax(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[40px]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-zinc-400 font-bold uppercase mb-1">Default Charge (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newSlabCharge}
                  onChange={(e) => setNewSlabCharge(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold text-primary min-h-[40px]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSlab}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap shadow-glow min-h-[40px] transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add Slab
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main Configurable Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Kitchen Info Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                Kitchen Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="businessName" className="block font-bold text-zinc-400 uppercase mb-1">
                  Kitchen / Business Name *
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                  placeholder="e.g. Midnight Fuel"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="tagline" className="block font-bold text-zinc-400 uppercase mb-1">
                  Brand Tagline
                </label>
                <input
                  id="tagline"
                  name="tagline"
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  placeholder="e.g. EAT • ENJOY • RECHARGE"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Kitchen Today's Special Dish (Featured on Home Page Hero) */}
          <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-3 gap-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                  Kitchen Today Special Dish
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">
                Featured prominently on customer home page hero card
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="todaySpecialProductId" className="block font-bold text-zinc-400 uppercase mb-1.5 flex items-center justify-between">
                  <span>Select Today's Special Dish</span>
                  {isLoadingProducts && (
                    <span className="text-[10px] text-primary animate-pulse font-normal lowercase">Loading menu dishes...</span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="todaySpecialProductId"
                    name="todaySpecialProductId"
                    value={formData.todaySpecialProductId}
                    onChange={(e) => handleInputChange("todaySpecialProductId", e.target.value)}
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                  >
                    <option value="">-- None (Auto / Default Featured Dish) --</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.isVeg ? "🌿" : "🍗"} {product.name} — ₹{product.price} ({product.category?.name || "General"}) {!product.isAvailable ? "(Unavailable)" : ""}
                      </option>
                    ))}
                  </select>
                  {formData.todaySpecialProductId && (
                    <button
                      type="button"
                      onClick={() => handleInputChange("todaySpecialProductId", "")}
                      className="px-3 py-2.5 rounded-xl bg-surface-raised hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-border hover:border-rose-800 transition-colors min-h-[44px] flex items-center justify-center gap-1 flex-shrink-0 text-xs font-bold"
                      title="Clear Selection"
                    >
                      <X className="w-4 h-4" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Dish Preview */}
              {(() => {
                const selectedProd = products.find((p) => p.id === formData.todaySpecialProductId);
                if (!selectedProd) {
                  return (
                    <div className="p-4 rounded-2xl bg-surface-raised/50 border border-dashed border-border/80 flex items-center gap-3 text-zinc-500 text-xs">
                      <ChefHat className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                      <span>
                        No specific dish selected. The home page will showcase the primary signature / popular dish by default. Choose a dish above to set tonight's dynamic special.
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="p-4 rounded-2xl bg-surface-raised border border-primary/40 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                    
                    {selectedProd.image ? (
                      <img
                        src={selectedProd.image}
                        alt={selectedProd.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-border/60 flex-shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-zinc-900 border border-border flex items-center justify-center flex-shrink-0 text-zinc-600">
                        <ChefHat className="w-8 h-8" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-primary text-black text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 shadow-glow">
                          <Sparkles className="w-2.5 h-2.5 fill-black" /> Kitchen Today Special
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedProd.isVeg ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"}`}>
                          {selectedProd.isVeg ? "🌿 Pure Veg" : "🍗 Non-Veg"}
                        </span>
                        {selectedProd.category?.name && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                            {selectedProd.category.name}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-extrabold text-white truncate">
                        {selectedProd.name}
                      </h4>

                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {selectedProd.description || "No description provided."}
                      </p>

                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-primary">
                          ₹{selectedProd.price}
                        </span>
                        {!selectedProd.isAvailable && (
                          <span className="text-[10px] text-rose-400 font-semibold">
                            (Currently marked as unavailable in menu)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Payment Settings (Cash & UPI Only) */}
          <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border space-y-5 shadow-card">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                Payment Settings (Cash & UPI Only)
              </h3>
            </div>

            {/* Payment Method Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <label className="p-4 rounded-2xl bg-surface-raised border border-border flex items-center gap-3 cursor-pointer min-h-[60px] hover:border-zinc-600 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isCashEnabled}
                  onChange={(e) => handleInputChange("isCashEnabled", e.target.checked)}
                  className="rounded border-zinc-700 bg-surface text-primary w-4 h-4 focus:ring-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-bold text-sm">Cash on Delivery (COD)</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">
                    Allow customers to pay in cash upon doorstep delivery.
                  </span>
                </div>
              </label>

              <label className="p-4 rounded-2xl bg-surface-raised border border-border flex items-center gap-3 cursor-pointer min-h-[60px] hover:border-zinc-600 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isUpiEnabled}
                  onChange={(e) => handleInputChange("isUpiEnabled", e.target.checked)}
                  className="rounded border-zinc-700 bg-surface text-primary w-4 h-4 focus:ring-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-bold text-sm">Instant UPI QR</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">
                    Allow instant QR scan via GPay, PhonePe, Paytm, BHIM.
                  </span>
                </div>
              </label>
            </div>

            {/* UPI Configuration & Live QR Generator */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 pt-3 border-t border-border/60 items-center">
              <div className="md:col-span-7 space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="upiId" className="block font-bold text-zinc-400 uppercase mb-1">
                    Kitchen UPI VPA ID *
                  </label>
                  <input
                    id="upiId"
                    name="upiId"
                    type="text"
                    required
                    placeholder="e.g. midnightfuel@upi"
                    value={formData.upiId}
                    onChange={(e) => handleInputChange("upiId", e.target.value)}
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                  />
                  <span className="text-[10px] sm:text-[11px] text-zinc-500 mt-1 block">
                    All customer QR codes and UPI intent links will dynamically use this VPA ID.
                  </span>
                </div>

                <div>
                  <label htmlFor="qrTestAmount" className="block font-bold text-zinc-400 uppercase mb-1">
                    Test Amount for QR Preview (₹)
                  </label>
                  <input
                    id="qrTestAmount"
                    name="qrTestAmount"
                    type="number"
                    value={qrTestAmount}
                    onChange={(e) => setQrTestAmount(e.target.value)}
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                  />
                </div>
              </div>

              {/* QR Preview Box */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#111] border border-border text-center space-y-2">
                <div className="p-2.5 rounded-xl bg-white text-black shadow-md">
                  <img
                    src={previewQrUrl}
                    alt="UPI Preview"
                    className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                  />
                </div>
                <div className="text-[11px]">
                  <span className="text-zinc-400 block font-bold">
                    {formData.businessName}
                  </span>
                  <code className="text-emerald-400 font-mono text-[10px]">
                    {formData.upiId}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours & Mode Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                Operating Schedule & Mode
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="openingTime" className="block font-bold text-zinc-400 uppercase mb-1">
                  Daily Opening Time (e.g. 19:00 for 7:00 PM) *
                </label>
                <input
                  id="openingTime"
                  name="openingTime"
                  type="time"
                  required
                  value={formData.openingTime}
                  onChange={(e) => handleInputChange("openingTime", e.target.value)}
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="closingTime" className="block font-bold text-zinc-400 uppercase mb-1">
                  Daily Closing Time (e.g. 02:00 for 2:00 AM Next Day) *
                </label>
                <input
                  id="closingTime"
                  name="closingTime"
                  type="time"
                  required
                  value={formData.closingTime}
                  onChange={(e) => handleInputChange("closingTime", e.target.value)}
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>
            </div>

            {/* Store Mode Selector */}
            <div className="pt-2">
              <label className="block font-bold text-zinc-400 uppercase mb-2">
                Store Operating Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div
                  onClick={() => handleInputChange("storeMode", "AUTO")}
                  className={`p-3.5 rounded-xl border cursor-pointer min-h-[50px] transition-colors ${
                    formData.storeMode === "AUTO"
                      ? "bg-primary/20 border-primary text-white"
                      : "bg-surface-raised border-border text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="storeModeRadio"
                      checked={formData.storeMode === "AUTO"}
                      onChange={() => handleInputChange("storeMode", "AUTO")}
                      className="text-primary focus:ring-0"
                    />
                    <strong className="text-xs">AUTOMATIC</strong>
                  </div>
                  <span className="text-[10px] block text-zinc-400 mt-1 pl-5">
                    Opens {formData.openingTime}, Closes {formData.closingTime}
                  </span>
                </div>

                <div
                  onClick={() => handleInputChange("storeMode", "FORCE_OPEN")}
                  className={`p-3.5 rounded-xl border cursor-pointer min-h-[50px] transition-colors ${
                    formData.storeMode === "FORCE_OPEN"
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                      : "bg-surface-raised border-border text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="storeModeRadio"
                      checked={formData.storeMode === "FORCE_OPEN"}
                      onChange={() => handleInputChange("storeMode", "FORCE_OPEN")}
                      className="text-primary focus:ring-0"
                    />
                    <strong className="text-xs">FORCE OPEN</strong>
                  </div>
                  <span className="text-[10px] block text-zinc-400 mt-1 pl-5">
                    Accept orders 24/7 anytime
                  </span>
                </div>

                <div
                  onClick={() => handleInputChange("storeMode", "FORCE_CLOSED")}
                  className={`p-3.5 rounded-xl border cursor-pointer min-h-[50px] transition-colors ${
                    formData.storeMode === "FORCE_CLOSED"
                      ? "bg-rose-950 border-rose-500 text-rose-300"
                      : "bg-surface-raised border-border text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="storeModeRadio"
                      checked={formData.storeMode === "FORCE_CLOSED"}
                      onChange={() => handleInputChange("storeMode", "FORCE_CLOSED")}
                      className="text-primary focus:ring-0"
                    />
                    <strong className="text-xs">FORCE CLOSED</strong>
                  </div>
                  <span className="text-[10px] block text-zinc-400 mt-1 pl-5">
                    Emergency closure (No orders)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimum Order Threshold */}
          <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-3 font-heading">
              Order Thresholds (ZERO GST / TAX)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="minOrderAmount" className="block font-bold text-zinc-400 uppercase mb-1">
                  Minimum Order Amount (₹) *
                </label>
                <input
                  id="minOrderAmount"
                  name="minOrderAmount"
                  type="number"
                  min="0"
                  required
                  value={formData.minOrderAmount}
                  onChange={(e) => handleInputChange("minOrderAmount", e.target.value)}
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Phone className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                Cloud Kitchen Contact Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="phone" className="block font-bold text-zinc-400 uppercase mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Kitchen Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+91 90801 39363"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="whatsapp" className="block font-bold text-zinc-400 uppercase mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Support Number
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  placeholder="+91 90801 39363"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block font-bold text-zinc-400 uppercase mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Physical Cloud Kitchen Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="e.g. 123 Food Street, Late Night Hub, Tirunelveli - 627001"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="city" className="block font-bold text-zinc-400 uppercase mb-1">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g. Tirunelveli"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Final Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow transition-all min-h-[48px] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving Settings..." : "SAVE SETTINGS"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight,
  Sparkles,
  Power,
  Settings,
  AlertTriangle,
  Tag,
  Truck,
  Layers,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatINR, formatDate, getStatusInfo } from "@/lib/utils";
import { useStore } from "@/context/StoreContext";
import { ComboType, ProductType } from "@/types";

export default function AdminDashboardPage() {
  const { status, setStoreMode, openStore, closeStore } = useStore();
  const [reportData, setReportData] = useState<any>(null);
  const [combos, setCombos] = useState<ComboType[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Close Store Confirmation Modal State
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [isUpdatingStore, setIsUpdatingStore] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [repRes, combosRes, prodRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/combos?admin=true"),
        fetch("/api/menu"),
      ]);

      if (repRes.ok) {
        const rep = await repRes.json();
        setReportData(rep);
      }
      if (combosRes.ok) {
        const cData = await combosRes.json();
        setCombos(cData.combos || []);
      }
      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(pData.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleModeChange = async (mode: "AUTO" | "FORCE_OPEN" | "FORCE_CLOSED") => {
    if (mode === "FORCE_CLOSED") {
      setCloseConfirmOpen(true);
      return;
    }
    setIsUpdatingStore(true);
    await setStoreMode(mode);
    setIsUpdatingStore(false);
  };

  const confirmCloseStore = async () => {
    setIsUpdatingStore(true);
    await closeStore();
    setCloseConfirmOpen(false);
    setIsUpdatingStore(false);
  };

  const handleToggleCombo = async (combo: ComboType) => {
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
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stats = reportData?.stats || {
    todayOrdersCount: 0,
    todaySales: 0,
    foodSales: 0,
    deliveryCollected: 0,
    pendingOrdersCount: 0,
    completedOrdersCount: 0,
    averageOrderValue: 0,
    peakOrderingHour: "10 PM",
  };

  const hourlyPerformance = reportData?.hourlyPerformance || [];
  const popularProducts = reportData?.popularProducts || [];

  const activeProductsCount = products.filter((p) => p.isAvailable).length;
  const offProductsCount = products.filter((p) => !p.isAvailable).length;

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Kitchen Overview Dashboard"
        subtitle="Real-time control hub, Daily Combos, Distance Deliveries & Sales (ZERO GST)."
        actionButton={
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" /> Open Live Orders
          </Link>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* PROMINENT STORE STATUS & QUICK STATS BAR */}
        <div
          className={`p-6 rounded-3xl border transition-all ${
            status.isOpen
              ? "bg-gradient-to-r from-emerald-950/40 via-surface to-surface border-emerald-500/50 shadow-glow"
              : "bg-gradient-to-r from-rose-950/40 via-surface to-surface border-rose-500/50"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Status Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    status.isOpen ? "bg-emerald-400 animate-ping" : "bg-rose-500"
                  }`}
                />
                <span className="text-xl font-black text-white uppercase tracking-wider font-heading">
                  STORE STATUS:{" "}
                  <span className={status.isOpen ? "text-emerald-400" : "text-rose-400"}>
                    {status.isOpen ? "● OPEN" : "● CLOSED"}
                  </span>
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-surface border border-border text-[10px] font-bold text-zinc-400">
                  {status.storeMode === "AUTO"
                    ? "AUTO (7 PM – 2 AM)"
                    : status.storeMode === "FORCE_OPEN"
                    ? "FORCE OPEN"
                    : "FORCE CLOSED"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {status.isOpen
                  ? "Customers can customize items, add daily combos and place orders."
                  : "Midnight Fuel is currently not accepting new orders. Customer website is in browsing mode."}
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border text-xs">
                <button
                  onClick={() => handleModeChange("AUTO")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    status.storeMode === "AUTO"
                      ? "bg-white text-black font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  AUTO
                </button>
                <button
                  onClick={() => handleModeChange("FORCE_OPEN")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    status.storeMode === "FORCE_OPEN"
                      ? "bg-emerald-500 text-black font-extrabold shadow-glow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  FORCE OPEN
                </button>
                <button
                  onClick={() => handleModeChange("FORCE_CLOSED")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    status.storeMode === "FORCE_CLOSED"
                      ? "bg-rose-600 text-white font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  FORCE CLOSED
                </button>
              </div>

              {status.isOpen ? (
                <button
                  onClick={() => setCloseConfirmOpen(true)}
                  disabled={isUpdatingStore}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow transition-all"
                >
                  <Power className="w-4 h-4" /> CLOSE STORE
                </button>
              ) : (
                <button
                  onClick={() => openStore()}
                  disabled={isUpdatingStore}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow transition-all"
                >
                  <Power className="w-4 h-4" /> OPEN STORE
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TOP SUMMARY BAR: TODAY'S COMBOS & MENU HEALTH */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Today's Combos Live Status Card */}
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3 shadow-card">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <Sparkles className="w-4 h-4 text-primary" /> Today's Daily Combos
              </span>
              <Link href="/admin/combos" className="text-xs text-primary hover:underline font-semibold">
                Manage Combos →
              </Link>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {combos.length === 0 ? (
                <span className="text-xs text-zinc-500">No combos created yet.</span>
              ) : (
                combos.map((combo) => (
                  <button
                    key={combo.id}
                    onClick={() => handleToggleCombo(combo)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                      combo.isActive
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-400"
                        : "bg-rose-950/60 border-rose-500/50 text-rose-400"
                    }`}
                  >
                    <span>{combo.name}</span>
                    <span>{combo.isActive ? "🟢 ON" : "🔴 OFF"}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Menu Items Active vs Off Card */}
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3 shadow-card">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <Layers className="w-4 h-4 text-primary" /> Menu Item Health
              </span>
              <Link href="/admin/menu" className="text-xs text-primary hover:underline font-semibold">
                View Full Menu →
              </Link>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeProductsCount} Items Active</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>{offProductsCount} Items Off / Sold Out</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Today's Orders */}
          <div className="p-5 rounded-2xl bg-surface border border-border flex items-center justify-between shadow-card">
            <div className="flex-1">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Today's Orders
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black text-white mt-1 block transition-all duration-300 ${
                  isLoading ? "filter blur-md opacity-30 select-none animate-pulse" : "filter-none opacity-100"
                }`}
              >
                {isLoading ? "00" : stats.todayOrdersCount}
              </span>
              <span
                className={`text-[11px] text-emerald-400 font-medium block transition-all duration-300 ${
                  isLoading ? "filter blur-sm opacity-30 select-none" : "filter-none opacity-100"
                }`}
              >
                Live across shift
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          {/* Today's Sales */}
          <div className="p-5 rounded-2xl bg-surface border border-border flex items-center justify-between shadow-card">
            <div className="flex-1">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Today's Revenue
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black text-primary mt-1 block transition-all duration-300 ${
                  isLoading ? "filter blur-md opacity-30 select-none animate-pulse" : "filter-none opacity-100"
                }`}
              >
                {isLoading ? "₹00,000" : formatINR(stats.todaySales)}
              </span>
              <span
                className={`text-[11px] text-zinc-400 block transition-all duration-300 ${
                  isLoading ? "filter blur-sm opacity-30 select-none" : "filter-none opacity-100"
                }`}
              >
                Food: {formatINR(stats.foodSales || stats.todaySales)} • Delivery: {formatINR(stats.deliveryCollected || 0)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          {/* Pending Orders */}
          <div className="p-5 rounded-2xl bg-surface border border-border flex items-center justify-between shadow-card">
            <div className="flex-1">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Pending Active
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black text-amber-400 mt-1 block transition-all duration-300 ${
                  isLoading ? "filter blur-md opacity-30 select-none animate-pulse" : "filter-none opacity-100"
                }`}
              >
                {isLoading ? "00" : stats.pendingOrdersCount}
              </span>
              <span
                className={`text-[11px] text-amber-400 font-medium block transition-all duration-300 ${
                  isLoading ? "filter blur-sm opacity-30 select-none" : "filter-none opacity-100"
                }`}
              >
                Kitchen in progress
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Completed Orders */}
          <div className="p-5 rounded-2xl bg-surface border border-border flex items-center justify-between shadow-card">
            <div className="flex-1">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Completed
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block transition-all duration-300 ${
                  isLoading ? "filter blur-md opacity-30 select-none animate-pulse" : "filter-none opacity-100"
                }`}
              >
                {isLoading ? "00" : stats.completedOrdersCount}
              </span>
              <span
                className={`text-[11px] text-emerald-400 font-medium block transition-all duration-300 ${
                  isLoading ? "filter blur-sm opacity-30 select-none" : "filter-none opacity-100"
                }`}
              >
                Delivered & settled
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Hourly Midnight Performance Chart */}
        <div className="p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
                Tonight's Performance (7:00 PM – 2:00 AM)
              </h3>
              <p className="text-xs text-zinc-400">
                Late-night hourly sales distribution & order volume (ZERO GST)
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-primary/20 text-primary text-xs font-bold">
              Peak: {stats.peakOrderingHour}
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyPerformance}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF7A00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#333",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(val: any, name: any) => [
                    `₹${val}`,
                    "Revenue",
                  ]}
                  labelFormatter={(label: any) => `Time: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF7A00"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                  name="Revenue (₹)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      {/* Close Store Confirmation Modal */}
      {closeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141414] border border-rose-800/80 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Close Midnight Fuel?</h3>
            </div>

            <p className="text-zinc-300 text-sm">
              Customers will not be able to place new orders while the store is closed.
            </p>
            <p className="text-[11px] text-zinc-500">
              You can reopen the store at any time from this dashboard or restore Automatic mode.
            </p>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCloseConfirmOpen(false)}
                className="px-4 py-2 bg-surface-raised text-zinc-400 rounded-xl font-bold uppercase"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmCloseStore}
                disabled={isUpdatingStore}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl uppercase shadow-glow"
              >
                {isUpdatingStore ? "Closing..." : "CLOSE STORE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

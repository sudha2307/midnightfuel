"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Flame,
  BarChart3,
  ArrowLeftRight,
  Eye,
  Calendar,
  Layers,
  ChevronDown,
  ShoppingBag,
  IndianRupee,
  Clock,
  Sparkles,
  TrendingUp,
  Crown,
  CheckCircle2,
  Phone,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { formatINR, formatDate, getStatusInfo } from "@/lib/utils";

export default function DishAnalyticsSection() {
  const [viewMode, setViewMode] = useState<"single" | "compare">("single");
  const [range, setRange] = useState<string>("all");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const [dish1Id, setDish1Id] = useState<string>("");
  const [dish2Id, setDish2Id] = useState<string>("");

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch Analytics Data
  const fetchAnalytics = async (d1?: string, d2?: string, rng?: string) => {
    setIsLoading(true);
    try {
      const activeRange = rng || range;
      const targetD1 = d1 !== undefined ? d1 : dish1Id;
      const targetD2 = d2 !== undefined ? d2 : dish2Id;

      let url = `/api/admin/dish-analytics?range=${activeRange}`;
      if (targetD1) url += `&dish1Id=${encodeURIComponent(targetD1)}`;
      if (targetD2) url += `&dish2Id=${encodeURIComponent(targetD2)}`;
      if (activeRange === "custom" && customStart) {
        url += `&startDate=${customStart}`;
        if (customEnd) url += `&endDate=${customEnd}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);

        // Auto-select initial dishes if not set
        if (!dish1Id && data.allDishesList && data.allDishesList.length > 0) {
          setDish1Id(data.allDishesList[0].id);
        }
        if (!dish2Id && data.allDishesList && data.allDishesList.length > 1) {
          setDish2Id(data.allDishesList[1].id);
        }
      }
    } catch (e) {
      console.error("Failed to load dish analytics:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range, dish1Id, dish2Id]);

  const handleApplyCustomDate = () => {
    if (customStart) {
      setRange("custom");
      fetchAnalytics(dish1Id, dish2Id, "custom");
    }
  };

  const handleSelectTopDish = (dishId: string) => {
    setDish1Id(dishId);
    if (viewMode === "compare" && dish2Id === dishId && allDishes.length > 1) {
      const alternate = allDishes.find((d: any) => d.id !== dishId);
      if (alternate) setDish2Id(alternate.id);
    }
  };

  const allDishes = analyticsData?.allDishesList || [];
  const topWeekly = analyticsData?.topWeeklyDishes || [];
  const dish1 = analyticsData?.dish1Analytics;
  const dish2 = analyticsData?.dish2Analytics;
  const comparison = analyticsData?.comparison;

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* 1. THIS WEEK TOP PERFORMANCE (TOP 5 BEST SELLERS) */}
      {/* ============================================================ */}
      <div className="p-6 rounded-3xl bg-surface border border-border shadow-card space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide font-heading uppercase flex items-center gap-2">
                This Week Top Performance
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-black uppercase tracking-wider">
                  Top 5 Dishes
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Most ordered food & combos ranked by shift volume (7 PM – 2 AM). Click any item to inspect.
              </p>
            </div>
          </div>
        </div>

        {/* Top 5 Dishes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topWeekly.map((item: any) => {
            const isRank1 = item.rank === 1;
            const isRank2 = item.rank === 2;
            const isRank3 = item.rank === 3;
            const isSelected = dish1Id === item.id || dish2Id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectTopDish(item.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 relative group flex flex-col justify-between ${
                  isSelected
                    ? "bg-surface-raised border-primary shadow-glow scale-[1.02]"
                    : "bg-surface-raised/60 hover:bg-surface-raised border-border/80 hover:border-zinc-500"
                }`}
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                      isRank1
                        ? "bg-amber-400 text-black shadow-amber-400/20"
                        : isRank2
                        ? "bg-zinc-200 text-black"
                        : isRank3
                        ? "bg-amber-700 text-white"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {isRank1 ? <Crown className="w-3 h-3 fill-black" /> : null}
                    <span>Rank #{item.rank}</span>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-semibold">
                    {item.sharePercentage}% volume
                  </span>
                </div>

                {/* Dish Image */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2.5 bg-zinc-900 border border-border/50">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-extrabold text-primary">
                    ₹{item.price}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block truncate">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-black text-white line-clamp-1 group-hover:text-primary transition-colors">
                    {item.name}
                  </h4>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-semibold">Sold</span>
                      <strong className="text-white font-extrabold text-sm">{item.quantity}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block font-semibold">Revenue</span>
                      <strong className="text-primary font-black text-xs">{formatINR(item.revenue)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. ITEM SALES ANALYTICS & TWO-DISH COMPARISON TOOL */}
      {/* ============================================================ */}
      <div className="p-6 rounded-3xl bg-surface border border-border shadow-card space-y-6">
        {/* Section Header & View Toggle Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-extrabold text-white tracking-wide font-heading uppercase">
                Dish Sales Analytics & Product Comparison
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Inspect order volumes, revenue, best days, or compare two dishes head-to-head.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-2xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setViewMode("single")}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "single"
                    ? "bg-primary text-black font-extrabold shadow-glow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Single Dish View
              </button>

              <button
                type="button"
                onClick={() => setViewMode("compare")}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "compare"
                    ? "bg-primary text-black font-extrabold shadow-glow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> Compare Two Dishes
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar: Timeframe Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-raised/60 p-3 rounded-2xl border border-border/80">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Period:
            </span>
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  range === tab.id
                    ? "bg-white text-black font-black"
                    : "text-zinc-400 hover:text-white bg-surface border border-border/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-primary"
            />
            <span className="text-zinc-500 font-bold">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleApplyCustomDate}
              disabled={!customStart}
              className="px-3 py-1.5 rounded-xl bg-primary text-black font-extrabold text-xs shadow-sm hover:bg-primary-hover disabled:opacity-40"
            >
              Filter
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW MODE A: SINGLE DISH VIEW */}
        {/* ============================================================ */}
        {viewMode === "single" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Dish Dropdown Selector */}
            <div className="max-w-md space-y-1.5">
              <label htmlFor="singleDishSelect" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Select Dish or Combo to Analyze:
              </label>
              <select
                id="singleDishSelect"
                value={dish1Id}
                onChange={(e) => setDish1Id(e.target.value)}
                className="w-full rounded-2xl bg-surface-raised border border-border px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[46px] font-semibold"
              >
                {allDishes.map((dish: any) => (
                  <option key={dish.id} value={dish.id}>
                    {dish.type === "COMBO" ? "🍱 [COMBO]" : dish.isVeg ? "🌿 [VEG]" : "🍗 [NON-VEG]"} {dish.name} — ₹{dish.price} ({dish.category})
                  </option>
                ))}
              </select>
            </div>

            {dish1 && (
              <div className="space-y-6">
                {/* Hero Item Overview & 4 Stat Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Dish Profile Preview */}
                  <div className="lg:col-span-4 p-5 rounded-3xl bg-surface-raised border border-border flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-start gap-4">
                      <img
                        src={dish1.dish.image}
                        alt={dish1.dish.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-border/80 flex-shrink-0 shadow-md"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            {dish1.dish.category}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dish1.dish.isVeg ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"}`}>
                            {dish1.dish.isVeg ? "🌿 Veg" : "🍗 Non-Veg"}
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-white">
                          {dish1.dish.name}
                        </h4>
                        <span className="text-xl font-black text-primary block">
                          ₹{dish1.dish.price}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/60 mt-4 text-[11px] text-zinc-400 flex items-center justify-between">
                      <span>Menu Status:</span>
                      <span className={`font-bold ${dish1.dish.isAvailable ? "text-emerald-400" : "text-rose-400"}`}>
                        {dish1.dish.isAvailable ? "● Active in Menu" : "● Sold Out / Off"}
                      </span>
                    </div>
                  </div>

                  {/* Right: 4 High-Impact KPI Badges */}
                  <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-3xl bg-surface-raised border border-border flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase">Total Units Sold</span>
                      <div>
                        <span className="text-2xl sm:text-3xl font-black text-white block mt-2">
                          {dish1.totalQuantity}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">Portions prepared</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-3xl bg-surface-raised border border-border flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase">Total Revenue</span>
                      <div>
                        <span className="text-2xl sm:text-3xl font-black text-primary block mt-2">
                          {formatINR(dish1.totalRevenue)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">Gross food sales</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-3xl bg-surface-raised border border-border flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase">Orders Count</span>
                      <div>
                        <span className="text-2xl sm:text-3xl font-black text-emerald-400 block mt-2">
                          {dish1.ordersCount}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">Appears in orders</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-3xl bg-surface-raised border border-border flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase">Peak Sales Day</span>
                      <div>
                        <span className="text-sm sm:text-base font-black text-amber-400 block mt-2 leading-tight">
                          {dish1.peakDay}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">Highest volume shift</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales Volume & Revenue Trend Chart */}
                {dish1.dailyTrend && dish1.dailyTrend.length > 0 && (
                  <div className="p-5 rounded-3xl bg-surface-raised border border-border space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-primary" /> Sales Trend for {dish1.dish.name}
                      </h4>
                      <span className="text-[11px] text-zinc-400">
                        {dish1.dailyTrend.length} days with order activity
                      </span>
                    </div>

                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dish1.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="label" stroke="#666" fontSize={10} />
                          <YAxis stroke="#666" fontSize={10} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#111",
                              borderColor: "#333",
                              borderRadius: "12px",
                              fontSize: "11px",
                            }}
                            formatter={(val: any, name: any) => [
                              name === "revenue" ? `₹${val}` : `${val} units`,
                              name === "revenue" ? "Revenue" : "Quantity Sold",
                            ]}
                          />
                          <Bar dataKey="quantity" fill="#FF7A00" radius={[6, 6, 0, 0]} maxBarSize={36} name="quantity" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Recent Orders Containing This Dish */}
                <div className="p-5 rounded-3xl bg-surface-raised border border-border space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Recent Orders with this Dish ({dish1.recentOrders.length} records)
                    </h4>
                    <span className="text-[11px] text-zinc-400">Showing latest orders</span>
                  </div>

                  {dish1.recentOrders.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">No order records found for this period.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border text-zinc-400 uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3">Order #</th>
                            <th className="py-2.5 px-3">Date & Time</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3 text-center">Qty</th>
                            <th className="py-2.5 px-3 text-right">Dish Total</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {dish1.recentOrders.map((ord: any) => (
                            <tr key={ord.orderId} className="hover:bg-surface/60 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-white">
                                {ord.orderNumber}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-400">
                                {new Date(ord.createdAt).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="py-2.5 px-3 text-white font-medium">
                                {ord.customerName}
                                <span className="text-[10px] text-zinc-500 block">+91 {ord.customerPhone}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                                  {ord.orderType}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-extrabold text-white">
                                {ord.quantity}x
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-primary">
                                {formatINR(ord.totalPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="text-[10px] font-bold text-zinc-300">
                                  {ord.orderStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW MODE B: COMPARE TWO DISHES (SPLIT VIEW) */}
        {/* ============================================================ */}
        {viewMode === "compare" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Two Selectors: Left Dish 1 vs Right Dish 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Dish 1 Selector */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-surface-raised border border-primary/40">
                <label htmlFor="dish1Select" className="block text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-black font-black text-xs flex items-center justify-center">1</span>
                  Select Left Dish (Dish 1):
                </label>
                <select
                  id="dish1Select"
                  value={dish1Id}
                  onChange={(e) => setDish1Id(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary min-h-[44px] font-semibold"
                >
                  {allDishes.map((dish: any) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name} — ₹{dish.price} ({dish.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dish 2 Selector */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-surface-raised border border-cyan-500/40">
                <label htmlFor="dish2Select" className="block text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-400 text-black font-black text-xs flex items-center justify-center">2</span>
                  Select Right Dish (Dish 2):
                </label>
                <select
                  id="dish2Select"
                  value={dish2Id}
                  onChange={(e) => setDish2Id(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 min-h-[44px] font-semibold"
                >
                  {allDishes.map((dish: any) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name} — ₹{dish.price} ({dish.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Verdict Banner */}
            {comparison && (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-primary/10 via-surface-raised to-cyan-500/10 border border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" /> Head-to-Head Comparison Summary
                  </span>
                  <span className="text-xs text-zinc-300 font-bold">
                    {comparison.summaryText}
                  </span>
                </div>

                {/* Visual Progress Ratio Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-primary">{comparison.dish1.name} ({comparison.dish1.revenueShare}%)</span>
                    <span className="text-cyan-400">({comparison.dish2.revenueShare}%) {comparison.dish2.name}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
                    <div
                      style={{ width: `${comparison.dish1.revenueShare}%` }}
                      className="bg-primary h-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${comparison.dish2.revenueShare}%` }}
                      className="bg-cyan-400 h-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SPLIT 2-COLUMN COMPARISON CARDS */}
            {dish1 && dish2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ================= LEFT: DISH 1 ================= */}
                <div className="p-5 sm:p-6 rounded-3xl bg-surface-raised border border-primary/40 space-y-5 shadow-card relative">
                  {comparison?.dish1.isRevWinner && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary text-black font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-glow">
                      <Crown className="w-3 h-3 fill-black" /> Highest Revenue Winner
                    </div>
                  )}

                  {/* Profile */}
                  <div className="flex items-start gap-4">
                    <img
                      src={dish1.dish.image}
                      alt={dish1.dish.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-border shadow-md flex-shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-primary uppercase block">
                        Dish 1 • {dish1.dish.category}
                      </span>
                      <h4 className="text-base sm:text-xl font-black text-white">
                        {dish1.dish.name}
                      </h4>
                      <span className="text-lg font-black text-primary">
                        ₹{dish1.dish.price}
                      </span>
                    </div>
                  </div>

                  {/* Stat Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total Units Sold</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-black text-white">{dish1.totalQuantity}</span>
                        <span className="text-[10px] text-zinc-500 font-semibold">portions</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total Sales</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-black text-primary">{formatINR(dish1.totalRevenue)}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Orders Count</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xl font-black text-emerald-400">{dish1.ordersCount}</span>
                        <span className="text-[10px] text-zinc-500">orders</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Avg Qty / Order</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xl font-black text-amber-400">{dish1.avgQuantityPerOrder}</span>
                        <span className="text-[10px] text-zinc-500">units</span>
                      </div>
                    </div>

                    <div className="col-span-2 p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Peak Sales Day</span>
                      <span className="text-xs font-black text-white mt-0.5 block">{dish1.peakDay}</span>
                    </div>
                  </div>
                </div>

                {/* ================= RIGHT: DISH 2 ================= */}
                <div className="p-5 sm:p-6 rounded-3xl bg-surface-raised border border-cyan-500/40 space-y-5 shadow-card relative">
                  {comparison?.dish2.isRevWinner && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-cyan-400 text-black font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-glow">
                      <Crown className="w-3 h-3 fill-black" /> Highest Revenue Winner
                    </div>
                  )}

                  {/* Profile */}
                  <div className="flex items-start gap-4">
                    <img
                      src={dish2.dish.image}
                      alt={dish2.dish.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-border shadow-md flex-shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase block">
                        Dish 2 • {dish2.dish.category}
                      </span>
                      <h4 className="text-base sm:text-xl font-black text-white">
                        {dish2.dish.name}
                      </h4>
                      <span className="text-lg font-black text-cyan-400">
                        ₹{dish2.dish.price}
                      </span>
                    </div>
                  </div>

                  {/* Stat Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total Units Sold</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-black text-white">{dish2.totalQuantity}</span>
                        <span className="text-[10px] text-zinc-500 font-semibold">portions</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total Sales</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-black text-cyan-400">{formatINR(dish2.totalRevenue)}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Orders Count</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xl font-black text-emerald-400">{dish2.ordersCount}</span>
                        <span className="text-[10px] text-zinc-500">orders</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Avg Qty / Order</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xl font-black text-amber-400">{dish2.avgQuantityPerOrder}</span>
                        <span className="text-[10px] text-zinc-500">units</span>
                      </div>
                    </div>

                    <div className="col-span-2 p-3.5 rounded-2xl bg-surface border border-border">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Peak Sales Day</span>
                      <span className="text-xs font-black text-white mt-0.5 block">{dish2.peakDay}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

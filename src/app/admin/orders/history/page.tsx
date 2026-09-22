"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Printer,
  Calendar,
  IndianRupee,
  Receipt,
  Truck,
  Sparkles,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ExternalLink,
  ShoppingBag,
  Phone,
  MessageCircle,
  MapPin,
  UtensilsCrossed,
  Layers,
  ChefHat,
  Package,
  ArrowRight,
  AlertTriangle,
  History,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { OrderType } from "@/types";
import { formatINR, formatDate, formatTimeOnly, getStatusInfo } from "@/lib/utils";
import { getWhatsAppDirectLink, generateWhatsAppMessageText } from "@/services/whatsappService";

type FilterPreset = "today" | "yesterday" | "last7days" | "thisMonth" | "lastMonth" | "custom" | "all";

export default function AdminOrderHistoryPage() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter Presets
  const [datePreset, setDatePreset] = useState<FilterPreset>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderTypeFilter, setOrderTypeFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");

  // Selected Order for Full Modal Preview
  const [previewOrder, setPreviewOrder] = useState<OrderType | null>(null);

  // Pagination State (150 records per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 150;

  // Reset page to 1 whenever any filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    datePreset,
    customStartDate,
    customEndDate,
    orderStatusFilter,
    orderTypeFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    search,
  ]);

  const loadOrders = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await fetch("/api/orders?limit=1500");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error("Failed to load order history", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter logic based on date preset, custom range, and status criteria
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

    const last7DaysStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return orders.filter((ord) => {
      const orderDate = new Date(ord.createdAt);

      // 1. Date preset evaluation
      if (datePreset === "today") {
        if (orderDate < todayStart || orderDate > todayEnd) return false;
      } else if (datePreset === "yesterday") {
        if (orderDate < yesterdayStart || orderDate > yesterdayEnd) return false;
      } else if (datePreset === "last7days") {
        if (orderDate < last7DaysStart) return false;
      } else if (datePreset === "thisMonth") {
        if (orderDate < thisMonthStart) return false;
      } else if (datePreset === "lastMonth") {
        if (orderDate < lastMonthStart || orderDate > lastMonthEnd) return false;
      } else if (datePreset === "custom") {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }

      // 2. Order Status Filter (e.g. CANCELLED / REJECTED, DELIVERED, etc.)
      if (orderStatusFilter !== "ALL") {
        if (ord.orderStatus !== orderStatusFilter) return false;
      }

      // 3. Order Type (DELIVERY / PICKUP)
      if (orderTypeFilter !== "ALL") {
        if (ord.orderType !== orderTypeFilter) return false;
      }

      // 4. Payment Method Filter
      if (paymentMethodFilter !== "ALL") {
        const method = (ord.paymentMethod || "").toUpperCase();
        if (paymentMethodFilter === "COD" && method !== "COD" && method !== "CASH") return false;
        if (paymentMethodFilter === "UPI" && method !== "UPI") return false;
      }

      // 5. Payment Status Filter
      if (paymentStatusFilter !== "ALL") {
        if (ord.paymentStatus !== paymentStatusFilter) return false;
      }

      // 6. Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const invNum = (ord.invoice?.invoiceNumber || `INV-${ord.orderNumber}`).toLowerCase();
        const matchesNum = ord.orderNumber.toLowerCase().includes(q) || invNum.includes(q);
        const matchesName = (ord.customerName || "").toLowerCase().includes(q);
        const matchesPhone = (ord.customerPhone || "").includes(q);
        const matchesAddress = (ord.deliveryAddress || "").toLowerCase().includes(q);
        const matchesItems = ord.items.some((i) => i.productName.toLowerCase().includes(q));
        const matchesCombos = (ord.combos || []).some((c) => c.comboNameSnapshot.toLowerCase().includes(q));
        return matchesNum || matchesName || matchesPhone || matchesAddress || matchesItems || matchesCombos;
      }

      return true;
    });
  }, [
    orders,
    datePreset,
    customStartDate,
    customEndDate,
    orderStatusFilter,
    orderTypeFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    search,
  ]);

  // Aggregate Metrics for Selected Range
  const metrics = useMemo(() => {
    const validOrders = filteredOrders.filter((o) => o.orderStatus !== "CANCELLED");
    const cancelledOrders = filteredOrders.filter((o) => o.orderStatus === "CANCELLED");
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const foodSubtotal = validOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const deliveryCharges = validOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
    const deliveryCount = validOrders.filter((o) => o.orderType === "DELIVERY").length;
    const pickupCount = validOrders.filter((o) => o.orderType === "PICKUP").length;
    const aov = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    return {
      totalCount: filteredOrders.length,
      validCount: validOrders.length,
      cancelledCount: cancelledOrders.length,
      totalRevenue,
      foodSubtotal,
      deliveryCharges,
      deliveryCount,
      pickupCount,
      aov,
    };
  }, [filteredOrders]);

  // Pagination Slice (150 per page)
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Order History Archive"
        subtitle="Complete chronological orders audit, rejected orders, fulfillment breakdown & item details."
        actionButton={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow transition-all"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>Live Orders Board</span>
            </Link>
            <button
              onClick={() => loadOrders(true)}
              disabled={isRefreshing}
              className="p-2 px-3 rounded-xl bg-surface border border-border hover:border-primary text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-primary ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* 1. Date Range Preset Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Period:
              </span>

              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "last7days", label: "Last 7 Days" },
                { id: "thisMonth", label: "This Month" },
                { id: "lastMonth", label: "Last Month" },
                { id: "custom", label: "Custom Range" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDatePreset(tab.id as FilterPreset)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    datePreset === tab.id
                      ? "bg-primary text-black font-black shadow-glow"
                      : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {datePreset === "custom" && (
              <div className="flex items-center gap-2 bg-surface-raised p-2 rounded-2xl border border-border">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block">From</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-white focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block">To</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-white focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Secondary Filter Bar: Search, Status, Type, Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-border/70">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, customer, phone, item..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[42px]"
              />
            </div>

            {/* Order Status Filter */}
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-raised border border-border text-xs text-white focus:border-primary min-h-[42px] cursor-pointer"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="NEW">New Orders</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered / Collected</option>
              <option value="CANCELLED">🔴 Rejected / Cancelled</option>
            </select>

            {/* Fulfillment Filter */}
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-raised border border-border text-xs text-white focus:border-primary min-h-[42px] cursor-pointer"
            >
              <option value="ALL">All Fulfillment</option>
              <option value="DELIVERY">🛵 Home Delivery</option>
              <option value="PICKUP">🥡 Kitchen Pickup</option>
            </select>

            {/* Payment Method / Status */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-raised border border-border text-xs text-white focus:border-primary min-h-[42px] cursor-pointer"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="UPI">UPI / Digital</option>
            </select>
          </div>
        </div>

        {/* 3. Top Metrics KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Orders Count */}
          <div className="p-5 rounded-3xl bg-surface border border-border flex items-center justify-between shadow-card">
            <div>
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Total Orders Found
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black text-white mt-1 block transition-all duration-300 ${
                  isLoading ? "filter blur-md opacity-30 animate-pulse select-none" : "filter-none opacity-100"
                }`}
              >
                {isLoading ? "00" : metrics.totalCount}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                <span className="text-emerald-400 font-bold">✓ {metrics.validCount} Active/Delivered</span>
                {metrics.cancelledCount > 0 && (
                  <span className="text-rose-400 font-bold">✕ {metrics.cancelledCount} Rejected</span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Total Revenue */}
          <div className="p-5 rounded-3xl bg-surface border border-border flex items-center justify-between shadow-card">
            <div>
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Total Revenue (Zero GST)
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black text-primary mt-1 block transition-all duration-300 ${
                  isLoading ? "filter blur-md opacity-30 animate-pulse select-none" : "filter-none opacity-100"
                }`}
              >
                {isLoading ? "₹00,000" : formatINR(metrics.totalRevenue)}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-1">
                Food: {formatINR(metrics.foodSubtotal)} • Delivery: {formatINR(metrics.deliveryCharges)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Fulfillment Split */}
          <div className="p-5 rounded-3xl bg-surface border border-border flex items-center justify-between shadow-card">
            <div>
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Fulfillment Split
              </span>
              <div
                className={`text-base font-black text-white mt-1.5 space-y-0.5 transition-all duration-300 ${
                  isLoading ? "filter blur-md opacity-30 animate-pulse select-none" : "filter-none opacity-100"
                }`}
              >
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{metrics.deliveryCount} Delivery ({metrics.validCount > 0 ? Math.round((metrics.deliveryCount / metrics.validCount) * 100) : 0}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                  <Package className="w-3.5 h-3.5" />
                  <span>{metrics.pickupCount} Kitchen Pickup</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Average Order Value */}
          <div className="p-5 rounded-3xl bg-surface border border-border flex items-center justify-between shadow-card">
            <div>
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Average Order Value
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black text-white mt-1 block transition-all duration-300 ${
                  isLoading ? "filter blur-md opacity-30 animate-pulse select-none" : "filter-none opacity-100"
                }`}
              >
                {isLoading ? "₹000" : formatINR(metrics.aov)}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-1">
                Per successful order
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 4. DESKTOP VIEW: Complete Order History Data Table */}
        <div className="hidden md:block rounded-3xl bg-surface border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-zinc-400 uppercase tracking-wider bg-surface-raised/60">
                  <th className="py-4 px-6 font-bold">Order # & Date</th>
                  <th className="py-4 px-4 font-bold">Customer & Contact</th>
                  <th className="py-4 px-4 font-bold">Type & Location</th>
                  <th className="py-4 px-4 font-bold">Items Summary</th>
                  <th className="py-4 px-4 font-bold">Status</th>
                  <th className="py-4 px-4 font-bold text-right">Amount</th>
                  <th className="py-4 px-6 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6 space-y-1.5">
                        <div className="w-24 h-4 rounded bg-zinc-800" />
                        <div className="w-16 h-3 rounded bg-zinc-800/60" />
                      </td>
                      <td className="py-4 px-4 space-y-1.5">
                        <div className="w-32 h-4 rounded bg-zinc-800" />
                        <div className="w-24 h-3 rounded bg-zinc-800/60" />
                      </td>
                      <td className="py-4 px-4 space-y-1">
                        <div className="w-24 h-4 rounded bg-zinc-800" />
                        <div className="w-40 h-3 rounded bg-zinc-800/60" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-36 h-4 rounded bg-zinc-800" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-20 h-6 rounded-full bg-zinc-800" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="w-16 h-5 rounded bg-zinc-800 ml-auto" />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-block w-20 h-8 rounded-xl bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-zinc-500">
                      <Package className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                      <p className="font-bold text-zinc-300">No Orders Found</p>
                      <p className="text-xs text-zinc-500 mt-1">No orders matched the selected date period and filters.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((ord) => {
                    const statusInfo = getStatusInfo(ord.orderStatus);
                    const isCancelled = ord.orderStatus === "CANCELLED";
                    const isPaid = ord.paymentStatus === "PAID" || ord.paymentStatus === "COMPLETED";

                    const itemsCount = ord.items.length + (ord.combos?.length || 0);
                    const itemsSummary = [
                      ...ord.items.map((i) => `${i.quantity}× ${i.productName}`),
                      ...(ord.combos || []).map((c) => `${c.quantity}× ${c.comboNameSnapshot}`),
                    ].join(", ");

                    const waText = generateWhatsAppMessageText({
                      to: ord.customerWhatsapp,
                      orderNumber: ord.orderNumber,
                      customerName: ord.customerName,
                      status: ord.orderStatus,
                      grandTotal: ord.grandTotal,
                      itemsSummary,
                    });
                    const waLink = getWhatsAppDirectLink(ord.customerWhatsapp, waText);

                    return (
                      <tr
                        key={ord.id}
                        className={`transition-colors ${
                          isCancelled
                            ? "bg-rose-950/20 hover:bg-rose-950/30"
                            : "hover:bg-surface-raised/40"
                        }`}
                      >
                        {/* Order # & Date */}
                        <td className="py-4 px-6">
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="text-sm font-black text-white hover:text-primary transition-colors font-heading block"
                          >
                            #{ord.orderNumber}
                          </Link>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            {formatDate(ord.createdAt)} • {formatTimeOnly(ord.createdAt)}
                          </span>
                        </td>

                        {/* Customer & Contact */}
                        <td className="py-4 px-4">
                          <span className="font-bold text-white text-sm block">
                            {ord.customerName}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                            <a
                              href={`tel:${ord.customerPhone}`}
                              className="hover:text-primary text-zinc-300 font-medium flex items-center gap-0.5"
                            >
                              <Phone className="w-3 h-3 text-primary" /> {ord.customerPhone}
                            </a>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-0.5 font-bold"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> WA
                            </a>
                          </div>
                        </td>

                        {/* Fulfillment & Delivery Location */}
                        <td className="py-4 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-200">
                            {ord.orderType === "PICKUP" ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-600 text-amber-300 text-[10px] font-black uppercase">
                                🥡 Kitchen Pickup
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-600 text-blue-300 text-[10px] font-black uppercase">
                                🛵 Delivery
                              </span>
                            )}
                          </div>
                          {ord.deliveryAddress ? (
                            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1" title={ord.deliveryAddress}>
                              {ord.deliveryAddress}
                            </p>
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic block mt-0.5">
                              Self-pickup from counter
                            </span>
                          )}
                        </td>

                        {/* Items Summary */}
                        <td className="py-4 px-4 max-w-xs">
                          <span className="text-zinc-200 font-semibold text-xs block truncate" title={itemsSummary}>
                            {itemsSummary || "No items"}
                          </span>
                          <span className="text-[11px] text-zinc-500 block mt-0.5">
                            {itemsCount} item{itemsCount !== 1 ? "s" : ""}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1 ${
                              isCancelled
                                ? "bg-rose-950/90 border-rose-600 text-rose-300 font-black shadow-sm"
                                : statusInfo.badgeClass
                            }`}
                          >
                            {isCancelled ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            <span>{statusInfo.label}</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 block mt-1 font-bold">
                            {ord.paymentMethod} • {ord.paymentStatus}
                          </span>
                        </td>

                        {/* Financial Amount */}
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-black text-white block">
                            {formatINR(ord.grandTotal)}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">
                            Food: {formatINR(ord.subtotal)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {/* Preview Modal Button */}
                            <button
                              onClick={() => setPreviewOrder(ord)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/40 text-primary text-xs font-bold transition-all min-h-[36px]"
                              title="Quick Full Details Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>

                            {/* View Invoice */}
                            <Link
                              href={`/invoice/${ord.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-raised border border-border text-zinc-300 hover:text-white hover:border-primary text-xs font-bold transition-all min-h-[36px]"
                              title="Print Invoice"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary" />
                            </Link>

                            {/* Details page */}
                            <Link
                              href={`/admin/orders/${ord.id}`}
                              className="p-2 rounded-xl bg-surface-raised border border-border text-zinc-400 hover:text-white hover:border-primary transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Order Lifecycle Page"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
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

        {/* 5. MOBILE VIEW: Responsive Order Cards List */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-surface border border-border space-y-3 animate-pulse">
                <div className="w-32 h-4 rounded bg-zinc-800" />
                <div className="w-full h-8 rounded-xl bg-zinc-800/40" />
                <div className="w-20 h-4 rounded bg-zinc-800" />
              </div>
            ))
          ) : paginatedOrders.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-border rounded-2xl text-zinc-500 text-xs">
              No orders found for the selected period and filters.
            </div>
          ) : (
            paginatedOrders.map((ord) => {
              const statusInfo = getStatusInfo(ord.orderStatus);
              const isCancelled = ord.orderStatus === "CANCELLED";

              const itemsSummary = [
                ...ord.items.map((i) => `${i.quantity}× ${i.productName}`),
                ...(ord.combos || []).map((c) => `${c.quantity}× ${c.comboNameSnapshot}`),
              ].join(", ");

              return (
                <div
                  key={ord.id}
                  className={`p-4 rounded-2xl border space-y-3 shadow-card ${
                    isCancelled
                      ? "bg-rose-950/20 border-rose-800/60"
                      : "bg-surface border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="font-black text-white text-base font-heading hover:text-primary block"
                      >
                        #{ord.orderNumber}
                      </Link>
                      <span className="text-xs text-zinc-400">
                        {ord.customerName} • +91 {ord.customerPhone}
                      </span>
                    </div>

                    <span className="text-base font-black text-primary">
                      {formatINR(ord.grandTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        isCancelled
                          ? "bg-rose-950 border-rose-600 text-rose-300"
                          : statusInfo.badgeClass
                      }`}
                    >
                      {statusInfo.label}
                    </span>

                    <span className="text-[11px] text-zinc-400">
                      {ord.orderType === "PICKUP" ? "🥡 Kitchen Pickup" : "🛵 Delivery"} • {ord.paymentMethod}
                    </span>
                  </div>

                  {ord.deliveryAddress && (
                    <div className="flex items-start gap-1.5 text-xs text-zinc-300 bg-surface-raised p-2 rounded-xl border border-border/60">
                      <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{ord.deliveryAddress}</span>
                    </div>
                  )}

                  <div className="text-xs text-zinc-400 bg-surface-raised p-2 rounded-xl border border-border/60">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">Items:</span>
                    <span className="text-white line-clamp-2">{itemsSummary || "No items"}</span>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500">
                      {formatDate(ord.createdAt)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewOrder(ord)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/40 text-primary text-xs font-bold hover:bg-primary/20 min-h-[38px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <Link
                        href={`/invoice/${ord.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-white text-xs font-bold hover:border-primary min-h-[38px]"
                      >
                        <Printer className="w-3.5 h-3.5 text-primary" />
                        <span>Invoice</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 6. Pagination Bar (150 per page) */}
        {filteredOrders.length > 0 && (
          <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400">
              Showing <span className="font-bold text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
              <span className="font-bold text-white">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}
              </span> of <span className="font-bold text-white">{filteredOrders.length}</span> orders (150 per page)
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-xl bg-surface-raised border border-border text-zinc-300 hover:text-white hover:border-primary disabled:opacity-40 disabled:hover:border-border text-xs font-bold flex items-center gap-1 min-h-[38px] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2;
                    })
                    .map((page, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && <span className="px-2 text-zinc-600 text-xs">...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[36px] h-9 rounded-xl text-xs font-bold transition-all ${
                              currentPage === page
                                ? "bg-primary text-black font-extrabold shadow-glow"
                                : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-xl bg-surface-raised border border-border text-zinc-300 hover:text-white hover:border-primary disabled:opacity-40 disabled:hover:border-border text-xs font-bold flex items-center gap-1 min-h-[38px] transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 7. COMPLETE ORDER DETAILS MODAL / POPUP */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-[#121212] border border-border rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-raised/60 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary flex-shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white font-heading">
                      Order #{previewOrder.orderNumber}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        getStatusInfo(previewOrder.orderStatus).badgeClass
                      }`}
                    >
                      {getStatusInfo(previewOrder.orderStatus).label}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    Placed on {formatDate(previewOrder.createdAt)} at {formatTimeOnly(previewOrder.createdAt)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setPreviewOrder(null)}
                className="p-2 rounded-xl bg-surface border border-border text-zinc-400 hover:text-white hover:border-rose-500 transition-colors"
                aria-label="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-zinc-300">
              {/* Customer & Fulfillment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-raised p-4 rounded-2xl border border-border/70">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Customer Details</span>
                  <span className="text-sm font-bold text-white block mt-0.5">{previewOrder.customerName}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <a href={`tel:${previewOrder.customerPhone}`} className="text-primary hover:underline font-semibold">
                      📞 {previewOrder.customerPhone}
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Fulfillment & Payment</span>
                  <span className="font-bold text-white block mt-0.5">
                    {previewOrder.orderType === "PICKUP" ? "🥡 Kitchen Takeaway / Pickup" : "🛵 Home Delivery"}
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    {previewOrder.paymentMethod} • <strong className="text-emerald-400">{previewOrder.paymentStatus}</strong>
                  </span>
                </div>

                {previewOrder.deliveryAddress && (
                  <div className="sm:col-span-2 pt-2 border-t border-border/50">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">Delivery Location</span>
                    <p className="text-zinc-200 mt-0.5 leading-relaxed">{previewOrder.deliveryAddress}</p>
                    {previewOrder.deliveryDistanceKm && (
                      <span className="text-[10px] text-primary font-semibold block mt-0.5">
                        Distance: {previewOrder.deliveryDistanceKm} KM
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Special Note */}
              {previewOrder.specialNote && previewOrder.specialNote.trim() && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-600/50 text-amber-300 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">📝 Customer Special Request</span>
                  <p className="font-medium text-white">{previewOrder.specialNote}</p>
                </div>
              )}

              {/* Internal Kitchen Note */}
              {previewOrder.internalKitchenNote && previewOrder.internalKitchenNote.trim() && (
                <div className="p-3 rounded-2xl bg-surface-raised border border-border text-zinc-400 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">🔒 Private Kitchen Note</span>
                  <p className="text-zinc-200">{previewOrder.internalKitchenNote}</p>
                </div>
              )}

              {/* Ordered Dishes Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Ordered Dishes & Combos ({previewOrder.items.length + (previewOrder.combos?.length || 0)})
                </span>

                <div className="rounded-2xl border border-border overflow-hidden bg-surface-raised">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/70 text-zinc-400 bg-surface/50 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {previewOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {item.productName}
                          </td>
                          <td className="py-2.5 px-3 text-center text-primary font-bold">
                            {item.quantity}×
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">
                            {formatINR(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-zinc-200">
                            {formatINR(item.totalPrice)}
                          </td>
                        </tr>
                      ))}

                      {previewOrder.combos?.map((combo) => (
                        <tr key={combo.id} className="bg-primary/5">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-primary flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> {combo.comboNameSnapshot}
                            </span>
                            {combo.items && combo.items.length > 0 && (
                              <span className="text-[10px] text-zinc-400 block mt-0.5">
                                ({combo.items.map((ci) => `${ci.quantitySnapshot}× ${ci.productNameSnapshot}`).join(", ")})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-primary font-bold">
                            {combo.quantity}×
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">
                            {formatINR(combo.priceSnapshot)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-primary">
                            {formatINR(combo.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-surface-raised p-4 rounded-2xl border border-border/80 space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Food Items Subtotal:</span>
                  <span className="font-bold text-white">{formatINR(previewOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Charge:</span>
                  <span className="font-bold text-white">
                    {previewOrder.deliveryCharge > 0 ? formatINR(previewOrder.deliveryCharge) : "FREE"}
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between text-sm font-black">
                  <span className="text-white">Grand Total (Zero GST):</span>
                  <span className="text-primary text-base font-heading">{formatINR(previewOrder.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-border bg-surface-raised/60 flex items-center justify-between gap-3">
              <Link
                href={`/admin/orders/${previewOrder.id}`}
                className="px-4 py-2 rounded-xl bg-surface border border-border hover:border-primary text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Full Order Management</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href={`/invoice/${previewOrder.id}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs flex items-center gap-1.5 shadow-glow uppercase tracking-wider transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Print Tax Invoice</span>
                </Link>
                <button
                  onClick={() => setPreviewOrder(null)}
                  className="px-4 py-2 rounded-xl bg-surface-raised hover:bg-surface border border-border text-zinc-300 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Download,
  Clock,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatINR, formatDate, formatTimeOnly } from "@/lib/utils";

type FilterPreset = "today" | "yesterday" | "last7days" | "thisMonth" | "lastMonth" | "custom" | "all";

export default function AdminInvoicesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter Presets
  const [datePreset, setDatePreset] = useState<FilterPreset>("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  // Pagination State (100 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100;

  // Reset page to 1 whenever any filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [datePreset, customStartDate, customEndDate, paymentMethodFilter, paymentStatusFilter, orderStatusFilter, search]);

  const loadInvoices = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await fetch("/api/orders?limit=500");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Filter logic based on date preset and custom range
  const filteredInvoices = useMemo(() => {
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

      // Date preset evaluation
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

      // Payment Method Filter
      if (paymentMethodFilter !== "ALL") {
        const method = (ord.paymentMethod || "").toUpperCase();
        if (paymentMethodFilter === "CASH" && method !== "COD" && method !== "CASH") return false;
        if (paymentMethodFilter === "UPI" && method !== "UPI") return false;
      }

      // Payment Status Filter
      if (paymentStatusFilter !== "ALL") {
        if (ord.paymentStatus !== paymentStatusFilter) return false;
      }

      // Order Status Filter
      if (orderStatusFilter !== "ALL") {
        if (ord.orderStatus !== orderStatusFilter) return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const invNum = (ord.invoice?.invoiceNumber || `INV-${ord.orderNumber}`).toLowerCase();
        const matchesNum = ord.orderNumber.toLowerCase().includes(q) || invNum.includes(q);
        const matchesName = (ord.customerName || "").toLowerCase().includes(q);
        const matchesPhone = (ord.customerPhone || "").includes(q);
        return matchesNum || matchesName || matchesPhone;
      }

      return true;
    });
  }, [
    orders,
    datePreset,
    customStartDate,
    customEndDate,
    paymentMethodFilter,
    paymentStatusFilter,
    orderStatusFilter,
    search,
  ]);

  // Aggregate Metrics for Selected Range
  const metrics = useMemo(() => {
    const validInvoices = filteredInvoices.filter((o) => o.orderStatus !== "CANCELLED");

    const totalRevenue = validInvoices.reduce((sum, o) => sum + o.grandTotal, 0);
    const foodSubtotal = validInvoices.reduce((sum, o) => sum + o.subtotal, 0);
    const deliveryCharges = validInvoices.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
    const count = filteredInvoices.length;
    const paidCount = validInvoices.filter((o) => o.paymentStatus === "PAID" || o.paymentStatus === "COMPLETED").length;
    const pendingCount = validInvoices.filter((o) => o.paymentStatus === "PENDING" || o.paymentStatus === "VERIFICATION_PENDING").length;
    const aov = validInvoices.length > 0 ? totalRevenue / validInvoices.length : 0;

    const cashRevenue = validInvoices
      .filter((o) => o.paymentMethod === "COD" || o.paymentMethod === "CASH")
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const upiRevenue = validInvoices
      .filter((o) => o.paymentMethod === "UPI")
      .reduce((sum, o) => sum + o.grandTotal, 0);

    return {
      totalRevenue,
      foodSubtotal,
      deliveryCharges,
      count,
      validCount: validInvoices.length,
      paidCount,
      pendingCount,
      aov,
      cashRevenue,
      upiRevenue,
    };
  }, [filteredInvoices]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage, ITEMS_PER_PAGE]);

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Tax-Free Invoices & Revenue Audit"
        subtitle="Filter by date ranges, compute revenue breakdowns (Food + Delivery), and print invoices."
        actionButton={
          <button
            onClick={() => loadInvoices(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-surface border border-border hover:border-primary text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[40px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Date Presets and Custom Filter Control */}
        <div className="p-5 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Presets Button Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Period:
              </span>

              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "last7days", label: "Last 7 Days" },
                { id: "thisMonth", label: "This Month" },
                { id: "lastMonth", label: "Last Month" },
                { id: "custom", label: "Custom Range" },
                { id: "all", label: "All Time" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDatePreset(tab.id as FilterPreset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                    datePreset === tab.id
                      ? "bg-primary text-black font-black shadow-glow"
                      : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice #, order, customer..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-raised border border-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[40px]"
              />
            </div>
          </div>

          {/* Custom Date Range Picker when Custom is chosen */}
          {datePreset === "custom" && (
            <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-4 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-bold uppercase">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-xl bg-surface-raised border border-border px-3 py-1.5 text-white focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-bold uppercase">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-xl bg-surface-raised border border-border px-3 py-1.5 text-white focus:border-primary"
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }}
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Reset Dates
                </button>
              )}
            </div>
          )}

          {/* Secondary Filters: Payment Method & Payment Status */}
          <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Method:</span>
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border">
                {["ALL", "CASH", "UPI"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethodFilter(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      paymentMethodFilter === m
                        ? "bg-primary text-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {m === "CASH" ? "Cash (COD)" : m}
                  </button>
                ))}
              </div>

              <span className="text-zinc-500 font-bold uppercase text-[10px] ml-2">Status:</span>
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border">
                {["ALL", "PAID", "PENDING"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setPaymentStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      paymentStatusFilter === st
                        ? "bg-white text-black font-extrabold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-zinc-400">
              Matching Invoices: <strong className="text-white">{filteredInvoices.length}</strong> of {orders.length}
            </div>
          </div>
        </div>

        {/* Selected Period Live Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Period Revenue
            </span>
            <span className="text-2xl sm:text-3xl font-black text-primary block">
              {formatINR(metrics.totalRevenue)}
            </span>
            <span className="text-[11px] text-zinc-400 block">
              Food: {formatINR(metrics.foodSubtotal)} • Delivery: {formatINR(metrics.deliveryCharges)}
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Invoices Count
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white block">
              {metrics.count} Orders
            </span>
            <span className="text-[11px] text-emerald-400 block">
              {metrics.paidCount} Paid • {metrics.pendingCount} Pending
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Average Order Value (AOV)
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">
              {formatINR(metrics.aov)}
            </span>
            <span className="text-[11px] text-zinc-400 block">Per valid invoice</span>
          </div>

          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Payment Split
            </span>
            <div className="text-sm font-extrabold text-white pt-1">
              <span className="text-amber-400">Cash: {formatINR(metrics.cashRevenue)}</span>
            </div>
            <div className="text-sm font-extrabold text-white">
              <span className="text-cyan-400">UPI: {formatINR(metrics.upiRevenue)}</span>
            </div>
          </div>
        </div>

        {/* 1. DESKTOP VIEW: Invoices Table */}
        <div className="hidden md:block rounded-3xl bg-surface border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-zinc-400 uppercase tracking-wider bg-surface-raised/60 text-[11px]">
                  <th className="py-4 px-6 font-bold">Invoice & Order #</th>
                  <th className="py-4 px-4 font-bold">Date & Time</th>
                  <th className="py-4 px-4 font-bold">Customer Contact</th>
                  <th className="py-4 px-4 font-bold">Food Subtotal</th>
                  <th className="py-4 px-4 font-bold">Delivery</th>
                  <th className="py-4 px-4 font-bold">Payment</th>
                  <th className="py-4 px-4 font-bold text-right">Grand Total</th>
                  <th className="py-4 px-6 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-zinc-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      Loading invoices...
                    </td>
                  </tr>
                ) : paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      No invoices found for the selected period and filters.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((ord) => {
                    const invNumber = ord.invoice?.invoiceNumber || `INV-${ord.orderNumber}`;
                    const isPaid = ord.paymentStatus === "PAID" || ord.paymentStatus === "COMPLETED";

                    return (
                      <tr key={ord.id} className="hover:bg-surface-raised/40 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-bold text-white text-sm block font-heading">
                            {invNumber}
                          </span>
                          <span className="text-zinc-500 text-[11px]">
                            Order #{ord.orderNumber} • {ord.orderType}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-zinc-300 text-xs">
                          <div>
                            <span className="font-semibold block">{formatDate(ord.createdAt)}</span>
                            <span className="text-zinc-500 text-[11px]">{formatTimeOnly(ord.createdAt)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-semibold text-white block">
                            {ord.customerName}
                          </span>
                          <span className="text-zinc-500 text-[11px]">
                            +91 {ord.customerPhone}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-zinc-300 font-medium">
                          {formatINR(ord.subtotal)}
                        </td>

                        <td className="py-4 px-4">
                          {ord.deliveryCharge > 0 ? (
                            <span className="font-semibold text-zinc-300">
                              {formatINR(ord.deliveryCharge)}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold text-[11px]">FREE</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              isPaid
                                ? "bg-emerald-950/70 border-emerald-700 text-emerald-400"
                                : "bg-amber-950/70 border-amber-700 text-amber-400"
                            }`}
                          >
                            {ord.paymentMethod} • {ord.paymentStatus}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-black text-white">
                            {formatINR(ord.grandTotal)}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/invoice/${ord.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-zinc-300 hover:text-white hover:border-primary text-xs font-bold transition-all min-h-[38px]"
                          >
                            <Printer className="w-3.5 h-3.5 text-primary" />
                            <span>Invoice</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. MOBILE VIEW: Invoices Card List */}
        <div className="md:hidden space-y-3">
          {paginatedInvoices.map((ord) => {
            const invNumber = ord.invoice?.invoiceNumber || `INV-${ord.orderNumber}`;
            const isPaid = ord.paymentStatus === "PAID" || ord.paymentStatus === "COMPLETED";

            return (
              <div
                key={ord.id}
                className="p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm block font-heading">{invNumber}</span>
                    <span className="text-xs text-zinc-400">
                      {ord.customerName} • +91 {ord.customerPhone}
                    </span>
                  </div>
                  <span className="text-base font-black text-primary">
                    {formatINR(ord.grandTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 bg-surface-raised p-2.5 rounded-xl border border-border/60">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Food:</span>
                    <span className="text-white font-bold">{formatINR(ord.subtotal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Delivery:</span>
                    <span className="text-white font-bold">
                      {ord.deliveryCharge > 0 ? formatINR(ord.deliveryCharge) : "FREE"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-zinc-400 block font-medium">
                      {formatDate(ord.createdAt)}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        isPaid
                          ? "bg-emerald-950/70 border border-emerald-700 text-emerald-400"
                          : "bg-amber-950/70 border border-amber-700 text-amber-400"
                      }`}
                    >
                      {ord.paymentMethod} • {ord.paymentStatus}
                    </span>
                  </div>

                  <Link
                    href={`/invoice/${ord.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-raised border border-border text-white text-xs font-bold hover:border-primary min-h-[40px]"
                  >
                    <Printer className="w-3.5 h-3.5 text-primary" />
                    <span>View / Print</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar (100 per page) */}
        {filteredInvoices.length > 0 && (
          <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400">
              Showing <span className="font-bold text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
              <span className="font-bold text-white">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)}
              </span> of <span className="font-bold text-white">{filteredInvoices.length}</span> invoices (100 per page)
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
    </div>
  );
}

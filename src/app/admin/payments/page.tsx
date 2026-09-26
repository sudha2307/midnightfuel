"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  QrCode,
  Banknote,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  AlertTriangle,
  Calendar,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatINR, formatDate, formatTimeOnly } from "@/lib/utils";

type DatePreset = "today" | "yesterday" | "last7days" | "thisMonth" | "lastMonth" | "custom" | "all";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100;

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [datePreset, customStartDate, customEndDate, methodFilter, statusFilter, searchQuery]);

  const fetchPayments = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await fetch("/api/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.error("Failed to fetch payments", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(() => fetchPayments(true), 12000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    setUpdatingId(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setPayments((prev) =>
          prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter payments with Date Presets, Custom Range, Method, Status and Search
  const filteredPayments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

    const last7DaysStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return payments.filter((p) => {
      // Exclude payments for cancelled orders
      if (p.order?.orderStatus === "CANCELLED") return false;

      const pDate = new Date(p.createdAt);

      // Date preset check
      if (datePreset === "today") {
        if (pDate < todayStart || pDate > todayEnd) return false;
      } else if (datePreset === "yesterday") {
        if (pDate < yesterdayStart || pDate > yesterdayEnd) return false;
      } else if (datePreset === "last7days") {
        if (pDate < last7DaysStart) return false;
      } else if (datePreset === "thisMonth") {
        if (pDate < thisMonthStart) return false;
      } else if (datePreset === "lastMonth") {
        if (pDate < lastMonthStart || pDate > lastMonthEnd) return false;
      } else if (datePreset === "custom") {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (pDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (pDate > end) return false;
        }
      }

      // Method Filter
      const matchesMethod =
        methodFilter === "ALL" ||
        (methodFilter === "CASH" && (p.method === "COD" || p.method === "CASH")) ||
        (methodFilter === "UPI" && p.method === "UPI");
      if (!matchesMethod) return false;

      // Status Filter
      const isPaid = p.status === "PAID" || p.status === "COMPLETED" || p.status === "SUCCESS";
      if (statusFilter === "PAID") {
        if (!isPaid) return false;
      } else if (statusFilter === "PENDING") {
        if (p.status !== "PENDING" && p.status !== "VERIFICATION_PENDING") return false;
      } else if (statusFilter !== "ALL") {
        if (p.status !== statusFilter) return false;
      }

      // Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesNum = p.order?.orderNumber?.toLowerCase().includes(q);
        const matchesName = p.order?.customerName?.toLowerCase().includes(q);
        const matchesPhone = p.order?.customerPhone?.includes(q);
        const matchesTx = p.transactionId?.toLowerCase().includes(q);
        return matchesNum || matchesName || matchesPhone || matchesTx;
      }

      return true;
    });
  }, [
    payments,
    datePreset,
    customStartDate,
    customEndDate,
    methodFilter,
    statusFilter,
    searchQuery,
  ]);

  // Aggregate Metrics for Selected Period
  const metrics = useMemo(() => {
    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    const paidPayments = filteredPayments.filter(
      (p) => p.status === "PAID" || p.status === "COMPLETED" || p.status === "SUCCESS"
    );
    const collectedAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = filteredPayments.filter(
      (p) => p.status === "PENDING" || p.status === "VERIFICATION_PENDING"
    );
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    const cashPayments = filteredPayments.filter((p) => p.method === "COD" || p.method === "CASH");
    const cashTotal = cashPayments.reduce((sum, p) => sum + p.amount, 0);

    const upiPayments = filteredPayments.filter((p) => p.method === "UPI");
    const upiTotal = upiPayments.reduce((sum, p) => sum + p.amount, 0);

    const verificationPendingCount = filteredPayments.filter((p) => p.status === "VERIFICATION_PENDING").length;

    return {
      totalAmount,
      collectedAmount,
      pendingAmount,
      totalCount: filteredPayments.length,
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
      verificationPendingCount,
      cashTotal,
      cashCount: cashPayments.length,
      upiTotal,
      upiCount: upiPayments.length,
    };
  }, [filteredPayments]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage, ITEMS_PER_PAGE]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "SUCCESS":
      case "COMPLETED":
        return "bg-emerald-950/70 border-emerald-700 text-emerald-400";
      case "VERIFICATION_PENDING":
        return "bg-cyan-950/70 border-cyan-700 text-cyan-300 animate-pulse";
      case "PENDING":
        return "bg-amber-950/70 border-amber-700 text-amber-400";
      case "FAILED":
        return "bg-rose-950/70 border-rose-700 text-rose-400";
      case "REFUNDED":
        return "bg-purple-950/70 border-purple-700 text-purple-400";
      default:
        return "bg-surface-raised border-border text-zinc-400";
    }
  };

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Payments Hub & Settlement Audit"
        subtitle="Track Cash on Delivery collections, UPI verification requests, and date-range settlement totals."
        actionButton={
          <button
            onClick={() => fetchPayments(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-surface border border-border hover:border-primary text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[40px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Date Presets and Custom Filter Control */}
        <div className="p-5 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Presets Button Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Range:
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
                  onClick={() => setDatePreset(tab.id as DatePreset)}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, customer, phone, TX ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[42px]"
              />
            </div>
          </div>

          {/* Custom Date Range Picker */}
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

          {/* Method and Status Filters */}
          <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Method Filter */}
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Method:</span>
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border">
                <button
                  onClick={() => setMethodFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    methodFilter === "ALL" ? "bg-primary text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  All Methods
                </button>
                <button
                  onClick={() => setMethodFilter("CASH")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    methodFilter === "CASH" ? "bg-primary text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Banknote className="w-3 h-3" /> Cash (COD)
                </button>
                <button
                  onClick={() => setMethodFilter("UPI")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    methodFilter === "UPI" ? "bg-primary text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-3 h-3" /> UPI
                </button>
              </div>

              {/* Status Filter */}
              <span className="text-zinc-500 font-bold uppercase text-[10px] ml-2">Status:</span>
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "ALL" ? "bg-white text-black font-extrabold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setStatusFilter("PAID")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "PAID" ? "bg-emerald-500 text-black font-extrabold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Settled (PAID)
                </button>
                <button
                  onClick={() => setStatusFilter("VERIFICATION_PENDING")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "VERIFICATION_PENDING"
                      ? "bg-cyan-500 text-black font-extrabold"
                      : "text-cyan-400 hover:text-white"
                  }`}
                >
                  Review Needed
                </button>
                <button
                  onClick={() => setStatusFilter("PENDING")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "PENDING"
                      ? "bg-amber-500 text-black font-extrabold"
                      : "text-amber-400 hover:text-white"
                  }`}
                >
                  Pending COD
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400">
              Showing <strong className="text-white">{filteredPayments.length}</strong> of {payments.length} transactions
            </div>
          </div>
        </div>

        {/* Selected Period Payment Aggregate KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Total Period Volume
            </span>
            <span className="text-2xl sm:text-3xl font-black text-primary block">
              {formatINR(metrics.totalAmount)}
            </span>
            <span className="text-[11px] text-zinc-400 block">
              {metrics.totalCount} Orders in period
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Settled & Collected
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">
              {formatINR(metrics.collectedAmount)}
            </span>
            <span className="text-[11px] text-emerald-400/90 block">
              {metrics.paidCount} Transactions settled
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Pending Collections
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 block">
              {formatINR(metrics.pendingAmount)}
            </span>
            <span className="text-[11px] text-amber-400/90 block">
              {metrics.pendingCount} Awaiting settlement
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Method Split
            </span>
            <div className="text-xs font-bold text-amber-400 pt-1 flex justify-between">
              <span>Cash (COD):</span>
              <span>{formatINR(metrics.cashTotal)} ({metrics.cashCount})</span>
            </div>
            <div className="text-xs font-bold text-cyan-400 flex justify-between">
              <span>UPI Payments:</span>
              <span>{formatINR(metrics.upiTotal)} ({metrics.upiCount})</span>
            </div>
          </div>
        </div>

        {/* 1. DESKTOP VIEW: Payments Table */}
        <div className="hidden md:block rounded-3xl bg-surface border border-border overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised/80 border-b border-border/80 text-zinc-400 uppercase text-[11px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Method</th>
                  <th className="py-4 px-4">Payment Status</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-zinc-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      Loading payment records...
                    </td>
                  </tr>
                ) : paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      No payments match the selected range and filters.
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((p) => {
                    const isPaid =
                      p.status === "PAID" || p.status === "COMPLETED" || p.status === "SUCCESS";
                    const isUpdating = updatingId === p.id;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-surface-raised/40 transition-colors group"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-white">
                          <Link
                            href={`/admin/orders/${p.order?.id}`}
                            className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>#{p.order?.orderNumber || "---"}</span>
                          </Link>
                        </td>

                        <td className="py-4 px-4">
                          <div>
                            <span className="font-bold text-white block">
                              {p.order?.customerName || "Walk-in Customer"}
                            </span>
                            <span className="text-zinc-500 text-[11px]">
                              +91 {p.order?.customerPhone || "N/A"}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-black text-white text-sm">
                          {formatINR(p.amount)}
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold flex items-center gap-1.5">
                            {p.method === "UPI" ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <QrCode className="w-3.5 h-3.5" /> UPI
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Banknote className="w-3.5 h-3.5" /> Cash (COD)
                              </span>
                            )}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusBadge(
                              p.status
                            )}`}
                          >
                            {p.status.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-zinc-400 text-[11px]">
                          <div>
                            <span className="font-semibold text-white block">{formatDate(p.createdAt)}</span>
                            <span className="text-zinc-500 block">
                              {formatTimeOnly(p.createdAt)}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          {!isPaid && (
                            <button
                              onClick={() => handleUpdateStatus(p.id, "PAID")}
                              disabled={isUpdating}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] uppercase tracking-wider shadow-glow transition-all min-h-[38px]"
                            >
                              MARK PAID
                            </button>
                          )}

                          {p.status === "VERIFICATION_PENDING" && (
                            <button
                              onClick={() => handleUpdateStatus(p.id, "FAILED")}
                              disabled={isUpdating}
                              className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-[11px] uppercase tracking-wider transition-all min-h-[38px]"
                            >
                              REJECT
                            </button>
                          )}

                          <Link
                            href={`/invoice/${p.order?.id}`}
                            target="_blank"
                            className="p-2 rounded-xl bg-surface-raised hover:bg-surface border border-border text-zinc-400 hover:text-white inline-block align-middle min-h-[38px] min-w-[38px]"
                            title="Print Tax Invoice"
                          >
                            <FileText className="w-4 h-4" />
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

        {/* 2. MOBILE VIEW: Responsive Payment Cards */}
        <div className="md:hidden space-y-3">
          {paginatedPayments.map((p) => {
            const isUpdating = updatingId === p.id;
            const isPaid =
              p.status === "PAID" || p.status === "COMPLETED" || p.status === "SUCCESS";

            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-surface border border-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/admin/orders/${p.order?.id}`}
                      className="text-sm font-extrabold text-white hover:text-primary block font-heading"
                    >
                      #{p.order?.orderNumber}
                    </Link>
                    <span className="text-xs text-zinc-400">{p.order?.customerName} • +91 {p.order?.customerPhone}</span>
                  </div>
                  <span className="text-base font-black text-primary">
                    {formatINR(p.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-bold flex items-center gap-1">
                    {p.method === "UPI" ? (
                      <span className="text-emerald-400 flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /> UPI</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> Cash</span>
                    )}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(
                      p.status
                    )}`}
                  >
                    {p.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-400">
                    {formatDate(p.createdAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isPaid && (
                      <button
                        onClick={() => handleUpdateStatus(p.id, "PAID")}
                        disabled={isUpdating}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase shadow-glow min-h-[40px]"
                      >
                        MARK PAID
                      </button>
                    )}

                    <Link
                      href={`/invoice/${p.order?.id}`}
                      target="_blank"
                      className="p-2.5 rounded-xl bg-surface-raised border border-border text-zinc-400 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar (100 per page) */}
        {filteredPayments.length > 0 && (
          <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400">
              Showing <span className="font-bold text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
              <span className="font-bold text-white">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)}
              </span> of <span className="font-bold text-white">{filteredPayments.length}</span> payment records (100 per page)
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

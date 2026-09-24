"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Phone,
  MessageCircle,
  X,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatINR, formatDate, getStatusInfo } from "@/lib/utils";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Pagination State (100 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100;

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchCustomers();
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(customers.length / ITEMS_PER_PAGE));
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Customer Management"
        subtitle="Manage customer contact records, WhatsApp channels, lifetime spends and order histories."
      />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer name or phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[42px]"
            />
          </div>

          <span className="text-xs text-zinc-400 self-start sm:self-auto">
            Total Customers: <strong className="text-white">{customers.length}</strong>
          </span>
        </div>

        {/* 1. DESKTOP VIEW: Table (hidden on mobile) */}
        <div className="hidden md:block rounded-3xl bg-surface border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-zinc-400 uppercase tracking-wider bg-surface-raised/50">
                  <th className="py-4 px-6 font-bold">Customer Name</th>
                  <th className="py-4 px-4 font-bold">Mobile</th>
                  <th className="py-4 px-4 font-bold">WhatsApp</th>
                  <th className="py-4 px-4 font-bold text-center">Total Orders</th>
                  <th className="py-4 px-4 font-bold text-right">Total Spent</th>
                  <th className="py-4 px-4 font-bold">Last Order</th>
                  <th className="py-4 px-6 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-raised/40 transition-colors">
                    {/* Customer Name */}
                    <td className="py-4 px-6">
                      <span className="font-bold text-white text-sm block">{c.name}</span>
                    </td>

                    {/* Mobile */}
                    <td className="py-4 px-4">
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1.5 text-zinc-300 hover:text-primary font-medium"
                      >
                        <Phone className="w-3.5 h-3.5 text-primary" /> +91 {c.phone}
                      </a>
                    </td>

                    {/* WhatsApp */}
                    <td className="py-4 px-4">
                      {c.whatsapp ? (
                        <a
                          href={`https://wa.me/91${c.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 text-xs font-semibold transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> +91 {c.whatsapp}
                        </a>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>

                    {/* Total Orders */}
                    <td className="py-4 px-4 text-center font-bold text-white text-sm">
                      {c.totalOrders}
                    </td>

                    {/* Total Spent */}
                    <td className="py-4 px-4 text-right font-black text-primary text-sm">
                      {formatINR(c.totalSpent)}
                    </td>

                    {/* Last Order */}
                    <td className="py-4 px-4 text-zinc-400 text-[11px]">
                      {c.lastOrderDate ? (
                        <>
                          <span className="text-white font-semibold block">
                            #{c.lastOrderNumber}
                          </span>
                          <span>{formatDate(c.lastOrderDate)}</span>
                        </>
                      ) : (
                        "No orders yet"
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3.5 py-1.5 rounded-xl bg-surface-raised hover:bg-surface border border-border hover:border-primary text-xs font-bold text-primary transition-colors"
                      >
                        Order History ({c.totalOrders})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. MOBILE VIEW: Customer Cards */}
        <div className="md:hidden space-y-3">
          {paginatedCustomers.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-surface border border-border space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-white text-sm block">{c.name}</span>
                  <span className="text-xs text-zinc-400">
                    Lifetime Spent: <strong className="text-primary">{formatINR(c.totalSpent)}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCustomer(c)}
                  className="px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-xs font-bold text-primary"
                >
                  History ({c.totalOrders})
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${c.phone}`}
                  className="py-2 px-3 rounded-xl bg-surface-raised border border-border text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" /> +91 {c.phone}
                </a>

                {c.whatsapp ? (
                  <a
                    href={`https://wa.me/91${c.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[40px]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                ) : (
                  <div className="py-2 px-3 text-center text-xs text-zinc-500">No WhatsApp</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Bar (100 per page) */}
        {customers.length > 0 && (
          <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400">
              Showing <span className="font-bold text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
              <span className="font-bold text-white">
                {Math.min(currentPage * ITEMS_PER_PAGE, customers.length)}
              </span> of <span className="font-bold text-white">{customers.length}</span> customer accounts (100 per page)
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

      {/* Customer Profile & Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#141414] border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                  {selectedCustomer.name}'s Profile
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                  Mobile: +91 {selectedCustomer.phone} • Lifetime Spent: {formatINR(selectedCustomer.totalSpent)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-zinc-400 hover:text-white p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Order History ({selectedCustomer.orders.length})
              </h4>

              {selectedCustomer.orders.map((ord: any) => {
                const statusInfo = getStatusInfo(ord.orderStatus);
                return (
                  <div
                    key={ord.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-border/80 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="font-bold text-white hover:text-primary"
                        >
                          #{ord.orderNumber}
                        </Link>
                        <span className="text-zinc-500">
                          • {formatDate(ord.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <p className="text-zinc-300">
                      {ord.items.map((i: any) => `${i.quantity}× ${i.productName}`).join(", ")}
                    </p>

                    <div className="flex justify-between items-center pt-2 border-t border-border/40">
                      <span className="font-extrabold text-primary text-sm">
                        {formatINR(ord.grandTotal)}
                      </span>
                      <Link
                        href={`/invoice/${ord.id}`}
                        target="_blank"
                        className="text-primary hover:underline font-semibold"
                      >
                        View Invoice →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

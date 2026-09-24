"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  RotateCcw,
  FileText,
  Truck,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  LogOut,
  User,
  Phone,
  MessageCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import { OrderType } from "@/types";
import { formatINR, formatDate, getStatusInfo } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { normalizePhoneNumber } from "@/lib/phone";

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { addItem, addCombo } = useCart();

  // Customer Session State
  const [customer, setCustomer] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Login Modal State
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Reorder status toast
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // 1. Check Customer Auth Session on Mount
  const checkSession = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/customer/me");
      const data = await res.json();

      if (res.ok && data.authenticated) {
        setCustomer(data.customer);
        setIsAuthenticated(true);
        loadOrders();
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // 2. Load Orders for Authenticated Customer
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // 3. Direct Sign-in with Mobile Number (Instant login without OTP popup)
  const handleDirectSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const clean = normalizePhoneNumber(loginPhone);
    if (clean.length !== 10) {
      setLoginError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean, name: loginName }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.customer) {
        setCustomer(data.customer);
        setIsAuthenticated(true);
        loadOrders();
      } else {
        setLoginError(data.error || "Failed to sign in. Please try again.");
      }
    } catch (e) {
      setLoginError("Network error. Please check your connection.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  /*
  // OTP Verification commented out for frictionless direct login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    ...
  };
  */

  // 5. Handle logout
  const handlelogout = async () => {
    try {
      await fetch("/api/auth/customer/logout", { method: "POST" });
      setCustomer(null);
      setIsAuthenticated(false);
      setOrders([]);
    } catch (e) {
      console.error(e);
    }
  };

  // 6. Handle Reorder with CURRENT Menu Prices & Availability Check
  const handleReorder = async (order: OrderType) => {
    setIsReordering(true);
    setReorderMessage(null);

    try {
      // Fetch fresh menu and combos to get current live prices and availability
      const [menuRes, comboRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/combos"),
      ]);
      const menuData = await menuRes.json();
      const comboData = await comboRes.json();

      const availableProducts = menuData.products || [];
      const availableCombos = comboData.combos || [];

      let addedCount = 0;
      let unavailableCount = 0;

      // 1. Process regular items
      if (order.items && order.items.length > 0) {
        for (const orderItem of order.items) {
          const matchedProduct = availableProducts.find(
            (p: any) =>
              p.id === orderItem.productId ||
              p.name.toLowerCase().trim() === orderItem.productName.toLowerCase().trim()
          );

          if (matchedProduct && matchedProduct.isAvailable && !matchedProduct.isDeleted) {
            addItem(matchedProduct, orderItem.quantity);
            addedCount++;
          } else {
            unavailableCount++;
          }
        }
      }

      // 2. Process combo items
      if (order.combos && order.combos.length > 0) {
        for (const orderCombo of order.combos) {
          const matchedCombo = availableCombos.find(
            (c: any) =>
              c.id === orderCombo.comboId ||
              c.name.toLowerCase().trim() === orderCombo.comboNameSnapshot?.toLowerCase().trim()
          );

          if (matchedCombo && matchedCombo.isActive) {
            // Check if items within combo are available
            const anyItemUnavailable = matchedCombo.items?.some(
              (it: any) => it.product && (!it.product.isAvailable || it.product.isDeleted)
            );

            if (!anyItemUnavailable) {
              addCombo(matchedCombo, orderCombo.quantity);
              addedCount++;
            } else {
              unavailableCount++;
            }
          } else {
            unavailableCount++;
          }
        }
      }

      if (unavailableCount > 0) {
        setReorderMessage(
          `Added ${addedCount} item(s)/combo(s) to cart. Note: ${unavailableCount} item(s) are currently sold out.`
        );
      } else {
        router.push("/cart");
      }
    } catch (e) {
      console.error("Reorder failed", e);
      setReorderMessage("Unable to reorder. Please add items directly from the menu.");
    } finally {
      setIsReordering(false);
    }
  };

  // Filter and sort logic
  const filteredOrders = orders
    .filter((order) => {
      // Status filter
      if (statusFilter === "ACTIVE") {
        return (
          order.orderStatus === "NEW" ||
          order.orderStatus === "CONFIRMED" ||
          order.orderStatus === "PREPARING" ||
          order.orderStatus === "READY" ||
          order.orderStatus === "OUT_FOR_DELIVERY"
        );
      }
      if (statusFilter === "COMPLETED") {
        return order.orderStatus === "DELIVERED";
      }
      if (statusFilter === "CANCELLED") {
        return order.orderStatus === "CANCELLED";
      }
      return true;
    })
    .filter((order) => {
      // Search query by order number or item name
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  const activeOrders = orders.filter(
    (o) =>
      o.orderStatus === "NEW" ||
      o.orderStatus === "CONFIRMED" ||
      o.orderStatus === "PREPARING" ||
      o.orderStatus === "READY" ||
      o.orderStatus === "OUT_FOR_DELIVERY"
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">
            Customer Dashboard
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
            MY ORDERS & HISTORY
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            Track live kitchen status, view tax-free invoices, and reorder your midnight feast in one click.
          </p>
        </div>

        {/* Reorder Notification */}
        {reorderMessage && (
          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{reorderMessage}</span>
            </div>
            <Link
              href="/cart"
              className="px-3.5 py-1.5 bg-primary text-black font-extrabold text-xs rounded-xl shadow-glow whitespace-nowrap"
            >
              Go to Cart →
            </Link>
          </div>
        )}

        {/* If Not Authenticated: Phone Verification Card */}
        {!isAuthenticated && !isLoading ? (
          <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mx-auto mb-3 shadow-glow">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white font-heading">
                Identify Your Account
              </h3>
              <p className="text-xs text-zinc-400">
                Enter your WhatsApp/mobile number to view your orders and invoices securely.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Direct Sign-In Form without OTP Popup */}
            <form onSubmit={handleDirectSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">
                  Your Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="w-full rounded-xl bg-surface-raised border border-border px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">
                  WhatsApp / Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="98765 43210"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider shadow-glow transition-all min-h-[48px] flex items-center justify-center gap-2"
              >
                {isLoggingIn ? "Signing In..." : "SIGN IN & ACCESS ORDERS →"}
              </button>
            </form>

            {/* 
            OTP Verification popup is commented out:
            {isOtpSent && (
              <form onSubmit={handleVerifyOtp} ...>
                ...
              </form>
            )}
            */}
          </div>
        ) : (
          /* Authenticated Customer Experience */
          <div className="space-y-6">
            {/* Customer Profile Banner */}
            {customer && (
              <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-lg font-heading shadow-glow">
                    {customer.name ? customer.name.charAt(0).toUpperCase() : "C"}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white font-heading">
                      {customer.name}
                    </h2>
                    <span className="text-xs text-zinc-400 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-primary" /> +91 {customer.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Lifetime Orders
                    </span>
                    <span className="text-base font-black text-white">
                      {orders.length} Orders
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Total Spent
                    </span>
                    <span className="text-base font-black text-primary">
                      {formatINR(orders.reduce((sum, o) => sum + o.grandTotal, 0))}
                    </span>
                  </div>

                  <Link
                    href="/menu"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>New Order</span>
                  </Link>

                  <button
                    onClick={handlelogout}
                    className="p-2 rounded-xl bg-surface-raised border border-border text-zinc-400 hover:text-rose-400 hover:border-rose-800 transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Active Orders Highlight Strip */}
            {activeOrders.length > 0 && (
              <div className="p-4 sm:p-5 rounded-3xl bg-primary/10 border border-primary/30 space-y-3 shadow-glow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Clock className="w-4 h-4 animate-spin" /> Live Active Order in Kitchen
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-black font-extrabold text-[10px] uppercase">
                    {activeOrders.length} Active
                  </span>
                </div>

                <div className="space-y-2">
                  {activeOrders.map((active) => {
                    const statusInfo = getStatusInfo(active.orderStatus);
                    return (
                      <div
                        key={active.id}
                        className="p-3.5 rounded-2xl bg-surface border border-border flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-extrabold text-white block">
                            Order #{active.orderNumber}
                          </span>
                          <span className="text-zinc-400 text-[11px]">
                            {active.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.label}
                          </span>
                          <Link
                            href={`/track-order/${active.id}`}
                            className="px-3 py-1.5 rounded-xl bg-primary text-black font-extrabold text-xs uppercase shadow-glow"
                          >
                            Track →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
                {[
                  { key: "ALL", label: "All Orders" },
                  { key: "ACTIVE", label: "Active" },
                  { key: "COMPLETED", label: "Completed" },
                  { key: "CANCELLED", label: "Cancelled" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] whitespace-nowrap ${
                      statusFilter === tab.key
                        ? "bg-primary text-black shadow-glow"
                        : "bg-surface-raised text-zinc-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search by Order # */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order #..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-raised border border-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary min-h-[38px]"
                />
              </div>
            </div>

            {/* Orders List */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-36 rounded-3xl bg-surface border border-border animate-pulse"
                  />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-surface/40 border border-border rounded-3xl p-8 max-w-md mx-auto space-y-4">
                <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white font-heading">
                  No Orders Found
                </h3>
                <p className="text-xs text-zinc-400">
                  {statusFilter !== "ALL"
                    ? `No orders matching status "${statusFilter}".`
                    : "You haven't placed any late-night orders yet."}
                </p>
                <Link
                  href="/menu"
                  className="inline-block px-6 py-2.5 rounded-xl bg-primary text-black font-extrabold text-xs uppercase tracking-wider shadow-glow"
                >
                  EXPLORE MENU & ORDER
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.orderStatus);
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="p-5 sm:p-6 rounded-3xl bg-surface border border-border hover:border-primary/40 transition-all shadow-card space-y-4"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-white font-heading">
                              #{order.orderNumber}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusInfo.badgeClass}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-400 block mt-0.5">
                            {formatDate(order.createdAt)} • {order.orderType}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-zinc-500 block">Grand Total</span>
                          <span className="text-lg font-black text-primary">
                            {formatINR(order.grandTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Items Summary */}
                      <div className="space-y-1.5 text-xs text-zinc-300">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span>
                              <strong className="text-primary mr-1.5">{item.quantity}×</strong>
                              {item.productName}
                            </span>
                            <span className="font-semibold text-white">
                              {formatINR(item.totalPrice)}
                            </span>
                          </div>
                        ))}

                        {order.combos?.map((combo) => (
                          <div key={combo.id} className="flex justify-between items-center">
                            <span>
                              <strong className="text-primary mr-1.5">{combo.quantity}×</strong>
                              {combo.comboNameSnapshot}
                            </span>
                            <span className="font-semibold text-white">
                              {formatINR(combo.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Expandable Order Details Drawer */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-border/50 space-y-3 text-xs text-zinc-300 animate-in fade-in">
                          {/* Financial Breakdown */}
                          <div className="p-3.5 rounded-2xl bg-surface-raised border border-border/70 space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Food Subtotal:</span>
                              <span className="font-semibold text-white">{formatINR(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Delivery Charge:</span>
                              <span className="font-semibold text-white">
                                {order.deliveryCharge > 0 ? formatINR(order.deliveryCharge) : "FREE"}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-border/50 font-bold text-white">
                              <span>Grand Total (ZERO GST):</span>
                              <span className="text-primary font-black">{formatINR(order.grandTotal)}</span>
                            </div>
                          </div>

                          {/* Address & Notes */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-surface-raised border border-border/70">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                                Delivery Destination
                              </span>
                              <p className="text-zinc-300 leading-relaxed text-[11px]">
                                {order.deliveryAddress || "Pickup at Kitchen"}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-surface-raised border border-border/70">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                                Special Request Note
                              </span>
                              <p className="text-zinc-300 italic text-[11px]">
                                {order.specialNote ? `"${order.specialNote}"` : "No special requests."}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Payment: <strong className="text-white">{order.paymentMethod}</strong> ({order.paymentStatus})</span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons Row */}
                      <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="text-xs text-zinc-400 hover:text-white font-semibold flex items-center gap-1 self-start"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" /> Less Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" /> View Order Breakdown
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1-Click Reorder Button */}
                          <button
                            onClick={() => handleReorder(order)}
                            disabled={isReordering}
                            className="px-3.5 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors min-h-[38px]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> REORDER
                          </button>

                          {/* Track Order */}
                          <Link
                            href={`/track-order/${order.id}`}
                            className="px-3.5 py-2 rounded-xl bg-surface-raised hover:bg-surface border border-border text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors hover:border-primary/50 min-h-[38px]"
                          >
                            <Truck className="w-3.5 h-3.5 text-primary" /> Track
                          </Link>

                          {/* View Invoice */}
                          <Link
                            href={`/invoice/${order.id}`}
                            target="_blank"
                            className="px-3.5 py-2 rounded-xl bg-surface-raised hover:bg-surface border border-border text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors min-h-[38px]"
                          >
                            <FileText className="w-3.5 h-3.5" /> Invoice
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

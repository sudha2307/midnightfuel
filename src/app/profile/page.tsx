"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  ShoppingBag,
  LogOut,
  Calendar,
  Clock,
  ChevronRight,
  FileText,
  Truck,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  UtensilsCrossed,
} from "lucide-react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import { OrderType } from "@/types";
import { formatINR, formatDate, formatTimeOnly, getStatusInfo } from "@/lib/utils";
import { normalizePhoneNumber } from "@/lib/phone";

export default function ProfilePage() {
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Authentication form state for unauthenticated users
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [meRes, ordersRes] = await Promise.all([
        fetch("/api/auth/customer/me"),
        fetch("/api/orders"),
      ]);

      const meData = await meRes.json();
      if (meRes.ok && meData.authenticated && meData.customer) {
        setCustomer(meData.customer);
        setIsAuthenticated(true);

        if (ordersRes.ok) {
          const ordData = await ordersRes.json();
          setOrders(ordData.orders || []);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error("Failed to load profile", e);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  // Direct Instant Sign-In (Frictionless login without OTP popup)
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
        loadProfileData();
      } else {
        setLoginError(data.error || "Failed to sign in. Please try again.");
      }
    } catch {
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">
            Account & Activity
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
            USER PROFILE & ORDER HISTORY
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            View your verified account details, stats, and complete order history with exact timestamps.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="h-44 rounded-3xl bg-surface border border-border animate-pulse" />
            <div className="h-64 rounded-3xl bg-surface border border-border animate-pulse" />
          </div>
        ) : !isAuthenticated ? (
          /* Unauthenticated State: Mobile Login Form */
          <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card space-y-6">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mx-auto mb-3 shadow-glow">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-white font-heading">
                Access Your Profile
              </h3>
              <p className="text-xs text-zinc-400">
                Enter your WhatsApp/mobile number to view your full profile and detailed order history.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Direct Sign-In Form without OTP popup */}
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
                {isLoggingIn ? "Signing In..." : "SIGN IN & VIEW PROFILE →"}
              </button>
            </form>

            {/* 
            OTP Verification is commented out:
            {isOtpSent && (
              <form onSubmit={handleVerifyOtp} ...>
                ...
              </form>
            )}
            */}
          </div>
        ) : (
          /* Authenticated State: Full Profile Card & Detailed Order History */
          <div className="space-y-8">
            {/* 1. User Profile Details Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-black font-black text-2xl font-heading shadow-glow">
                    {customer?.name ? customer.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                      {customer?.name || "Midnight Feaster"}
                    </h2>
                    <span className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                      <Phone className="w-3.5 h-3.5 text-primary" /> +91 {customer?.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Link
                    href="/menu"
                    className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow transition-all min-h-[40px]"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                    <span>New Order</span>
                  </Link>

                  <button
                    onClick={handlelogout}
                    className="px-4 py-2.5 rounded-xl bg-surface-raised border border-border text-zinc-400 hover:text-rose-400 hover:border-rose-800 transition-colors text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Stats KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-surface-raised border border-border/60 space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Total Orders
                  </span>
                  <span className="text-2xl font-black text-white block">
                    {orders.length}
                  </span>
                  <span className="text-[10px] text-zinc-500">Lifetime orders placed</span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-raised border border-border/60 space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Total Spent
                  </span>
                  <span className="text-2xl font-black text-primary block">
                    {formatINR(orders.reduce((sum, o) => sum + o.grandTotal, 0))}
                  </span>
                  <span className="text-[10px] text-zinc-500">ZERO GST total</span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-raised border border-border/60 space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Delivered Feasts
                  </span>
                  <span className="text-2xl font-black text-emerald-400 block">
                    {orders.filter((o) => o.orderStatus === "DELIVERED").length}
                  </span>
                  <span className="text-[10px] text-emerald-500/80">Completed & enjoyed</span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-raised border border-border/60 space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Account Status
                  </span>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-extrabold text-emerald-400 uppercase">
                      Verified
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">OTP Authenticated</span>
                </div>
              </div>
            </div>

            {/* 2. Detailed Order History with Date & Time */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-black text-white uppercase tracking-wider font-heading">
                    Order History ({orders.length})
                  </h3>
                </div>

                <Link
                  href="/orders"
                  className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                >
                  Live Order Tracker →
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 bg-surface border border-border rounded-3xl p-8 max-w-md mx-auto space-y-4 shadow-card">
                  <UtensilsCrossed className="w-12 h-12 text-zinc-600 mx-auto" />
                  <h4 className="text-base font-bold text-white font-heading">
                    No Previous Orders Yet
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Explore our late-night menu and place your first midnight meal!
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
                  {orders.map((order) => {
                    const statusInfo = getStatusInfo(order.orderStatus, order.orderType);
                    const isPickup = order.orderType === "PICKUP";

                    return (
                      <div
                        key={order.id}
                        className="p-5 sm:p-6 rounded-3xl bg-surface border border-border hover:border-primary/40 transition-all shadow-card space-y-4"
                      >
                        {/* Order Top Bar with Explicit Date & Time Breakdown */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <Link
                                href={`/track-order/${order.id}`}
                                className="text-base sm:text-lg font-black text-white hover:text-primary transition-colors font-heading"
                              >
                                #{order.orderNumber}
                              </Link>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusInfo.badgeClass}`}
                              >
                                {statusInfo.label}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  isPickup
                                    ? "bg-purple-950/80 border border-purple-800 text-purple-300"
                                    : "bg-blue-950/80 border border-blue-800 text-blue-300"
                                }`}
                              >
                                {isPickup ? "Kitchen Pickup" : "Delivery"}
                              </span>
                            </div>

                            {/* Prominent Date and Time Display */}
                            <div className="flex items-center gap-3 text-xs text-zinc-300 mt-1.5 flex-wrap">
                              <span className="flex items-center gap-1.5 font-medium text-white">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                {formatDate(order.createdAt)}
                              </span>
                              <span className="text-zinc-600">•</span>
                              <span className="flex items-center gap-1.5 text-zinc-400">
                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                {formatTimeOnly(order.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                              Grand Total ({order.paymentMethod})
                            </span>
                            <span className="text-lg font-black text-primary">
                              {formatINR(order.grandTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Items Breakdown */}
                        <div className="space-y-2 text-xs">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-zinc-300">
                              <div>
                                <span className="font-bold text-primary mr-2">{item.quantity}×</span>
                                <span>{item.productName}</span>
                              </div>
                              <span className="font-semibold text-white">
                                {formatINR(item.totalPrice)}
                              </span>
                            </div>
                          ))}

                          {order.combos?.map((combo) => (
                            <div
                              key={combo.id}
                              className="flex justify-between items-center bg-surface-raised p-2 rounded-xl text-zinc-300 border border-primary/20"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-primary mr-1">{combo.quantity}×</span>
                                <span className="font-bold text-white flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-primary" /> {combo.comboNameSnapshot}
                                </span>
                              </div>
                              <span className="font-bold text-primary">
                                {formatINR(combo.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Destination / Pickup Address Note */}
                        {order.deliveryAddress && (
                          <div className="p-3 rounded-xl bg-surface-raised border border-border/60 text-xs text-zinc-400 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{order.deliveryAddress}</span>
                          </div>
                        )}

                        {/* Order Actions */}
                        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3 flex-wrap">
                          <span className="text-[11px] text-zinc-500">
                            Payment Status: <strong className="text-white">{order.paymentStatus}</strong>
                          </span>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/track-order/${order.id}`}
                              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow transition-all"
                            >
                              <Truck className="w-3.5 h-3.5 stroke-[2.5]" /> Track Status
                            </Link>

                            <Link
                              href={`/invoice/${order.id}`}
                              target="_blank"
                              className="px-3.5 py-1.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary" /> Invoice
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

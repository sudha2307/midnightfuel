"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Volume2,
  VolumeX,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Package,
  Truck,
  ArrowRight,
  RefreshCw,
  FileText,
  Search,
  Flame,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { OrderType } from "@/types";
import { formatINR, formatDate, formatTimeOnly, getStatusInfo } from "@/lib/utils";
import { getWhatsAppDirectLink, generateWhatsAppMessageText } from "@/services/whatsappService";

export default function AdminLiveOrdersPage() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Store known order IDs to detect new incoming orders
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Audio Player for New Order Notification (Swiggy / Zomato style loud alarm tone)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload the alarm audio
    if (typeof window !== "undefined") {
      const audio = new Audio("/mixkit-alarm-tone-996.wav");
      audio.preload = "auto";
      audioRef.current = audio;
    }
  }, []);

  const playNewOrderChime = () => {
    if (!soundEnabled) return;
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Audio autoplay policy blocked audio. User interaction required:", err);
            // Fallback to Web Audio synth chime if file playback is restricted
            playSynthChimeFallback();
          });
        }
      } else {
        const audio = new Audio("/mixkit-alarm-tone-996.wav");
        audio.play().catch(playSynthChimeFallback);
      }
    } catch (e) {
      playSynthChimeFallback();
    }
  };

  const playSynthChimeFallback = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (err) {
      console.warn("Synth fallback unavailable", err);
    }
  };

  const fetchOrders = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        const incomingOrders: OrderType[] = data.orders || [];

        // Check if there are brand new orders
        if (!isInitialLoadRef.current) {
          const newOrdersFound = incomingOrders.some(
            (o) => o.orderStatus === "NEW" && !knownOrderIdsRef.current.has(o.id)
          );
          if (newOrdersFound) {
            playNewOrderChime();
          }
        }

        // Update known IDs
        incomingOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
        isInitialLoadRef.current = false;
        setOrders(incomingOrders);
      }
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 6000); // 6s fast polling
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus, paymentStatus: data.order?.paymentStatus || o.paymentStatus } : o))
        );
      }
    } catch (e) {
      console.error("Failed to update status", e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders by tab and search
  const filteredOrders = orders.filter((o) => {
    // Tab filter
    if (activeTab === "ACTIVE") {
      if (!["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.orderStatus)) {
        return false;
      }
    } else if (activeTab !== "ALL" && o.orderStatus !== activeTab) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesNum = o.orderNumber.toLowerCase().includes(q);
      const matchesName = o.customerName.toLowerCase().includes(q);
      const matchesPhone = o.customerPhone.includes(q);
      const matchesItems = o.items.some((i) => i.productName.toLowerCase().includes(q));
      const matchesCombos = (o.combos || []).some((c) => c.comboNameSnapshot.toLowerCase().includes(q));
      return matchesNum || matchesName || matchesPhone || matchesItems || matchesCombos;
    }

    return true;
  });

  const activeOrdersCount = orders.filter((o) =>
    ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.orderStatus)
  ).length;
  const newOrdersCount = orders.filter((o) => o.orderStatus === "NEW").length;
  const preparingCount = orders.filter((o) => o.orderStatus === "PREPARING").length;
  const outDeliveryCount = orders.filter((o) => o.orderStatus === "OUT_FOR_DELIVERY").length;

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Live Order Management"
        subtitle="Kitchen dispatch board with instant audio alerts and status transitions."
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-surface border-border text-zinc-500"
              }`}
              title={soundEnabled ? "Order sound alerts enabled" : "Sound muted"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? "Sound On" : "Muted"}</span>
            </button>

            <button
              onClick={() => fetchOrders(true)}
              disabled={isRefreshing}
              className="p-2 px-3 rounded-xl bg-surface border border-border hover:border-primary text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-primary ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Search and Quick Filters Bar */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by #order, name, phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-raised border border-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "ACTIVE"
                  ? "bg-primary text-black shadow-glow font-black"
                  : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>ACTIVE ({activeOrdersCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("NEW")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "NEW"
                  ? "bg-amber-500 text-black shadow-glow font-black"
                  : "bg-surface-raised border border-amber-900/60 text-amber-400 hover:bg-amber-950/40"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>NEW ({newOrdersCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("PREPARING")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "PREPARING"
                  ? "bg-orange-500 text-black shadow-glow font-black"
                  : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>PREPARING ({preparingCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("OUT_FOR_DELIVERY")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "OUT_FOR_DELIVERY"
                  ? "bg-blue-500 text-black shadow-glow font-black"
                  : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>OUT ({outDeliveryCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("DELIVERED")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "DELIVERED"
                  ? "bg-emerald-500 text-black shadow-glow font-black"
                  : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
              }`}
            >
              COMPLETED
            </button>

            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-white text-black font-black"
                  : "bg-surface-raised border border-border text-zinc-400 hover:text-white"
              }`}
            >
              ALL ({orders.length})
            </button>
          </div>
        </div>

        {/* Live Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-border rounded-3xl p-8 max-w-md mx-auto space-y-3">
            <Package className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Orders in this View</h3>
            <p className="text-xs text-zinc-400">
              Customer orders placed on the website appear here automatically in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.orderStatus);
              const isUpdating = updatingId === order.id;

              const itemsSummary = [
                ...order.items.map((i) => `${i.quantity}× ${i.productName}`),
                ...(order.combos || []).map((c) => `${c.quantity}× ${c.comboNameSnapshot}`),
              ].join(", ");

              const whatsappText = generateWhatsAppMessageText({
                to: order.customerWhatsapp,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                status: order.orderStatus,
                grandTotal: order.grandTotal,
                itemsSummary,
                specialNote: order.specialNote || undefined,
              });

              const waLink = getWhatsAppDirectLink(
                order.customerWhatsapp,
                whatsappText
              );

              return (
                <div
                  key={order.id}
                  className={`rounded-3xl bg-surface border flex flex-col justify-between overflow-hidden shadow-card transition-all ${
                    order.orderStatus === "NEW"
                      ? "border-amber-500/80 shadow-glow ring-2 ring-amber-500/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-border/70 bg-surface-raised/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-lg font-black text-white hover:text-primary transition-colors font-heading"
                        >
                          #{order.orderNumber}
                        </Link>
                        <span className="text-xs text-zinc-400">
                          {formatTimeOnly(order.createdAt)}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Customer Info Row */}
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {order.customerName}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="flex items-center gap-1 hover:text-primary text-zinc-300"
                        >
                          <Phone className="w-3 h-3 text-primary" /> {order.customerPhone}
                        </a>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-emerald-400 text-emerald-400 font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Special Request Badge */}
                    {order.specialNote && order.specialNote.trim() && (
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-600 text-amber-300 text-[11px] font-bold shadow-glow hover:bg-amber-900/80 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>📝 Special Request</span>
                      </Link>
                    )}
                  </div>

                  {/* Card Body: Address & Items */}
                  <div className="p-5 space-y-4 flex-1">
                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                      <div className="flex items-start gap-2 text-xs text-zinc-300 bg-surface-raised p-2.5 rounded-xl border border-border/60">
                        <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2 leading-relaxed">
                          {order.deliveryAddress}
                        </span>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="space-y-2 text-xs">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                        Ordered Items ({order.items.length + (order.combos?.length || 0)})
                      </span>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-primary mr-1.5">
                              {item.quantity}×
                            </span>
                            <span className="text-white font-medium">
                              {item.productName}
                            </span>
                          </div>
                          <span className="font-semibold text-zinc-300">
                            {formatINR(item.totalPrice)}
                          </span>
                        </div>
                      ))}

                      {/* Combos */}
                      {order.combos?.map((combo) => (
                        <div
                          key={combo.id}
                          className="flex items-center justify-between bg-surface-raised p-1.5 rounded-lg border border-primary/20"
                        >
                          <div>
                            <span className="font-bold text-primary mr-1.5">
                              {combo.quantity}×
                            </span>
                            <span className="text-white font-bold inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-primary" /> {combo.comboNameSnapshot}
                            </span>
                          </div>
                          <span className="font-bold text-primary">
                            {formatINR(combo.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: Financial Total & Action Pipeline Buttons */}
                  <div className="p-4 border-t border-border/70 bg-surface-raised/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                          {order.paymentMethod} • {order.paymentStatus}
                        </span>
                        <span className="text-lg font-black text-white">
                          {formatINR(order.grandTotal)}
                        </span>
                      </div>

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                      >
                        Details →
                      </Link>
                    </div>

                    {/* Interactive 1-Click Status Progression Pipeline */}
                    <div className="pt-1">
                      {order.orderStatus === "NEW" && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                            disabled={isUpdating}
                            className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-glow transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" /> ACCEPT
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                            disabled={isUpdating}
                            className="py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all"
                          >
                            <XCircle className="w-4 h-4" /> REJECT
                          </button>
                        </div>
                      )}

                      {order.orderStatus === "CONFIRMED" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                          disabled={isUpdating}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-primary to-orange-600 hover:from-primary-hover hover:to-orange-500 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow transition-all"
                        >
                          <ChefHat className="w-4 h-4 stroke-[2.5]" /> START PREPARING
                        </button>
                      )}

                      {order.orderStatus === "PREPARING" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "READY")}
                          disabled={isUpdating}
                          className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow transition-all"
                        >
                          <Package className="w-4 h-4 stroke-[2.5]" />
                          {order.orderType === "PICKUP" ? "READY FOR PICKUP (NOTIFY)" : "FOOD READY & PACKED"}
                        </button>
                      )}

                      {order.orderStatus === "READY" && (
                        order.orderType === "PICKUP" ? (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                            disabled={isUpdating}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> MARK AS COLLECTED / HANDED OVER
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")}
                            disabled={isUpdating}
                            className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow transition-all"
                          >
                            <Truck className="w-4 h-4 stroke-[2.5]" /> DISPATCH / OUT FOR DELIVERY
                          </button>
                        )
                      )}

                      {order.orderStatus === "OUT_FOR_DELIVERY" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                          disabled={isUpdating}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> MARK AS DELIVERED
                        </button>
                      )}

                      {order.orderStatus === "DELIVERED" && (
                        <div className="py-2 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> {order.orderType === "PICKUP" ? "Collected by Customer" : "Order Delivered"}
                        </div>
                      )}

                      {order.orderStatus === "CANCELLED" && (
                        <div className="py-2 text-center text-xs font-bold text-rose-400 flex items-center justify-center gap-1.5">
                          <XCircle className="w-4 h-4" /> Order Cancelled
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

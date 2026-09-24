"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChefHat,
  Package,
  Truck,
  MessageCircle,
  FileText,
  AlertCircle,
  RefreshCw,
  Sparkles,
  MessageSquare,
  MapPin,
  Clock,
  Store,
  Navigation,
  ShoppingBag,
} from "lucide-react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import { OrderType } from "@/types";
import { formatINR, formatDate, getStatusInfo } from "@/lib/utils";
import { useStore } from "@/context/StoreContext";

// Home Delivery 6-step timeline
const deliverySteps = [
  { key: "NEW", label: "Order Placed", desc: "We received your order", icon: CheckCircle2 },
  { key: "CONFIRMED", label: "Order Confirmed", desc: "Kitchen accepted order", icon: CheckCircle2 },
  { key: "PREPARING", label: "Preparing Your Food", desc: "Chefs are cooking fresh", icon: ChefHat },
  { key: "READY", label: "Packed & Ready", desc: "Food boxed in thermal packaging", icon: Package },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Rider on the way to you", icon: Truck },
  { key: "DELIVERED", label: "Delivered", desc: "Enjoy your midnight fuel!", icon: CheckCircle2 },
];

// Kitchen Pickup 5-step customized timeline
const pickupSteps = [
  { key: "NEW", label: "Order Received", desc: "Kitchen received your pickup request", icon: CheckCircle2 },
  { key: "CONFIRMED", label: "Order Accepted", desc: "Kitchen verified pickup slot", icon: CheckCircle2 },
  { key: "PREPARING", label: "Preparing Food", desc: "Fresh preparation on grill/tandoor", icon: ChefHat },
  { key: "READY", label: "Ready for Pickup", desc: "Parcel packed & waiting at kitchen counter", icon: Store },
  { key: "DELIVERED", label: "Parcel Collected", desc: "Picked up & collected by customer", icon: CheckCircle2 },
];

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { settings } = useStore();
  const [order, setOrder] = useState<OrderType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const kitchenAddress = settings?.address || "123 Food Street, Late Night Hub, Tirunelveli - 627001";
  const kitchenPhone = settings?.phone || "+91 79042 04664";

  const fetchOrder = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          setErrorMessage("Order not found or tracking link invalid.");
          return;
        }
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          setErrorMessage(null);
        }
      } catch {
        setErrorMessage("Failed to fetch live tracking updates.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(() => {
      fetchOrder();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Loading live tracking details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-20 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-extrabold text-white">Order Not Found</h2>
          <p className="text-xs text-zinc-400">{errorMessage || "Invalid order identifier."}</p>
          <Link
            href="/orders"
            className="inline-block px-6 py-2.5 rounded-xl bg-primary text-black font-bold text-xs uppercase shadow-glow"
          >
            Find My Orders
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isPickup = order.orderType === "PICKUP";
  const currentStatusInfo = getStatusInfo(order.orderStatus, order.orderType);
  const isCancelled = order.orderStatus === "CANCELLED";

  const timelineSteps = isPickup ? pickupSteps : deliverySteps;

  // Calculate active step index based on order type
  let currentStepIndex = 0;
  if (order.orderStatus === "NEW") currentStepIndex = 0;
  else if (order.orderStatus === "CONFIRMED") currentStepIndex = 1;
  else if (order.orderStatus === "PREPARING") currentStepIndex = 2;
  else if (order.orderStatus === "READY" || (isPickup && order.orderStatus === "OUT_FOR_DELIVERY")) currentStepIndex = 3;
  else if (order.orderStatus === "OUT_FOR_DELIVERY" && !isPickup) currentStepIndex = 4;
  else if (order.orderStatus === "DELIVERED") currentStepIndex = isPickup ? 4 : 5;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Tracking Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">
                ORDER #{order.orderNumber}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${currentStatusInfo.badgeClass}`}
              >
                {currentStatusInfo.label}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isPickup
                    ? "bg-purple-950/80 border border-purple-600 text-purple-300"
                    : "bg-blue-950/80 border border-blue-600 text-blue-300"
                }`}
              >
                {isPickup ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                {isPickup ? "SELF PICKUP FROM KITCHEN" : "HOME DELIVERY"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">
              Placed on {formatDate(order.createdAt)} • {isPickup ? "Kitchen Self-Pickup (Free Delivery)" : "Doorstep Delivery"}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/menu"
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-glow transition-all"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>New Order</span>
            </Link>

            <button
              onClick={() => fetchOrder(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-surface border border-border hover:border-primary text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 text-primary ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span>Refresh Status</span>
            </button>

            <Link
              href={`/invoice/${order.id}`}
              className="px-4 py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-white text-xs font-bold flex items-center gap-2 transition-colors hover:border-primary/50"
            >
              <FileText className="w-4 h-4 text-primary" /> View Invoice
            </Link>
          </div>
        </div>

        {/* Pickup Action Announcement Banner (When Order is Ready at Kitchen) */}
        {isPickup && order.orderStatus === "READY" && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-surface to-purple-950/40 border-2 border-purple-500 shadow-glow mb-8 space-y-3">
            <div className="flex items-center gap-2 text-purple-300">
              <Store className="w-6 h-6 text-purple-400 animate-bounce" />
              <h2 className="text-lg font-black uppercase tracking-wider font-heading">
                YOUR PARCEL IS PACKED & READY AT THE KITCHEN!
              </h2>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed">
              Please visit our kitchen counter to collect your fresh order. Quote your <strong>Order #{order.orderNumber}</strong> or registered mobile <strong>+91 {order.customerPhone}</strong> at the counter.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white bg-black/50 px-3.5 py-2 rounded-xl border border-purple-500/40">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{kitchenAddress}</span>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(kitchenAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-primary text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow hover:scale-105 transition-all"
              >
                <Navigation className="w-3.5 h-3.5 fill-black" /> Get Directions
              </a>
            </div>
          </div>
        )}

        {/* Live Timeline Tracker */}
        {!isCancelled ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border/80 shadow-card mb-8">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-8">
              {isPickup ? "Kitchen Pickup Progress" : "Live Delivery Progress"}
            </h2>

            <div className="relative">
              <div
                className={`grid grid-cols-1 ${
                  isPickup ? "sm:grid-cols-5" : "sm:grid-cols-6"
                } gap-6 relative`}
              >
                {timelineSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.key}
                      className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-3 relative"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all z-10 ${
                          isCurrent
                            ? "bg-primary text-black ring-4 ring-primary/30 shadow-glow scale-110"
                            : isCompleted
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-surface-raised text-zinc-600 border border-border"
                        }`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 sm:flex-none">
                        <span
                          className={`block text-xs font-bold uppercase tracking-wider ${
                            isCurrent
                              ? "text-primary"
                              : isCompleted
                              ? "text-white"
                              : "text-zinc-600"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[11px] text-zinc-500 block mt-0.5">
                          {step.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm mb-8">
            <h3 className="font-bold text-lg mb-1">Order Cancelled</h3>
            <p className="text-xs text-zinc-400">
              This order has been marked as cancelled. For questions, please reach us on WhatsApp.
            </p>
          </div>
        )}

        {/* Order Details & Delivery/Pickup Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Items & Combos Summary */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-3">
              Ordered Items
            </h3>
            <div className="space-y-3">
              {/* Products */}
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-primary mr-2">
                      {item.quantity}×
                    </span>
                    <span className="text-white font-medium">
                      {item.productName}
                    </span>
                  </div>
                  <span className="font-semibold text-white">
                    {formatINR(item.totalPrice)}
                  </span>
                </div>
              ))}

              {/* Combos */}
              {order.combos?.map((combo) => (
                <div
                  key={combo.id}
                  className="flex items-center justify-between text-xs bg-surface-raised p-2.5 rounded-xl border border-primary/20"
                >
                  <div>
                    <span className="font-bold text-primary mr-2">
                      {combo.quantity}×
                    </span>
                    <span className="text-white font-bold inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" /> {combo.comboNameSnapshot}
                    </span>
                    {combo.servingPeopleSnapshot && (
                      <span className="text-[10px] text-zinc-400 block ml-6">
                        {combo.servingPeopleSnapshot}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-primary">
                    {formatINR(combo.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border/60 space-y-1.5 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Food Subtotal:</span>
                <span className="text-white font-medium">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <span>Delivery Charge:</span>
                  {order.deliveryDistanceKm && (
                    <span className="text-[10px] text-emerald-400 ml-1">({order.deliveryDistanceKm} KM)</span>
                  )}
                </div>
                <span className="text-white font-medium">
                  {isPickup || order.deliveryCharge === 0 ? "FREE (PICKUP)" : formatINR(order.deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-border/80">
                <span>Total:</span>
                <span className="text-primary">{formatINR(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Fulfillment Information */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-3 flex items-center justify-between">
              <span>{isPickup ? "Kitchen Pickup Information" : "Delivery Information"}</span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                isPickup ? "bg-purple-950 text-purple-300 border border-purple-800" : "bg-blue-950 text-blue-300 border border-blue-800"
              }`}>
                {order.orderType}
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block">Customer Name</span>
                <span className="text-white font-bold text-sm">
                  {order.customerName}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block">Contact Mobile & WhatsApp</span>
                <span className="text-white font-medium">
                  +91 {order.customerPhone}
                </span>
              </div>

              {isPickup ? (
                /* Kitchen Pickup Location Box */
                <div className="p-3.5 rounded-xl bg-surface-raised border border-border/80 space-y-2">
                  <span className="text-primary font-bold flex items-center gap-1.5 uppercase text-[11px]">
                    <Store className="w-3.5 h-3.5" /> Pickup Counter Location:
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-medium">
                    {kitchenAddress}
                  </p>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Collect your parcel once status reaches <strong>"Ready for Pickup"</strong>.
                  </p>
                </div>
              ) : (
                /* Home Delivery Address */
                order.deliveryAddress && (
                  <div>
                    <span className="text-zinc-400 block">Delivery Address</span>
                    <span className="text-white leading-relaxed">
                      {order.deliveryAddress}
                    </span>
                  </div>
                )
              )}

              {!isPickup && order.deliveryDistanceKm && (
                <div>
                  <span className="text-zinc-400 block">Calculated Distance</span>
                  <span className="text-emerald-400 font-bold">
                    {order.deliveryDistanceKm} KM
                  </span>
                </div>
              )}

              {/* Special Note / Request */}
              {order.specialNote && (
                <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-1">
                  <span className="text-primary font-bold block flex items-center gap-1.5 text-[11px] uppercase">
                    <MessageSquare className="w-3.5 h-3.5" /> Special Request:
                  </span>
                  <span className="text-zinc-200 italic">
                    "{order.specialNote}"
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-border/60">
                <a
                  href={`https://wa.me/917904204664?text=Hi%2C%20I%20have%20a%20question%20about%20my%20${isPickup ? "pickup%20" : "delivery%20"}order%20%23${order.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Message Kitchen on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  FileText,
  Truck,
  MessageCircle,
} from "lucide-react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const orderNumber = searchParams.get("orderNumber") || "MF10001";

  const targetId = orderId || orderNumber;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-8">
      {/* Celebration Icon */}
      <div className="relative inline-block">
        <div className="w-24 h-24 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-glow">
          <CheckCircle2 className="w-12 h-12 stroke-[2]" />
        </div>
      </div>

      <div>
        <span className="px-3.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-black text-xs uppercase tracking-widest inline-block mb-3">
          Order #{orderNumber} Confirmed!
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          YOUR FEAST IS ON THE WAY!
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-md mx-auto">
          Our cloud kitchen has received your order and our chefs are firing up the grill right now.
        </p>
      </div>

      {/* Info Card */}
      <div className="p-6 rounded-3xl bg-surface border border-border/80 text-left space-y-4 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">Estimated Delivery</span>
              <span className="text-base font-bold text-white">30–40 Minutes</span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold">
            Kitchen Fired Up 🔥
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Track Live Order */}
          <Link
            href={`/track-order/${targetId}`}
            className="p-4 rounded-2xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow transition-all"
          >
            <Truck className="w-4 h-4 stroke-[2.5]" /> Track Live Order
          </Link>

          {/* View / Print Invoice */}
          <Link
            href={`/invoice/${targetId}`}
            className="p-4 rounded-2xl bg-surface-raised hover:bg-surface border border-border text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:border-primary/50"
          >
            <FileText className="w-4 h-4 text-primary" /> View Invoice
          </Link>

          {/* WhatsApp Updates */}
          <a
            href={`https://wa.me/917904204664?text=Hi%2C%20I%20placed%20order%20%23${orderNumber}%20at%20Midnight%20Fuel.%20Please%20send%20me%20updates.`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Us
          </a>
        </div>
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          ← Return to Midnight Fuel Home
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <Suspense fallback={<div className="text-center py-20 text-zinc-400">Loading order confirmation...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

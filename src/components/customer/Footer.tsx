"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Flame,
  Clock,
  Phone,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatTime12Hour } from "@/lib/business-hours";

export default function Footer() {
  const { settings, status } = useStore();
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          const activeCategories = (data.categories || [])
            .filter((c: any) => c.isActive !== false)
            .slice(0, 5);
          setCategories(activeCategories);
        }
      } catch (e) {
        console.error("Failed to load footer categories", e);
      }
    }
    fetchCategories();
  }, []);

  const businessName = settings?.businessName || "Midnight Fuel";
  const tagline = settings?.tagline || "EAT • ENJOY • RECHARGE";
  const phone = settings?.phone || "+91 79042 04664";
  const rawPhone = phone.replace(/[^0-9]/g, "");
  const whatsapp = settings?.whatsapp || "+91 79042 04664";
  const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, "");
  const address = settings?.address || "123 Food Street, Late Night Hub, Tirunelveli - 627001";
  const openTimeDisplay = formatTime12Hour(settings?.openingTime || "19:00");
  const closeTimeDisplay = formatTime12Hour(settings?.closingTime || "02:00");

  return (
    <footer className="border-t border-border/80 bg-[#050505] text-zinc-400 mt-20 no-print">
      {/* Top Value Strip */}
      <div className="border-b border-border/60 bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {openTimeDisplay} – {closeTimeDisplay}
              </h4>
              <p className="text-xs text-zinc-400">Exclusive late-night kitchen</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Fresh & Piping Hot
              </h4>
              <p className="text-xs text-zinc-400">Prepared fresh to order</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-accent-cyan flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Distance Delivery
              </h4>
              <p className="text-xs text-zinc-400">Fast delivery to your doorstep</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-accent-green flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Hygiene & Quality
              </h4>
              <p className="text-xs text-zinc-400">100% Halal & clean ingredients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="inline-block" aria-label={businessName}>
            <div className="relative h-32 w-52 sm:h-32 sm:w-52 flex-shrink-0">
              <Image
                src="/images/logo2.png"
                alt={businessName}
                fill
                className="object-contain object-left"
              />
            </div>
          </Link>
          <p className="text-sm text-zinc-400 leading-relaxed pr-6">
            Fueling your late-night hunger with authentic Arabic Mandhi, crispy fried chicken, cheesy burgers, and aromatic gravies right when you need it most.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href={`https://wa.me/${cleanWhatsapp || "919876543210"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Support
            </a>
            <Link
              href="/#daily-combos"
              className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 text-xs font-semibold transition-colors"
            >
              Daily Combos →
            </Link>
          </div>
        </div>

        {/* Dynamic Top 5 Categories */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Menu Categories
          </h4>
          <ul className="space-y-2 text-sm">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/menu?category=${cat.slug || cat.id}`}
                    className="hover:text-primary transition-colors block"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li>
                  <Link href="/menu" className="hover:text-primary transition-colors">
                    View Full Menu →
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Customer Hub
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/#daily-combos" className="hover:text-primary transition-colors">
                Daily Midnight Combos
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-primary transition-colors">
                Track Live Order
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-primary transition-colors">
                Order History & Re-Order
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-primary transition-colors">
                Cloud Kitchen Location
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-primary transition-colors text-zinc-500">
                Kitchen Admin Login
              </Link>
            </li>
          </ul>
        </div>

        {/* Kitchen Info */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Kitchen Info
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>
                {openTimeDisplay} – {closeTimeDisplay}
                <br />
                <span className="text-xs text-zinc-500">Open 7 Days a Week</span>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
              <a href={`tel:${phone}`} className="hover:text-primary">
                {phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <a
                href={`https://wa.me/${cleanWhatsapp || "919876543210"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 text-emerald-400"
              >
                WhatsApp: {whatsapp}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-border/60 py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <p className="text-zinc-400 font-medium">
              Designed & Developed by{" "}
              <a
                href="https://www.aurix360.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline hover:text-white transition-colors cursor-pointer"
              >
                Aurix360
              </a>
            </p>
          </div>
          <div className="flex items-center justify-center sm:justify-end">
            <span className="text-primary font-semibold tracking-wide bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[11px]">
              ⚡ FSSAI Certified: 12423019000123
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}


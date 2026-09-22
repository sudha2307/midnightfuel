"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Flame,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Sparkles,
  Tag,
  CreditCard,
  Layers,
  Users,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ExternalLink,
  X,
  Truck,
  History,
} from "lucide-react";
import { useAdminNav } from "@/context/AdminNavContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileOpen, closeMobileNav } = useAdminNav();

  const handlelogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      closeMobileNav();
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Live Orders", href: "/admin/orders", icon: ShoppingBag, highlight: true },
    { name: "Order History", href: "/admin/orders/history", icon: History },
    { name: "Daily Combos", href: "/admin/combos", icon: Sparkles },
    { name: "Menu Management", href: "/admin/menu", icon: UtensilsCrossed },
    { name: "Price Management", href: "/admin/prices", icon: Tag },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Categories", href: "/admin/categories", icon: Layers },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Reports & Analytics", href: "/admin/reports", icon: BarChart3 },
    { name: "Invoices Hub", href: "/admin/invoices", icon: FileText },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full bg-[#0c0c0c] border-r border-border/80">
      {/* Brand Header */}
      <div>
        <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between">
          <Link href="/admin" onClick={closeMobileNav} className="flex items-center" aria-label="Admin Control Hub">
            <div className="relative h-16 w-24 sm:h-14 sm:w-24 flex-shrink-0">
              <Image
                src="/images/logo2.png"
                alt="Midnight Fuel Admin"
                fill
                className="object-cover object-left"
              />
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={closeMobileNav}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white bg-surface-raised border border-border"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : item.href === "/admin/orders"
                ? pathname === "/admin/orders"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                  isActive
                    ? "bg-primary text-black shadow-glow font-extrabold"
                    : item.highlight
                    ? "text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20"
                    : "text-zinc-400 hover:text-white hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-border/70 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-surface-raised transition-colors min-h-[40px]"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-primary" />
            <span>Customer Website</span>
          </div>
          <span className="text-[10px] text-zinc-600">Open ↗</span>
        </Link>

        <button
          onClick={handlelogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors min-h-[40px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 no-print flex-shrink-0 z-30">
        <SidebarContent />
      </aside>

      {/* 2. Mobile / Tablet Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={closeMobileNav}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

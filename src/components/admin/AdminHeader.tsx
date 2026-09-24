"use client";

import React, { useState, useEffect } from "react";
import { Clock, Menu, Flame } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAdminNav } from "@/context/AdminNavContext";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export default function AdminHeader({
  title,
  subtitle,
  actionButton,
}: AdminHeaderProps) {
  const { status } = useStore();
  const { toggleMobileNav } = useAdminNav();
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border/80 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMobileNav}
            className="lg:hidden p-2 rounded-xl text-zinc-300 hover:text-white bg-surface-raised border border-border flex items-center justify-center min-h-[42px] min-w-[42px]"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight font-heading leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end">
          {/* Real-time Clock */}
          <div className="px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-xs font-mono text-zinc-300 hidden md:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{timeStr || "Loading..."}</span>
          </div>

          {/* Operating status badge */}
          <div
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 ${
              status.isOpen
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-glow"
                : "bg-amber-950/60 border-amber-500/50 text-amber-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status.isOpen ? "bg-emerald-400 animate-ping" : "bg-amber-400"
              }`}
            />
            <span>{status.badgeText}</span>
          </div>

          {/* Optional Action Button */}
          {actionButton && <div>{actionButton}</div>}
        </div>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Moon, Clock, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function StoreClosedBanner() {
  const { status } = useStore();

  if (status.isOpen) return null;

  return (
    <section className="w-full bg-gradient-to-r from-amber-950/40 via-[#14120f] to-amber-950/40 border-y border-amber-500/30 py-8 px-4 sm:px-6 my-6 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-glow">
            <Moon className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-950 border border-amber-700/60 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              <span>{status.subText}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              MIDNIGHT FUEL IS RESTING
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-lg">
              We're currently closed, but we'll be back at 7:00 PM. Feel free to explore our delicious midnight menu!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 rounded-xl bg-surface border border-border">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">
              Next Opening
            </span>
            <span className="text-sm font-black text-primary">7:00 PM</span>
          </div>

          <Link
            href="/menu"
            className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow transition-all whitespace-nowrap"
          >
            <span>View Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

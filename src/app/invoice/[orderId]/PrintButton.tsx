"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-glow transition-all"
    >
      <Printer className="w-4 h-4 stroke-[2.5]" /> Print / PDF
    </button>
  );
}

import React from "react";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto shadow-glow">
            <UtensilsCrossed className="w-10 h-10" />
          </div>

          <div>
            <span className="text-5xl font-black text-primary font-heading block">
              404
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              Midnight Route Not Found
            </h1>
            <p className="text-xs text-zinc-400 mt-2">
              The page you're looking for doesn't exist or has moved. Let's get you back to the feast.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-surface-raised border border-border text-white text-xs font-bold uppercase"
            >
              Go Home
            </Link>
            <Link
              href="/menu"
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider shadow-glow"
            >
              Explore Menu
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

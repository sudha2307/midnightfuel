"use client";

import React, { useState } from "react";
import {
  Clock,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import { useStore } from "@/context/StoreContext";
import { formatTime12Hour } from "@/lib/business-hours";

export default function ContactPage() {
  const { settings, status } = useStore();
  const [submitted, setSubmitted] = useState(false);

  const businessName = settings?.businessName || "Midnight Fuel";
  const phone = settings?.phone || "+91 90801 39363";
  const whatsapp = settings?.whatsapp || "+91 90801 39363";
  const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, "");
  const address = settings?.address || "123 Food Street, Late Night Hub, Tirunelveli - 627001";
  const openTimeDisplay = formatTime12Hour(settings?.openingTime || "19:00");
  const closeTimeDisplay = formatTime12Hour(settings?.closingTime || "02:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading uppercase">
            CONTACT {businessName}
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Have a question about late-night delivery or bulk orders? Message us on WhatsApp or call our kitchen directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Cards */}
          <div className="lg:col-span-6 space-y-6">
            {/* Operating Hours Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-primary/30 shadow-glow space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white font-heading">
                    OPERATING HOURS
                  </h3>
                  <span className="text-xs text-primary font-bold">
                    {status.isOpen ? "Open Now" : "Currently Closed"} • Every Single Night
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-2 text-sm">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Operating Schedule:</span>
                  <span className="font-extrabold text-white text-base">
                    {openTimeDisplay} – {closeTimeDisplay}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  *Orders placed after {closeTimeDisplay} will be served in the next operating cycle.
                </p>
              </div>
            </div>

            {/* Direct Connect Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${cleanWhatsapp || "919080139363"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 rounded-3xl bg-surface border border-border hover:border-emerald-500/50 shadow-card transition-all group glass-card-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white mb-1 font-heading">WhatsApp Chat</h4>
                <p className="text-xs text-zinc-400 mb-3">{whatsapp}</p>
                <span className="text-xs font-bold text-emerald-400 group-hover:underline">
                  Start Chat →
                </span>
              </a>

              {/* Call Hotline */}
              <a
                href={`tel:${phone}`}
                className="p-6 rounded-3xl bg-surface border border-border hover:border-primary/50 shadow-card transition-all group glass-card-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white mb-1 font-heading">Kitchen Hotline</h4>
                <p className="text-xs text-zinc-400 mb-3">{phone}</p>
                <span className="text-xs font-bold text-primary group-hover:underline">
                  Call Now →
                </span>
              </a>
            </div>

            {/* Kitchen Address */}
            <div className="p-6 rounded-3xl bg-surface border border-border space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-base font-bold text-white font-heading">Kitchen Location</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                    {address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Message Form */}
          {/* <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white font-heading">
                Send a Direct Message
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                We'll respond to your query right away.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-sm flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Thank you!</p>
                  <p className="text-xs text-emerald-300">Your message has been received. Our team will get back to you shortly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl bg-surface-raised border border-border px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="90801 39363"
                    className="w-full rounded-xl bg-surface-raised border border-border px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Message / Inquiry
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Ask about bulk party orders, dietary preferences, or feedback..."
                    className="w-full rounded-xl bg-surface-raised border border-border px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider shadow-glow transition-all"
                >
                  Send Message
                </button>
              </form>
            )}
          </div> */}
        </div>
      </main>

      <Footer />
    </div>
  );
}

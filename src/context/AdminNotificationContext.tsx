"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Flame, ShoppingBag, X, ExternalLink, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface GlobalOrderAlert {
  id: string;
  orderNumber: string;
  customerName: string;
  grandTotal: number;
  itemsCount: number;
  orderType: string;
}

interface AdminNotificationContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  activeAlert: GlobalOrderAlert | null;
  dismissAlert: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType>({
  soundEnabled: true,
  setSoundEnabled: () => {},
  activeAlert: null,
  dismissAlert: () => {},
});

export const useAdminNotification = () => useContext(AdminNotificationContext);

export function AdminNotificationProvider({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeAlert, setActiveAlert] = useState<GlobalOrderAlert | null>(null);

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initialize & Preload Swiggy/Zomato style alarm tone & unlock audio on user gesture
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/mixkit-alarm-tone-996.wav");
      audio.preload = "auto";
      audioRef.current = audio;

      // Unlock browser audio autoplay restriction on first user click anywhere in admin
      const unlockAudio = () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
          }).catch(() => {});
        }
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };

      window.addEventListener("click", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });

      return () => {
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
    }
  }, []);

  // 2. Play Alarm Sound with fallback
  const playNewOrderSound = () => {
    if (!soundEnabled) return;
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const promise = audioRef.current.play();
        if (promise !== undefined) {
          promise.catch((err) => {
            console.warn("Autoplay audio blocked by browser policy:", err);
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

  // 3. Fast Global Background Order Polling across all admin routes
  useEffect(() => {
    if (!isAuthenticated) return;

    const pollLiveOrders = async () => {
      try {
        const res = await fetch("/api/orders?limit=50", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        const incomingOrders = data.orders || [];

        if (isInitialLoadRef.current) {
          // On first load, seed known orders without firing alarm
          incomingOrders.forEach((o: any) => knownOrderIdsRef.current.add(o.id));
          isInitialLoadRef.current = false;
          return;
        }

        // Find incoming new orders that haven't been alerted yet
        const freshOrders = incomingOrders.filter(
          (o: any) => o.orderStatus === "NEW" && !knownOrderIdsRef.current.has(o.id)
        );

        if (freshOrders.length > 0) {
          const latest = freshOrders[0];
          freshOrders.forEach((o: any) => knownOrderIdsRef.current.add(o.id));

          // Trigger Sound Alarm everywhere
          playNewOrderSound();

          // Trigger Toast popup across any admin screen
          const itemsCount = (latest.items?.length || 0) + (latest.combos?.length || 0);
          setActiveAlert({
            id: latest.id,
            orderNumber: latest.orderNumber,
            customerName: latest.customerName || "Customer",
            grandTotal: latest.grandTotal,
            itemsCount,
            orderType: latest.orderType,
          });
        }
      } catch (err) {
        console.error("Global order polling failed", err);
      }
    };

    pollLiveOrders();
    const interval = setInterval(pollLiveOrders, 4000); // 4s fast poll everywhere in admin
    return () => clearInterval(interval);
  }, [isAuthenticated, soundEnabled]);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return (
    <AdminNotificationContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        activeAlert,
        dismissAlert,
      }}
    >
      {children}

      {/* GLOBAL TOAST POPUP NOTIFICATION FOR NEW INCOMING ORDERS */}
      {activeAlert && (
        <div className="fixed top-5 right-5 z-[99999] max-w-sm w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="p-4 rounded-2xl bg-[#141414]/95 border-2 border-primary/80 shadow-2xl backdrop-blur-xl space-y-3 shadow-glow ring-1 ring-primary/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-black flex items-center justify-center font-bold animate-bounce shadow-glow">
                  <Bell className="w-5 h-5 fill-black" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-primary uppercase tracking-wider font-heading">
                      NEW INCOMING ORDER!
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {activeAlert.orderType}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-white block">
                    #{activeAlert.orderNumber} • {formatINR(activeAlert.grandTotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={dismissAlert}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-surface-raised transition-colors"
                title="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Customer: <strong className="text-white">{activeAlert.customerName}</strong> ({activeAlert.itemsCount} items)
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  dismissAlert();
                  router.push(`/admin/orders/${activeAlert.id}`);
                }}
                className="py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-glow transition-all"
              >
                <span>View Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  dismissAlert();
                  router.push("/admin/orders");
                }}
                className="py-2 px-3 rounded-xl bg-surface-raised hover:bg-surface border border-border text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                <span>Live Board</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminNotificationContext.Provider>
  );
}

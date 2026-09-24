"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminNavProvider } from "@/context/AdminNavContext";
import { Flame, Lock, User, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login";

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Popup Form state
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("MidnightFuel@2026");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.admin) {
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          return;
        }
      }
      setIsAuthenticated(false);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const handleModalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || "Invalid username or password");
        setIsLoggingIn(false);
        return;
      }

      setIsAuthenticated(true);
      setIsLoggingIn(false);
      // Hard refresh/redirect so state and components rehydrate with valid session
      window.location.reload();
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in");
      setIsLoggingIn(false);
    }
  };

  // If on /admin/login page directly, render standalone login view
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#070707] text-foreground">
        {children}
      </div>
    );
  }

  return (
    <AdminNavProvider>
      <div className="min-h-screen bg-[#090909] flex text-foreground relative">
        {/* Only render sidebar and allow interaction when authenticated */}
        {isAuthenticated && <AdminSidebar />}

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen relative">
          {/* Main content */}
          {isAuthenticated ? (
            children
          ) : isCheckingAuth ? (
            /* Loading State */
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Verifying Admin Authorization...
              </p>
            </div>
          ) : (
            /* Blurred Background Shell when Unauthenticated (Prevents Any Interaction) */
            <div className="relative min-h-screen filter blur-md select-none pointer-events-none opacity-20">
              {children}
            </div>
          )}

          {/* STRICT BLURRY MODAL POPUP IF NOT LOGGED IN */}
          {!isAuthenticated && !isCheckingAuth && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
              <div
                className="w-full max-w-md bg-[#121212]/95 border border-primary/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 shadow-glow"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Brand Header */}
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-black mx-auto shadow-glow mb-3">
                    <Flame className="w-8 h-8 fill-black" />
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight font-heading">
                    MIDNIGHT <span className="text-primary">FUEL</span>
                  </h1>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Kitchen Admin Authorization</span>
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto pt-1">
                    Sign in with your kitchen admin credentials to access management controls.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleModalLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Admin Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-orange-600 hover:from-primary-hover hover:to-orange-500 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 min-h-[44px]"
                  >
                    {isLoggingIn ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                      </span>
                    ) : (
                      <>
                        <span>Unlock Admin Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 text-center border-t border-border/60">
                  <button
                    onClick={() => router.push("/")}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    ← Back to Customer Website
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminNavProvider>
  );
}

"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto space-y-6 bg-surface border border-border p-8 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white font-heading">
            Something went wrong
          </h1>
          <p className="text-xs text-zinc-400 mt-2">
            An unexpected error occurred while loading this page.
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-primary text-black font-extrabold text-xs uppercase flex items-center gap-2 shadow-glow"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-surface-raised border border-border text-white text-xs font-bold uppercase"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

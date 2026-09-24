"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Flame,
  CreditCard,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatINR } from "@/lib/utils";

const COLORS = ["#FF7A00", "#00F0FF", "#F59E0B", "#10B981", "#8B5CF6"];

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [range, setRange] = useState("today");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/reports?range=${range}`);
        if (res.ok) {
          const data = await res.json();
          setReportData(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [range]);

  const stats = reportData?.stats || {};
  const hourly = reportData?.hourlyPerformance || [];
  const popular = reportData?.popularProducts || [];
  const payments = reportData?.paymentDistribution || [];
  const statuses = reportData?.statusDistribution || [];

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title="Kitchen Reports & Peak Midnight Analytics"
        subtitle="Operational metrics, 7 PM – 2 AM traffic heatmaps and financial aggregates."
      />

      <main className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Range Selector & KPI Cards */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border text-xs">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "Last 7 Days" },
              { id: "month", label: "Last 30 Days" },
              { id: "all", label: "All Time" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  range === tab.id
                    ? "bg-primary text-black font-extrabold shadow-glow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-surface border border-border">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Total Order Volume
            </span>
            <span className="text-3xl font-black text-white mt-1 block">
              {stats.totalOrdersCount || 0}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-3xl font-black text-primary mt-1 block">
              {formatINR(stats.totalRevenue || stats.totalSales || 0)}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Average Order Value
            </span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block">
              {formatINR(stats.averageOrderValue || 0)}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Peak Midnight Hour
            </span>
            <span className="text-3xl font-black text-amber-400 mt-1 block">
              {stats.peakOrderingHour || "10 PM"}
            </span>
          </div>
        </div>

        {/* Midnight Hourly Distribution */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-card space-y-6">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-white font-heading">
              MIDNIGHT HOURLY SALES TRAFFIC (7:00 PM – 2:00 AM)
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#181818",
                    borderColor: "#3f3f46",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any, name: any) => [
                    name === "revenue" ? `₹${val}` : `${val} orders`,
                    name === "revenue" ? "Revenue" : "Orders",
                  ]}
                />
                <Bar dataKey="revenue" fill="#FF7A00" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two Columns: Payment Distribution & Best Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Top Selling Dishes */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-surface border border-border space-y-4">
            <h3 className="text-base font-bold text-white font-heading border-b border-border/60 pb-3">
              Top Selling Dishes by Units
            </h3>

            <div className="space-y-2 text-xs">
              {popular.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-bold text-white">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-white block">
                      {item.count} sold
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {formatINR(item.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-surface border border-border space-y-4">
            <h3 className="text-base font-bold text-white font-heading border-b border-border/60 pb-3">
              Payment Methods Breakdown
            </h3>

            <div className="space-y-3">
              {payments.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-surface-raised border border-border flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-white uppercase">{p.name}</span>
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-black">
                    {p.count} orders
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

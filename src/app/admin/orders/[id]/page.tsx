"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  FileText,
  Truck,
  Edit2,
  Sparkles,
  History,
  CheckCircle2,
  MessageSquare,
  ClipboardList,
  Save,
  Loader2,
  Eye,
  X,
  ExternalLink,
  Printer,
  Receipt,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { OrderType, DeliveryDistanceSlabType } from "@/types";
import { formatINR, formatDate, getStatusInfo } from "@/lib/utils";
import { getSuggestedDeliveryCharge } from "@/lib/calculations";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderType | null>(null);
  const [slabs, setSlabs] = useState<DeliveryDistanceSlabType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isPreviewInvoiceOpen, setIsPreviewInvoiceOpen] = useState(false);

  // Internal Kitchen Note State
  const [internalKitchenNote, setInternalKitchenNote] = useState("");
  const [isSavingInternalNote, setIsSavingInternalNote] = useState(false);

  // Delivery Charge Edit Modal State
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editDistanceKm, setEditDistanceKm] = useState<number | string>("");
  const [editDeliveryCharge, setEditDeliveryCharge] = useState<number | string>("");
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchOrderAndSlabs = useCallback(async () => {
    try {
      const [orderRes, slabsRes] = await Promise.all([
        fetch(`/api/orders/${id}`),
        fetch("/api/delivery-slabs"),
      ]);

      if (orderRes.ok) {
        const data = await orderRes.json();
        setOrder(data.order);
        setInternalKitchenNote(data.order.internalKitchenNote || "");
      }
      if (slabsRes.ok) {
        const sData = await slabsRes.json();
        setSlabs(sData.slabs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderAndSlabs();
  }, [fetchOrderAndSlabs]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(newStatus);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        showToast(`Status updated to ${newStatus}`);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSaveInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInternalNote(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalKitchenNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        showToast("Internal kitchen note saved!");
      } else {
        showToast("Failed to save kitchen note.");
      }
    } catch {
      showToast("Network error saving note.");
    } finally {
      setIsSavingInternalNote(false);
    }
  };

  const handleOpenDeliveryModal = () => {
    if (!order) return;
    setEditDistanceKm(order.deliveryDistanceKm ?? "");
    setEditDeliveryCharge(order.deliveryCharge ?? 40);
    setIsDeliveryModalOpen(true);
  };

  const handleDistanceChange = (val: string) => {
    setEditDistanceKm(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const suggested = getSuggestedDeliveryCharge(num, slabs);
      setEditDeliveryCharge(suggested);
    }
  };

  const handleSaveDeliveryCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editDeliveryCharge === "") {
      showToast("Please enter a delivery charge.");
      return;
    }

    setIsSavingDelivery(true);
    try {
      const distanceNum = editDistanceKm !== "" ? parseFloat(editDistanceKm.toString()) : null;
      const chargeNum = parseFloat(editDeliveryCharge.toString());

      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryDistanceKm: distanceNum,
          deliveryCharge: chargeNum,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
        setIsDeliveryModalOpen(false);
        showToast("Delivery charge updated & invoice recalculated!");
      } else {
        showToast(data.error || "Failed to update delivery charge");
      }
    } catch {
      showToast("Network error updating delivery charge");
    } finally {
      setIsSavingDelivery(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 text-center text-zinc-400">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 p-8 text-center text-zinc-400 space-y-3">
        <p>Order not found.</p>
        <Link href="/admin/orders" className="text-primary font-bold">
          ← Back to Live Orders
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.orderStatus);

  return (
    <div className="flex-1 pb-16">
      <AdminHeader
        title={`Order #${order.orderNumber}`}
        subtitle={`Placed on ${formatDate(order.createdAt)} • ZERO GST`}
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/orders/${order.id}/retry-whatsapp`, {
                    method: "POST",
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    showToast("WhatsApp invoice notification dispatched successfully!");
                  } else {
                    showToast(data.error || "Failed to dispatch WhatsApp message.");
                  }
                } catch {
                  showToast("Network error dispatching WhatsApp.");
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-glow"
              title="Resend WhatsApp Invoice"
            >
              <MessageCircle className="w-4 h-4" /> Resend WhatsApp
            </button>
            <button
              onClick={handleOpenDeliveryModal}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-glow transition-all"
            >
              <Truck className="w-4 h-4 stroke-[2.5]" /> Edit Delivery Charge
            </button>
            <button
              onClick={() => setIsPreviewInvoiceOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/40 text-primary text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Preview Invoice in Popup"
            >
              <Eye className="w-4 h-4" /> Preview Invoice
            </button>
            <Link
              href={`/invoice/${order.id}`}
              target="_blank"
              className="px-4 py-2 rounded-xl bg-surface border border-border text-white text-xs font-bold flex items-center gap-2 hover:border-primary"
            >
              <FileText className="w-4 h-4 text-primary" /> View Invoice
            </Link>
          </div>
        }
      />

      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-surface-raised border border-primary text-primary font-bold text-xs shadow-glow animate-in fade-in">
          {toastMessage}
        </div>
      )}

      <main className="p-6 space-y-6 max-w-6xl mx-auto">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Live Board
        </Link>

        {/* Status Control Card */}
        <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
          <div>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">
              Current Lifecycle State
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${statusInfo.badgeClass}`}
              >
                {statusInfo.label}
              </span>
              <span className="text-xs text-zinc-400">
                Payment: <strong className="text-white">{order.paymentStatus}</strong> ({order.paymentMethod})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map(
              (st) => {
                const isThisUpdating = updatingStatus === st;
                const isAnyUpdating = updatingStatus !== null;
                const isCurrent = order.orderStatus === st;

                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={isAnyUpdating || isCurrent}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                      isCurrent
                        ? "bg-primary text-black font-black shadow-glow"
                        : "bg-surface-raised border border-border text-zinc-400 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    }`}
                  >
                    {isThisUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                    <span>{st.replace(/_/g, " ")}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* PROMINENT CUSTOMER REQUEST / SPECIAL NOTE BANNER */}
        {order.specialNote && order.specialNote.trim() ? (
          <div className="p-6 rounded-3xl bg-amber-950/40 border-2 border-amber-500 shadow-glow space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black text-amber-300 uppercase tracking-wider font-heading">
                CUSTOMER REQUEST / SPECIAL NOTE
              </h2>
            </div>
            <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/30 text-white font-bold text-base leading-relaxed">
              "{order.specialNote.trim()}"
            </div>
            <p className="text-[11px] text-zinc-400">
              Preserved as submitted by customer at checkout. Note has 0 effect on order total.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-surface border border-border/80 text-xs text-zinc-500 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-600" />
            <span>No special request provided by customer for this order.</span>
          </div>
        )}

        {/* Delivery & Distance Highlight Card */}
        <div className="p-6 rounded-3xl bg-surface border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Distance-Based Delivery Charge
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-lg font-black text-white">
                  {order.deliveryCharge === 0 ? "FREE (PICKUP)" : formatINR(order.deliveryCharge)}
                </span>
                {order.deliveryDistanceKm !== null && order.deliveryDistanceKm !== undefined && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 text-xs font-bold">
                    Distance: {order.deliveryDistanceKm} KM
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenDeliveryModal}
            className="px-4 py-2 rounded-xl bg-surface-raised hover:bg-surface border border-border hover:border-primary text-white text-xs font-bold flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit Distance & Charge
          </button>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Items & Combos Table */}
          <div className="md:col-span-8 p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-card">
            <h3 className="text-base font-bold text-white font-heading border-b border-border/60 pb-3">
              🍗 ORDERED ITEMS & DAILY COMBOS
            </h3>

            <div className="divide-y divide-border/40">
              {/* Product items */}
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-primary mr-2 text-sm">{item.quantity}×</span>
                    <span className="text-white font-bold text-sm">{item.productName}</span>
                  </div>
                  <span className="font-extrabold text-white text-sm">
                    {formatINR(item.totalPrice)}
                  </span>
                </div>
              ))}

              {/* Combo items */}
              {order.combos?.map((combo) => (
                <div key={combo.id} className="py-3.5 flex items-center justify-between text-xs bg-surface-raised/40 px-3 rounded-xl">
                  <div>
                    <span className="font-bold text-primary mr-2 text-sm">{combo.quantity}×</span>
                    <span className="text-primary font-bold text-sm inline-flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> {combo.comboNameSnapshot}
                    </span>
                    {combo.servingPeopleSnapshot && (
                      <span className="text-[11px] text-zinc-400 block ml-6 mt-0.5">
                        {combo.servingPeopleSnapshot}
                      </span>
                    )}
                    {combo.items && combo.items.length > 0 && (
                      <div className="text-[10px] text-zinc-400 ml-6 mt-1 space-y-0.5">
                        {combo.items.map((ci, idx) => (
                          <div key={idx}>• {ci.productNameSnapshot} × {ci.quantitySnapshot}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-extrabold text-primary text-sm">
                    {formatINR(combo.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Breakdown (ZERO GST) */}
            <div className="pt-4 border-t border-border/60 space-y-2 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Food Subtotal:</span>
                <span className="text-white font-semibold">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <span>Delivery Charge:</span>
                  {order.deliveryDistanceKm !== null && order.deliveryDistanceKm !== undefined && (
                    <span className="text-emerald-400 font-bold ml-1">({order.deliveryDistanceKm} KM)</span>
                  )}
                </div>
                <span className="text-white font-semibold">
                  {order.deliveryCharge === 0 ? "FREE" : formatINR(order.deliveryCharge)}
                </span>
              </div>
              <div className="pt-2 border-t border-border/80 flex justify-between text-base font-black text-white font-heading">
                <div>
                  <span className="block">Grand Total:</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Subtotal + Delivery Charge (ZERO GST)</span>
                </div>
                <span className="text-2xl text-primary font-heading">{formatINR(order.grandTotal)}</span>
              </div>
            </div>

            {/* Delivery Charge History Audit Trail */}
            {order.deliveryHistory && order.deliveryHistory.length > 0 && (
              <div className="pt-4 border-t border-border/60 space-y-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-primary" /> Delivery Charge Change Audit Trail
                </span>
                <div className="space-y-1.5">
                  {order.deliveryHistory.map((hist) => (
                    <div
                      key={hist.id}
                      className="p-2.5 rounded-xl bg-surface-raised border border-border text-[11px] text-zinc-400 flex items-center justify-between"
                    >
                      <div>
                        <span>
                          Charge changed from <strong className="text-white">₹{hist.oldDeliveryCharge}</strong> to <strong className="text-emerald-400">₹{hist.newDeliveryCharge}</strong>
                        </span>
                        {hist.newDistance && (
                          <span className="text-zinc-500 block">Distance: {hist.newDistance} KM</span>
                        )}
                      </div>
                      <span className="text-zinc-500">{formatDate(hist.changedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Customer Info & Internal Kitchen Note */}
          <div className="md:col-span-4 space-y-6">
            {/* Customer Details */}
            <div className="p-6 rounded-3xl bg-surface border border-border space-y-4 text-xs shadow-card">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-3 font-heading">
                Customer Contact
              </h3>

              <div>
                <span className="text-zinc-500 font-bold uppercase block text-[10px]">Customer Name</span>
                <span className="text-white font-bold text-sm">{order.customerName}</span>
              </div>

              <div>
                <span className="text-zinc-500 font-bold uppercase block text-[10px]">Mobile Phone</span>
                <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline font-semibold text-sm">
                  +91 {order.customerPhone}
                </a>
              </div>

              <div>
                <span className="text-zinc-500 font-bold uppercase block text-[10px]">WhatsApp Chat</span>
                <a
                  href={`https://wa.me/91${order.customerWhatsapp || order.customerPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-400 font-bold hover:bg-emerald-900/60 transition-all mt-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> +91 {order.customerWhatsapp || order.customerPhone}
                </a>
              </div>

              {order.deliveryAddress && (
                <div>
                  <span className="text-zinc-500 font-bold uppercase block text-[10px]">Delivery Address</span>
                  <span className="text-zinc-300 leading-relaxed block mt-0.5">{order.deliveryAddress}</span>
                </div>
              )}
            </div>

            {/* INTERNAL KITCHEN NOTE (Private to Staff) */}
            <div className="p-6 rounded-3xl bg-surface border border-border space-y-3 text-xs shadow-card">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
                  <ClipboardList className="w-4 h-4 text-cyan-400" /> INTERNAL KITCHEN NOTE
                </h3>
                <span className="text-[10px] text-cyan-400 font-bold px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800">
                  Staff Only
                </span>
              </div>

              <p className="text-[11px] text-zinc-400">
                Visible only to kitchen admin. Not sent to customer or invoice.
              </p>

              <form onSubmit={handleSaveInternalNote} className="space-y-3">
                <textarea
                  rows={3}
                  value={internalKitchenNote}
                  onChange={(e) => setInternalKitchenNote(e.target.value)}
                  placeholder="e.g. Chef confirmed no onion; customer called..."
                  className="w-full rounded-xl bg-surface-raised border border-border p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />

                <button
                  type="submit"
                  disabled={isSavingInternalNote}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingInternalNote ? "Saving Note..." : "Save Kitchen Note"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Delivery Charge Modal */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <h3 className="text-base font-black text-white font-heading flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" /> Set Delivery Charge
              </h3>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryCharge} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold uppercase mb-1">
                  Customer Distance (KM)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editDistanceKm}
                  onChange={(e) => handleDistanceChange(e.target.value)}
                  placeholder="e.g. 3.2"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-white focus:border-primary text-sm font-bold"
                />
              </div>

              {/* Distance Slabs Auto-Suggestion Notice */}
              <div className="p-3 rounded-xl bg-surface-raised border border-border/80 text-zinc-300 space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                  Configured Distance Slabs
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {slabs.map((s) => (
                    <div key={s.id} className="text-zinc-400">
                      {s.minDistanceKm}–{s.maxDistanceKm} KM: <strong className="text-white">₹{s.defaultCharge}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold uppercase mb-1">
                  Delivery Charge (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editDeliveryCharge}
                  onChange={(e) => setEditDeliveryCharge(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-primary focus:border-primary text-base font-black"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300">
                Notice: Saving will recalculate the Grand Total and invoice snapshot for Order #{order.orderNumber}.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-raised hover:bg-surface border border-border text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDelivery}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-black font-extrabold shadow-glow uppercase tracking-wider disabled:opacity-50"
                >
                  {isSavingDelivery ? "Saving..." : "[ SAVE DELIVERY CHARGE ]"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Quick Preview Modal Popup */}
      {isPreviewInvoiceOpen && order && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-[#121212] border border-border rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-raised/60 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary flex-shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">
                    Invoice Preview: {order.invoice?.invoiceNumber || `INV-${order.orderNumber}`}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Order #{order.orderNumber} • {order.customerName} ({order.customerPhone})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/invoice/${order.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border hover:border-primary text-xs font-bold text-zinc-200 transition-colors"
                  title="Open full page in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  <span>Full Page</span>
                </a>
                <button
                  onClick={() => {
                    const iframe = document.getElementById("order-invoice-preview-frame") as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    } else {
                      window.open(`/invoice/${order.id}`, "_blank");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-black text-xs font-extrabold shadow-glow uppercase tracking-wider transition-all"
                >
                  <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setIsPreviewInvoiceOpen(false)}
                  className="p-2 rounded-xl bg-surface border border-border text-zinc-400 hover:text-white hover:border-rose-500 transition-colors"
                  aria-label="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Iframe */}
            <div className="flex-1 w-full bg-[#0d0d0d] overflow-hidden p-2 sm:p-4">
              <iframe
                id="order-invoice-preview-frame"
                src={`/invoice/${order.id}`}
                title="Invoice Preview"
                className="w-full h-[65vh] rounded-2xl border border-border/50 bg-[#0d0d0d]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

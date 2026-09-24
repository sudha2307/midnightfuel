import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flame, Phone, MessageCircle, MapPin, MessageSquare } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatINR, formatDate } from "@/lib/utils";
import PrintButton from "./PrintButton";

async function getInvoiceData(id: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        combos: {
          include: { items: true },
        },
        invoice: true,
        payment: true,
      },
    });

    if (!order) return null;

    const settings = await prisma.businessSettings.findUnique({
      where: { id: "default-settings" },
    });

    return { order, settings };
  } catch (e) {
    console.error("Failed to load invoice", e);
    return null;
  }
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const data = await getInvoiceData(orderId);

  if (!data || !data.order) {
    notFound();
  }

  const { order, settings } = data;
  const invoiceNumber =
    order.invoice?.invoiceNumber || `INV-${order.orderNumber}`;

  const orderTimeStr = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white py-8 sm:py-12 px-4 sm:px-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between no-print">
        <Link
          href={`/track-order/${order.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order Tracking
        </Link>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Printable Invoice Container (ZERO GST) */}
      <div className="invoice-container max-w-3xl mx-auto bg-[#141414] border border-border/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-black shadow-glow">
                <Flame className="w-5 h-5 fill-black" />
              </div>
              <span className="text-2xl font-black tracking-wider text-white font-heading">
                MIDNIGHT <span className="text-primary">FUEL</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-semibold tracking-widest uppercase">
              {settings?.tagline || "EAT • ENJOY • RECHARGE"}
            </p>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-xs">
              {settings?.address || "123 Food Street, Late Night Hub, Tirunelveli - 627001"}
            </p>
            <p className="text-xs text-zinc-400">
              Phone: {settings?.phone || "+91 98765 43210"} • WhatsApp: {settings?.whatsapp || "+91 98765 43210"}
            </p>
          </div>

          <div className="sm:text-right space-y-1 text-xs">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-black text-xs uppercase tracking-wider inline-block mb-2">
              BILL INVOICE
            </span>
            <p className="text-white font-bold text-sm">Invoice No: {invoiceNumber}</p>
            <p className="text-zinc-400">
              Order No: <strong className="text-white">{order.orderNumber}</strong>
            </p>
            <p className="text-zinc-400">Date: <strong className="text-white">{formatDate(order.createdAt)}</strong></p>
            <p className="text-zinc-400">Time: <strong className="text-white">{orderTimeStr}</strong></p>
            <p className="text-zinc-400 pt-1">
              Payment Method: <strong className="text-white">{order.paymentMethod === "COD" ? "Cash on Delivery" : "UPI"}</strong>
            </p>
            <p className="text-zinc-400">
              Payment Status:{" "}
              <span className={order.paymentStatus === "PAID" || order.paymentStatus === "COMPLETED" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {order.paymentStatus}
              </span>
            </p>
          </div>
        </div>

        {/* CUSTOMER & DELIVERY DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pb-6 border-b border-border/80">
          {/* CUSTOMER */}
          <div className="space-y-1.5 bg-surface-raised/40 p-4 rounded-2xl border border-border/50">
            <span className="text-primary font-black uppercase tracking-wider block text-[11px]">
              CUSTOMER
            </span>
            <p className="text-sm font-extrabold text-white">{order.customerName}</p>
            <p className="text-zinc-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" /> Mobile: +91 {order.customerPhone}
            </p>
            <p className="text-emerald-400 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp: +91 {order.customerWhatsapp || order.customerPhone}
            </p>
          </div>

          {/* DELIVERY */}
          <div className="space-y-1.5 bg-surface-raised/40 p-4 rounded-2xl border border-border/50">
            <span className="text-primary font-black uppercase tracking-wider block text-[11px] flex items-center justify-between">
              <span>DELIVERY</span>
              {order.deliveryDistanceKm !== null && order.deliveryDistanceKm !== undefined && (
                <span className="text-emerald-400 font-bold">{order.deliveryDistanceKm} KM</span>
              )}
            </span>
            <p className="text-zinc-200 font-medium leading-relaxed">
              {order.deliveryAddress || "Kitchen Counter Pickup"}
            </p>
            <p className="text-zinc-400 text-[11px] flex items-center gap-1.5 pt-1">
              <MapPin className="w-3 h-3 text-zinc-500" />
              Order Type: <strong className="text-white">{order.orderType === "DELIVERY" ? "Doorstep Delivery" : "Self Pickup"}</strong>
            </p>
          </div>
        </div>

        {/* ORDER ITEMS & COMBOS TABLE */}
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left text-xs border-collapse min-w-[320px]">
            <thead>
              <tr className="border-b border-border/80 text-zinc-400 uppercase tracking-wider">
                <th className="py-3 font-bold">Item Description</th>
                <th className="py-3 text-center font-bold">Qty</th>
                <th className="py-3 text-right font-bold">Price (₹)</th>
                <th className="py-3 text-right font-bold">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {/* Product items */}
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 pr-2">
                    <span className="font-bold text-white text-sm block">
                      {item.productName}
                    </span>
                  </td>
                  <td className="py-3.5 text-center text-zinc-200 font-bold text-sm">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 text-right text-zinc-300 font-medium">
                    {formatINR(item.unitPrice)}
                  </td>
                  <td className="py-3.5 text-right text-white font-extrabold text-sm">
                    {formatINR(item.totalPrice)}
                  </td>
                </tr>
              ))}

              {/* Combo items */}
              {order.combos?.map((combo) => (
                <tr key={combo.id}>
                  <td className="py-3.5 pr-2">
                    <span className="font-bold text-primary text-sm block">
                      🔥 {combo.comboNameSnapshot}
                    </span>
                    {combo.servingPeopleSnapshot && (
                      <span className="text-[11px] text-zinc-400 block font-medium">
                        {combo.servingPeopleSnapshot}
                      </span>
                    )}
                    {combo.items?.length > 0 && (
                      <div className="text-[10px] text-zinc-400 mt-1 space-y-0.5">
                        {combo.items.map((it, idx) => (
                          <div key={idx}>• {it.productNameSnapshot} × {it.quantitySnapshot}</div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 text-center text-zinc-200 font-bold text-sm">
                    {combo.quantity}
                  </td>
                  <td className="py-3.5 text-right text-zinc-300 font-medium">
                    {formatINR(combo.priceSnapshot)}
                  </td>
                  <td className="py-3.5 text-right text-white font-extrabold text-sm">
                    {formatINR(combo.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CUSTOMER SPECIAL NOTE SECTION (If provided) */}
        {order.specialNote && order.specialNote.trim() && (
          <div className="p-4 rounded-2xl bg-surface-raised/60 border border-border/80 space-y-1 text-xs">
            <span className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <MessageSquare className="w-3.5 h-3.5" /> CUSTOMER NOTE / SPECIAL REQUEST
            </span>
            <p className="text-zinc-200 text-sm italic pt-1 leading-relaxed">
              "{order.specialNote.trim()}"
            </p>
          </div>
        )}

        {/* Financial Summary (ZERO GST) */}
        <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row justify-between gap-6">
          <div className="text-xs text-zinc-400 space-y-1 max-w-xs">
            <p className="font-bold text-white">Cloud Kitchen Notice:</p>
            <p>1. Freshly cooked late-night food prepared with high hygiene standards.</p>
            <p>2. For any instant order queries, message our kitchen on WhatsApp.</p>
          </div>

          <div className="sm:w-72 space-y-2.5 text-xs">
            <div className="flex justify-between text-zinc-300">
              <span>Subtotal:</span>
              <span className="text-white font-semibold">{formatINR(order.subtotal)}</span>
            </div>

            <div className="flex justify-between text-zinc-300">
              <span>Delivery Charge:</span>
              <span className="text-white font-semibold">
                {order.deliveryCharge === 0 ? (
                  order.orderType === "PICKUP" ? "FREE (PICKUP)" : "₹0"
                ) : (
                  formatINR(order.deliveryCharge)
                )}
              </span>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-base font-black">
              <span className="text-white font-heading">TOTAL:</span>
              <span className="text-2xl font-black text-primary font-heading">{formatINR(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border/60 text-xs text-zinc-500 space-y-1">
          <p className="font-bold text-zinc-300">
            Thank you for choosing MIDNIGHT FUEL 🌙 • EAT • ENJOY • RECHARGE
          </p>
          <p>No tax or GST applicable.</p>
        </div>
      </div>
    </div>
  );
}

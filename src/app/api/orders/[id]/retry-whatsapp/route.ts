import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppNotification } from "@/services/whatsappService";
import { getAdminSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify Admin authentication
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin privileges required." },
        { status: 401 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        combos: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const itemsSummary = [
      ...order.items.map((i) => `${i.quantity}× ${i.productName}`),
      ...order.combos.map((c) => `${c.quantity}× ${c.comboNameSnapshot}`),
    ].join(", ");

    const result = await sendWhatsAppNotification({
      to: order.customerWhatsapp,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.orderStatus,
      subtotal: order.subtotal,
      deliveryDistanceKm: order.deliveryDistanceKm || undefined,
      deliveryCharge: order.deliveryCharge,
      grandTotal: order.grandTotal,
      itemsSummary,
      specialNote: order.specialNote || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "WhatsApp notification dispatched successfully.",
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch WhatsApp notification" },
      { status: 500 }
    );
  }
}

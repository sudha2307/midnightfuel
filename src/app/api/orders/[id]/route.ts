import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppNotification } from "@/services/whatsappService";
import { getAdminSession, getCustomerSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const adminSession = await getAdminSession();
    const customerSession = await getCustomerSession();

    // Search by primary key id OR orderNumber (e.g. MF10001)
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        customer: true,
        items: true,
        combos: {
          include: {
            items: true,
          },
        },
        invoice: true,
        payment: true,
        deliveryHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // STRICT CUSTOMER OWNERSHIP SECURITY CHECK
    // If not Admin, verify that the authenticated customer is the owner of this order
    if (!adminSession) {
      if (customerSession && order.customerId && order.customerId !== customerSession.customerId) {
        return NextResponse.json(
          { success: false, error: "Access Denied: You do not have permission to view this order." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const currentOrder = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        combos: true,
        payment: true,
        invoice: true,
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    let deliveryChargeUpdated = false;

    // Handle distance & delivery charge update
    if (body.deliveryCharge !== undefined || body.deliveryDistanceKm !== undefined) {
      const newCharge =
        body.deliveryCharge !== undefined
          ? Math.max(0, Number(body.deliveryCharge))
          : currentOrder.deliveryCharge;
      const newDistance =
        body.deliveryDistanceKm !== undefined
          ? (body.deliveryDistanceKm ? Math.max(0, Number(body.deliveryDistanceKm)) : null)
          : currentOrder.deliveryDistanceKm;

      if (
        newCharge !== currentOrder.deliveryCharge ||
        newDistance !== currentOrder.deliveryDistanceKm
      ) {
        updateData.deliveryCharge = newCharge;
        updateData.deliveryDistanceKm = newDistance;
        updateData.grandTotal = Math.round((currentOrder.subtotal + newCharge) * 100) / 100;
        deliveryChargeUpdated = true;

        // Log Delivery Charge Audit History
        await prisma.orderDeliveryChargeHistory.create({
          data: {
            orderId: currentOrder.id,
            oldDistance: currentOrder.deliveryDistanceKm,
            newDistance: newDistance,
            oldDeliveryCharge: currentOrder.deliveryCharge,
            newDeliveryCharge: newCharge,
            changedBy: body.changedBy || "Admin",
          },
        });

        // Update Invoice
        if (currentOrder.invoice) {
          await prisma.invoice.update({
            where: { id: currentOrder.invoice.id },
            data: {
              deliveryCharge: newCharge,
              totalAmount: updateData.grandTotal,
            },
          });
        }

        // Update Payment amount
        if (currentOrder.payment) {
          await prisma.payment.update({
            where: { id: currentOrder.payment.id },
            data: {
              amount: updateData.grandTotal,
            },
          });
        }
      }
    }

    if (body.internalKitchenNote !== undefined) {
      updateData.internalKitchenNote = body.internalKitchenNote?.trim() || null;
    }

    if (body.orderStatus) {
      updateData.orderStatus = body.orderStatus;

      // Compute & update estimated delivery/completion time dynamically
      const now = new Date();
      if (body.orderStatus === "PREPARING" && !currentOrder.estimatedDeliveryTime) {
        // Default 30 mins prep + delivery from when cooking starts
        updateData.estimatedDeliveryTime = new Date(now.getTime() + 30 * 60 * 1000);
      } else if (body.orderStatus === "READY") {
        // Ready for pickup / out in 15 mins
        updateData.estimatedDeliveryTime = new Date(now.getTime() + 15 * 60 * 1000);
      } else if (body.orderStatus === "OUT_FOR_DELIVERY") {
        // Out for delivery: arriving in 15-20 mins
        updateData.estimatedDeliveryTime = new Date(now.getTime() + 20 * 60 * 1000);
      } else if (body.orderStatus === "DELIVERED") {
        updateData.estimatedDeliveryTime = now;
      }

      // If marked DELIVERED and payment is COD with pending status, mark as PAID
      if (
        body.orderStatus === "DELIVERED" &&
        (currentOrder.paymentMethod === "COD" || currentOrder.paymentMethod === "CASH") &&
        (currentOrder.paymentStatus === "PENDING" || currentOrder.paymentStatus === "VERIFICATION_PENDING")
      ) {
        updateData.paymentStatus = "PAID";
      }
    }

    if (body.estimatedDeliveryTime !== undefined) {
      updateData.estimatedDeliveryTime = body.estimatedDeliveryTime ? new Date(body.estimatedDeliveryTime) : null;
    }

    if (body.paymentStatus) {
      updateData.paymentStatus = body.paymentStatus;
    }

    // Update payment record status in tandem
    if (updateData.paymentStatus) {
      const normalizedStatus =
        updateData.paymentStatus === "COMPLETED" || updateData.paymentStatus === "SUCCESS"
          ? "PAID"
          : updateData.paymentStatus;

      updateData.paymentStatus = normalizedStatus;

      await prisma.payment.updateMany({
        where: { orderId: currentOrder.id },
        data: {
          status: normalizedStatus,
        },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: currentOrder.id },
      data: updateData,
      include: {
        customer: true,
        items: true,
        combos: {
          include: { items: true },
        },
        invoice: true,
        payment: true,
        deliveryHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    // If delivery charge changed, trigger WhatsApp notification update
    if (deliveryChargeUpdated) {
      sendWhatsAppNotification({
        to: currentOrder.customerWhatsapp,
        orderNumber: currentOrder.orderNumber,
        customerName: currentOrder.customerName,
        status: updatedOrder.orderStatus,
        subtotal: updatedOrder.subtotal,
        deliveryDistanceKm: updatedOrder.deliveryDistanceKm || undefined,
        deliveryCharge: updatedOrder.deliveryCharge,
        grandTotal: updatedOrder.grandTotal,
        specialNote: updatedOrder.specialNote || undefined,
        isDeliveryChargeUpdate: true,
      }).catch((e) => console.error("WhatsApp delivery charge trigger error:", e));
    } else if (body.orderStatus && body.orderStatus !== currentOrder.orderStatus) {
      // If orderStatus was changed, trigger WhatsApp status update
      const itemsSummary = [
        ...currentOrder.items.map((i) => `${i.quantity}× ${i.productName}`),
        ...currentOrder.combos.map((c) => `${c.quantity}× ${c.comboNameSnapshot}`),
      ].join(", ");

      sendWhatsAppNotification({
        to: currentOrder.customerWhatsapp,
        orderNumber: currentOrder.orderNumber,
        customerName: currentOrder.customerName,
        status: body.orderStatus,
        subtotal: updatedOrder.subtotal,
        deliveryCharge: updatedOrder.deliveryCharge,
        grandTotal: updatedOrder.grandTotal,
        itemsSummary,
        specialNote: updatedOrder.specialNote || undefined,
      }).catch((e) => console.error("WhatsApp status trigger error:", e));
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: deliveryChargeUpdated
        ? "Delivery charge updated successfully."
        : "Order updated successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

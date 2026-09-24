import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      include: {
        addresses: true,
        orders: {
          select: {
            id: true,
            grandTotal: true,
            orderStatus: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Customer record not found" },
        { status: 401 }
      );
    }

    // Calculate lifetime stats
    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum, o) => sum + o.grandTotal, 0);

    return NextResponse.json({
      success: true,
      authenticated: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        whatsapp: customer.whatsapp,
        addresses: customer.addresses,
        totalOrders,
        totalSpent,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

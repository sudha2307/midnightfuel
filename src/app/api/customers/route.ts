import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { whatsapp: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
          },
        },
        addresses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = customers.map((c) => {
      const totalOrders = c.orders.length;
      const totalSpent = c.orders.reduce((sum, o) => sum + o.grandTotal, 0);
      const lastOrder = c.orders[0] || null;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        whatsapp: c.whatsapp,
        totalOrders,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
        lastOrderNumber: lastOrder ? lastOrder.orderNumber : null,
        orders: c.orders,
        addresses: c.addresses,
      };
    });

    return NextResponse.json({ success: true, customers: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

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
    const method = searchParams.get("method"); // ALL | CASH | UPI
    const status = searchParams.get("status"); // PENDING | VERIFICATION_PENDING | PAID | FAILED

    const where: any = {
      order: {
        orderStatus: {
          not: "CANCELLED",
        },
      },
    };

    if (method && method !== "ALL") {
      where.method = method === "CASH" ? "COD" : method;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            grandTotal: true,
            orderStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

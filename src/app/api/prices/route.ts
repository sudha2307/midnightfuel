import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        category: true,
        priceHistories: {
          orderBy: { changedAt: "desc" },
          take: 3,
        },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Bulk Price Update
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { updates } = body; // Array of { id: string, price: number }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No price updates provided" },
        { status: 400 }
      );
    }

    const results: any[] = [];

    for (const update of updates) {
      const existing = await prisma.product.findUnique({
        where: { id: update.id },
      });

      if (existing) {
        const newPrice = parseFloat(update.price);
        if (!isNaN(newPrice) && Math.abs(existing.price - newPrice) > 0.01) {
          // Log price history
          await prisma.priceHistory.create({
            data: {
              productId: existing.id,
              oldPrice: existing.price,
              newPrice,
              changedBy: admin.name || "Admin",
            },
          });

          // Update product price
          const updated = await prisma.product.update({
            where: { id: existing.id },
            data: { price: newPrice },
          });
          results.push(updated);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} product price(s) successfully`,
      updatedCount: results.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

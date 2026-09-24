import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET /api/combos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";

    const combos = await prisma.combo.findMany({
      where: isAdmin
        ? {}
        : {
            isActive: true,
          },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        priceHistories: {
          orderBy: { changedAt: "desc" },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { comboNumber: "asc" }],
    });

    const now = new Date();

    // Enrich combos with availability & validity checks
    const enrichedCombos = combos
      .filter((combo) => {
        if (isAdmin) return true;
        // Check validity period
        if (combo.validFrom && new Date(combo.validFrom) > now) return false;
        if (combo.validUntil) {
          const until = new Date(combo.validUntil);
          // Set to end of day if only date specified
          until.setHours(23, 59, 59, 999);
          if (now > until) return false;
        }
        return true;
      })
      .map((combo) => {
        const unavailableItems: string[] = [];
        for (const item of combo.items) {
          if (item.product && (!item.product.isAvailable || item.product.isDeleted)) {
            unavailableItems.push(item.product.name);
          }
        }

        const isPartiallyUnavailable = unavailableItems.length > 0;

        return {
          ...combo,
          isPartiallyUnavailable,
          unavailableItemNames: unavailableItems,
        };
      });

    return NextResponse.json({
      success: true,
      combos: enrichedCombos,
    });
  } catch (error: any) {
    console.error("GET /api/combos error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch combos" },
      { status: 500 }
    );
  }
}

// POST /api/combos (Admin only)
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
    const {
      comboNumber = 1,
      name,
      description,
      image,
      servingPeople,
      price,
      originalPrice,
      isActive = true,
      displayOrder = 0,
      validFrom,
      validUntil,
      items = [],
    } = body;

    if (!name || price === undefined || Number(price) < 0) {
      return NextResponse.json(
        { success: false, error: "Name and a valid non-negative Price are required." },
        { status: 400 }
      );
    }

    const createdCombo = await prisma.combo.create({
      data: {
        comboNumber: Number(comboNumber) || 1,
        name,
        description: description || null,
        image: image || null,
        servingPeople: servingPeople || null,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        isActive: Boolean(isActive),
        displayOrder: Number(displayOrder) || 0,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            customItemName: item.customItemName || item.name || null,
            quantity: Number(item.quantity) || 1,
          })),
        },
        priceHistories: {
          create: {
            oldPrice: Number(price),
            newPrice: Number(price),
            changedBy: admin.name || "Admin",
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      combo: createdCombo,
      message: "Daily Combo created successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/combos error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create combo" },
      { status: 500 }
    );
  }
}

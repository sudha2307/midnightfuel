import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET /api/combos/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const combo = await prisma.combo.findUnique({
      where: { id },
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
    });

    if (!combo) {
      return NextResponse.json(
        { success: false, error: "Combo not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, combo });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch combo" },
      { status: 500 }
    );
  }
}

// PUT /api/combos/[id] (Admin update)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existingCombo = await prisma.combo.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingCombo) {
      return NextResponse.json(
        { success: false, error: "Combo not found" },
        { status: 404 }
      );
    }

    const {
      comboNumber,
      name,
      description,
      image,
      servingPeople,
      price,
      originalPrice,
      isActive,
      displayOrder,
      validFrom,
      validUntil,
      items,
    } = body;

    const newPrice = price !== undefined ? Number(price) : existingCombo.price;

    // Record price history if changed
    if (newPrice !== existingCombo.price) {
      await prisma.comboPriceHistory.create({
        data: {
          comboId: id,
          oldPrice: existingCombo.price,
          newPrice: newPrice,
          changedBy: admin.name || "Admin",
        },
      });
    }

    // Replace items if provided
    if (items && Array.isArray(items)) {
      await prisma.comboItem.deleteMany({ where: { comboId: id } });
      await prisma.comboItem.createMany({
        data: items.map((item: any) => ({
          comboId: id,
          productId: item.productId || null,
          customItemName: item.customItemName || item.name || null,
          quantity: Number(item.quantity) || 1,
        })),
      });
    }

    const updatedCombo = await prisma.combo.update({
      where: { id },
      data: {
        comboNumber: comboNumber !== undefined ? Number(comboNumber) : existingCombo.comboNumber,
        name: name !== undefined ? name : existingCombo.name,
        description: description !== undefined ? description : existingCombo.description,
        image: image !== undefined ? image : existingCombo.image,
        servingPeople: servingPeople !== undefined ? servingPeople : existingCombo.servingPeople,
        price: newPrice,
        originalPrice: originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : existingCombo.originalPrice,
        isActive: isActive !== undefined ? Boolean(isActive) : existingCombo.isActive,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : existingCombo.displayOrder,
        validFrom: validFrom !== undefined ? (validFrom ? new Date(validFrom) : null) : existingCombo.validFrom,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : existingCombo.validUntil,
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      combo: updatedCombo,
      message: "Combo updated successfully.",
    });
  } catch (error: any) {
    console.error("PUT /api/combos/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update combo" },
      { status: 500 }
    );
  }
}

// PATCH /api/combos/[id] (Quick toggle status or field)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const updatedCombo = await prisma.combo.update({
      where: { id },
      data: body,
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      combo: updatedCombo,
      message: "Combo status updated.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to patch combo" },
      { status: 500 }
    );
  }
}

// DELETE /api/combos/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await prisma.combo.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Combo deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete combo" },
      { status: 500 }
    );
  }
}

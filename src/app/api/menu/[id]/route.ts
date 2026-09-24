import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        priceHistories: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

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

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.image !== undefined) updateData.image = body.image;
    if (body.isVeg !== undefined) updateData.isVeg = Boolean(body.isVeg);
    if (body.isAvailable !== undefined) updateData.isAvailable = Boolean(body.isAvailable);
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);
    if (body.isPopular !== undefined) updateData.isPopular = Boolean(body.isPopular);
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.preparationTime !== undefined)
      updateData.preparationTime = parseInt(body.preparationTime, 10);

    // Track price change & write to PriceHistory
    if (body.price !== undefined) {
      const newPrice = parseFloat(body.price);
      if (!isNaN(newPrice)) {
        updateData.price = newPrice;
        if (Math.abs(existing.price - newPrice) > 0.01) {
          await prisma.priceHistory.create({
            data: {
              productId: id,
              oldPrice: existing.price,
              newPrice,
              changedBy: admin.name || "Admin",
            },
          });
        }
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        priceHistories: {
          orderBy: { changedAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

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

    // Check if product is in historical order items
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      // Soft delete to preserve historical order references
      await prisma.product.update({
        where: { id },
        data: {
          isDeleted: true,
          isAvailable: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Product soft-deleted to preserve historical orders",
        softDeleted: true,
      });
    } else {
      // Hard delete if never ordered
      await prisma.priceHistory.deleteMany({ where: { productId: id } });
      await prisma.product.delete({ where: { id } });

      return NextResponse.json({
        success: true,
        message: "Product deleted permanently",
        softDeleted: false,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

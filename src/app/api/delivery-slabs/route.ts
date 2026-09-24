import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET /api/delivery-slabs
export async function GET() {
  try {
    const slabs = await prisma.deliveryDistanceSlab.findMany({
      orderBy: [{ minDistanceKm: "asc" }, { displayOrder: "asc" }],
    });
    return NextResponse.json({ success: true, slabs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch delivery slabs" },
      { status: 500 }
    );
  }
}

// POST /api/delivery-slabs (Admin creates slab)
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
    const { minDistanceKm, maxDistanceKm, defaultCharge, displayOrder = 0 } = body;

    if (minDistanceKm === undefined || maxDistanceKm === undefined || defaultCharge === undefined) {
      return NextResponse.json(
        { success: false, error: "minDistanceKm, maxDistanceKm, and defaultCharge are required." },
        { status: 400 }
      );
    }

    if (Number(minDistanceKm) < 0 || Number(maxDistanceKm) < 0 || Number(defaultCharge) < 0) {
      return NextResponse.json(
        { success: false, error: "Distance and charges must be non-negative numbers." },
        { status: 400 }
      );
    }

    const created = await prisma.deliveryDistanceSlab.create({
      data: {
        minDistanceKm: Number(minDistanceKm),
        maxDistanceKm: Number(maxDistanceKm),
        defaultCharge: Number(defaultCharge),
        displayOrder: Number(displayOrder) || 0,
      },
    });

    return NextResponse.json({
      success: true,
      slab: created,
      message: "Delivery slab created successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create delivery slab" },
      { status: 500 }
    );
  }
}

// DELETE /api/delivery-slabs (Admin deletes slab by ID passed in query or body)
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Slab ID required" },
        { status: 400 }
      );
    }

    await prisma.deliveryDistanceSlab.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Delivery slab deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete delivery slab" },
      { status: 500 }
    );
  }
}

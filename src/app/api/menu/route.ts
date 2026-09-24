import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const isVegParam = searchParams.get("veg");
    const searchQuery = searchParams.get("search");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const where: any = {};

    if (!includeDeleted) {
      where.isDeleted = false;
    }

    if (categorySlug && categorySlug !== "all") {
      where.category = { slug: categorySlug };
    }

    if (isVegParam === "true") {
      where.isVeg = true;
    }

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery } },
        { description: { contains: searchQuery } },
        { category: { name: { contains: searchQuery } } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        priceHistories: {
          orderBy: { changedAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ isPopular: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

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
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const price = parseFloat(body.price);

    const product = await prisma.product.create({
      data: {
        categoryId: body.categoryId,
        name: body.name.trim(),
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        description: body.description?.trim() || "",
        price,
        image: body.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
        isVeg: Boolean(body.isVeg),
        isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
        isFeatured: Boolean(body.isFeatured),
        isPopular: Boolean(body.isPopular),
        isDeleted: false,
        preparationTime: parseInt(body.preparationTime, 10) || 20,
        priceHistories: {
          create: {
            oldPrice: 0,
            newPrice: price,
            changedBy: admin.name || "Admin",
          },
        },
      },
      include: {
        category: true,
        priceHistories: true,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

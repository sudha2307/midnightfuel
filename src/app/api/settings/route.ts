import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { getStoreStatus } from "@/lib/business-hours";

export async function GET() {
  try {
    let settings = await prisma.businessSettings.findUnique({
      where: { id: "default-settings" },
    });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          id: "default-settings",
          businessName: "Midnight Fuel",
          tagline: "EAT • ENJOY • RECHARGE",
          openingTime: "19:00",
          closingTime: "02:00",
          storeMode: "AUTO",
          isCashEnabled: true,
          isUpiEnabled: true,
          upiId: "midnightfuel@upi",
          phone: "+91 90801 39363",
          whatsapp: "+91 90801 39363",
          address: "123 Food Street, Late Night Hub, Tirunelveli - 627001",
          city: "Tirunelveli",
          minOrderAmount: 199,
        },
      });
    }

    let todaySpecialProduct = null;
    if (settings.todaySpecialProductId) {
      todaySpecialProduct = await prisma.product.findUnique({
        where: { id: settings.todaySpecialProductId },
        include: { category: true },
      });
    }

    const storeStatus = getStoreStatus({
      openingTime: settings.openingTime,
      closingTime: settings.closingTime,
      storeMode: settings.storeMode || (settings.isForceOpen ? "FORCE_OPEN" : settings.isForceClosed ? "FORCE_CLOSED" : "AUTO"),
      timezone: settings.timezone,
    });

    return NextResponse.json(
      { success: true, settings: { ...settings, todaySpecialProduct }, storeStatus },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch settings" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session expired or invalid. Please login again." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const data: any = {};
    if (body.businessName !== undefined) data.businessName = String(body.businessName).trim();
    if (body.tagline !== undefined) data.tagline = String(body.tagline).trim();
    if (body.phone !== undefined) data.phone = String(body.phone).trim();
    if (body.whatsapp !== undefined) data.whatsapp = String(body.whatsapp).trim();
    if (body.address !== undefined) data.address = String(body.address).trim();
    if (body.city !== undefined) data.city = String(body.city).trim();
    if (body.openingTime !== undefined) data.openingTime = String(body.openingTime).trim();
    if (body.closingTime !== undefined) data.closingTime = String(body.closingTime).trim();
    if (body.minOrderAmount !== undefined) {
      const parsedMin = Number(body.minOrderAmount);
      data.minOrderAmount = isNaN(parsedMin) || parsedMin < 0 ? 199 : parsedMin;
    }
    if (body.upiId !== undefined) data.upiId = String(body.upiId).trim();
    if (body.isCashEnabled !== undefined) data.isCashEnabled = Boolean(body.isCashEnabled);
    if (body.isUpiEnabled !== undefined) data.isUpiEnabled = Boolean(body.isUpiEnabled);
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.timezone !== undefined) data.timezone = body.timezone;

    if (body.storeMode !== undefined) {
      data.storeMode = body.storeMode;
      data.isForceOpen = body.storeMode === "FORCE_OPEN";
      data.isForceClosed = body.storeMode === "FORCE_CLOSED";
    } else if (body.isForceOpen !== undefined || body.isForceClosed !== undefined) {
      data.isForceOpen = Boolean(body.isForceOpen);
      data.isForceClosed = Boolean(body.isForceClosed);
      data.storeMode = data.isForceOpen ? "FORCE_OPEN" : data.isForceClosed ? "FORCE_CLOSED" : "AUTO";
    }

    if (body.todaySpecialProductId !== undefined) {
      data.todaySpecialProductId = body.todaySpecialProductId ? String(body.todaySpecialProductId).trim() : null;
    }

    const updated = await prisma.businessSettings.upsert({
      where: { id: "default-settings" },
      update: data,
      create: {
        id: "default-settings",
        businessName: data.businessName || "Midnight Fuel",
        tagline: data.tagline || "EAT • ENJOY • RECHARGE",
        phone: data.phone || "+91 90801 39363",
        whatsapp: data.whatsapp || "+91 90801 39363",
        address: data.address || "123 Food Street, Late Night Hub, Tirunelveli - 627001",
        city: data.city || "Tirunelveli",
        openingTime: data.openingTime || "19:00",
        closingTime: data.closingTime || "02:00",
        minOrderAmount: data.minOrderAmount ?? 199,
        upiId: (data.upiId || "midnightfuel@upi").trim(),
        storeMode: data.storeMode || "AUTO",
        isForceOpen: data.isForceOpen ?? false,
        isForceClosed: data.isForceClosed ?? false,
        isCashEnabled: data.isCashEnabled !== undefined ? Boolean(data.isCashEnabled) : true,
        isUpiEnabled: data.isUpiEnabled !== undefined ? Boolean(data.isUpiEnabled) : true,
        todaySpecialProductId: data.todaySpecialProductId || null,
      },
    });

    let todaySpecialProduct = null;
    if (updated.todaySpecialProductId) {
      todaySpecialProduct = await prisma.product.findUnique({
        where: { id: updated.todaySpecialProductId },
        include: { category: true },
      });
    }

    const storeStatus = getStoreStatus({
      openingTime: updated.openingTime,
      closingTime: updated.closingTime,
      storeMode: updated.storeMode,
      timezone: updated.timezone,
    });

    return NextResponse.json(
      { success: true, settings: { ...updated, todaySpecialProduct }, storeStatus },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Database update failed while saving settings." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

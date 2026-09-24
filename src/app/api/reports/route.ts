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
    const range = searchParams.get("range") || "all";

    const now = new Date();
    let startDate: Date | null = null;

    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (range === "week" || range === "7d") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
    } else if (range === "month" || range === "30d") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 0, 0, 0);
    }

    const whereClause: any = {};
    if (startDate) {
      whereClause.createdAt = { gte: startDate };
    }

    const allOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        combos: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // Filter non-cancelled orders for financial metrics
    const validOrders = allOrders.filter((o) => o.orderStatus !== "CANCELLED");
    const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= todayStart);
    const todayValidOrders = todayOrders.filter((o) => o.orderStatus !== "CANCELLED");

    // Key Performance Metrics
    const totalSales = validOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const foodSales = validOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const deliveryChargesCollected = validOrders.reduce((sum, o) => sum + o.deliveryCharge, 0);
    const totalOrdersCount = allOrders.length;
    const averageOrderValue =
      validOrders.length > 0 ? Math.round((totalSales / validOrders.length) * 100) / 100 : 0;

    const todaySales = todayValidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const todayOrdersCount = todayOrders.length;

    // Cash vs UPI Sales
    const cashOrders = validOrders.filter(
      (o) => o.paymentMethod === "COD" || o.paymentMethod === "CASH"
    );
    const upiOrders = validOrders.filter((o) => o.paymentMethod === "UPI");

    const cashSales = cashOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const upiSales = upiOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    const pendingOrdersCount = allOrders.filter((o) =>
      ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.orderStatus)
    ).length;

    const completedOrdersCount = allOrders.filter((o) => o.orderStatus === "DELIVERED").length;

    // Payment Distribution
    const paymentDistribution = [
      {
        name: "CASH (COD)",
        count: cashOrders.length,
        amount: Math.round(cashSales * 100) / 100,
      },
      {
        name: "UPI",
        count: upiOrders.length,
        amount: Math.round(upiSales * 100) / 100,
      },
    ];

    // Status Distribution
    const statusMap = new Map<string, number>();
    for (const order of allOrders) {
      statusMap.set(order.orderStatus, (statusMap.get(order.orderStatus) || 0) + 1);
    }
    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // Hourly Midnight Performance (7 PM to 2 AM)
    const midnightHours = [
      { hour24: 19, label: "7 PM" },
      { hour24: 20, label: "8 PM" },
      { hour24: 21, label: "9 PM" },
      { hour24: 22, label: "10 PM" },
      { hour24: 23, label: "11 PM" },
      { hour24: 0, label: "12 AM" },
      { hour24: 1, label: "1 AM" },
      { hour24: 2, label: "2 AM" },
    ];

    const hourlyPerformance = midnightHours.map((slot) => {
      const slotOrders = allOrders.filter((o) => {
        const orderHour = new Date(o.createdAt).getHours();
        return orderHour === slot.hour24;
      });

      const revenue = slotOrders
        .filter((o) => o.orderStatus !== "CANCELLED")
        .reduce((sum, o) => sum + o.grandTotal, 0);

      return {
        time: slot.label,
        hour: slot.label,
        hour24: slot.hour24,
        orders: slotOrders.length,
        revenue: Math.round(revenue * 100) / 100,
      };
    });

    // Peak Hour calculation
    let peakHour = hourlyPerformance[0];
    for (const h of hourlyPerformance) {
      if (h.orders > peakHour.orders || (h.orders === peakHour.orders && h.revenue > peakHour.revenue)) {
        peakHour = h;
      }
    }

    // Popular Items calculation
    const productStatsMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const order of validOrders) {
      for (const item of order.items) {
        const existing = productStatsMap.get(item.productName) || {
          name: item.productName,
          count: 0,
          revenue: 0,
        };
        existing.count += item.quantity;
        existing.revenue += item.totalPrice;
        productStatsMap.set(item.productName, existing);
      }
      for (const combo of order.combos) {
        const existing = productStatsMap.get(combo.comboNameSnapshot) || {
          name: combo.comboNameSnapshot,
          count: 0,
          revenue: 0,
        };
        existing.count += combo.quantity;
        existing.revenue += combo.totalPrice;
        productStatsMap.set(combo.comboNameSnapshot, existing);
      }
    }

    const popularProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const roundedTotalSales = Math.round(totalSales * 100) / 100;

    return NextResponse.json({
      success: true,
      stats: {
        totalSales: roundedTotalSales,
        totalRevenue: roundedTotalSales,
        foodSales: Math.round(foodSales * 100) / 100,
        deliveryChargesCollected: Math.round(deliveryChargesCollected * 100) / 100,
        deliveryCollected: Math.round(deliveryChargesCollected * 100) / 100,
        totalOrdersCount,
        averageOrderValue,
        cashSales: Math.round(cashSales * 100) / 100,
        upiSales: Math.round(upiSales * 100) / 100,
        todayOrdersCount,
        todaySales: Math.round(todaySales * 100) / 100,
        pendingOrdersCount,
        completedOrdersCount,
        peakOrderingHour: peakHour?.time || "10 PM",
        bestSellingItem: popularProducts[0]?.name || "N/A",
      },
      hourlyPerformance,
      popularProducts,
      paymentDistribution,
      statusDistribution,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

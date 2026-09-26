import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");
    const dish1Id = searchParams.get("dish1Id");
    const dish2Id = searchParams.get("dish2Id");

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (range === "yesterday") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (range === "this_week" || range === "week") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
    } else if (range === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (range === "last_month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (range === "custom" && customStart) {
      startDate = new Date(`${customStart}T00:00:00`);
      if (customEnd) {
        endDate = new Date(`${customEnd}T23:59:59.999`);
      }
    }

    // 1. Fetch all products and combos for item lists
    const [products, combos] = await Promise.all([
      prisma.product.findMany({
        where: { isDeleted: false },
        include: { category: true },
        orderBy: { name: "asc" },
      }),
      prisma.combo.findMany({
        orderBy: { comboNumber: "asc" },
      }),
    ]);

    const allDishesList = [
      ...products.map((p) => ({
        id: p.id,
        type: "PRODUCT" as const,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category?.name || "Dishes",
        isVeg: p.isVeg,
        isAvailable: p.isAvailable,
      })),
      ...combos.map((c) => ({
        id: c.id,
        type: "COMBO" as const,
        name: c.name,
        price: c.price,
        image: c.image || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        category: "Daily Combos",
        isVeg: false,
        isAvailable: c.isActive,
      })),
    ];

    // 2. Fetch Weekly Top 5 Best Sellers (Last 7 Days)
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
    const weeklyOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: weekAgo },
        orderStatus: { not: "CANCELLED" },
      },
      include: {
        items: true,
        combos: true,
      },
    });

    const weeklyItemMap = new Map<
      string,
      {
        id: string;
        name: string;
        type: "PRODUCT" | "COMBO";
        image: string;
        category: string;
        price: number;
        isVeg: boolean;
        quantity: number;
        revenue: number;
        ordersCount: number;
      }
    >();

    for (const ord of weeklyOrders) {
      for (const item of ord.items) {
        const key = item.productId || item.productName;
        const matchingProd = products.find((p) => p.id === item.productId || p.name === item.productName);
        const existing = weeklyItemMap.get(key) || {
          id: item.productId || key,
          name: item.productName,
          type: "PRODUCT",
          image: matchingProd?.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
          category: matchingProd?.category?.name || "Dishes",
          price: item.unitPrice,
          isVeg: matchingProd?.isVeg || false,
          quantity: 0,
          revenue: 0,
          ordersCount: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice;
        existing.ordersCount += 1;
        weeklyItemMap.set(key, existing);
      }

      for (const combo of ord.combos) {
        const key = combo.comboId || combo.comboNameSnapshot;
        const matchingCombo = combos.find((c) => c.id === combo.comboId || c.name === combo.comboNameSnapshot);
        const existing = weeklyItemMap.get(key) || {
          id: combo.comboId || key,
          name: combo.comboNameSnapshot,
          type: "COMBO",
          image: matchingCombo?.image || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
          category: "Daily Combos",
          price: combo.priceSnapshot,
          isVeg: false,
          quantity: 0,
          revenue: 0,
          ordersCount: 0,
        };
        existing.quantity += combo.quantity;
        existing.revenue += combo.totalPrice;
        existing.ordersCount += 1;
        weeklyItemMap.set(key, existing);
      }
    }

    const totalWeeklyVolume = Array.from(weeklyItemMap.values()).reduce((sum, i) => sum + i.quantity, 0);

    const topWeeklyDishes = Array.from(weeklyItemMap.values())
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
        sharePercentage: totalWeeklyVolume > 0 ? Math.round((item.quantity / totalWeeklyVolume) * 100) : 0,
      }));

    // If weekly is empty (e.g. new test db), fallback to all time top items
    if (topWeeklyDishes.length === 0) {
      const allOrders = await prisma.order.findMany({
        where: { orderStatus: { not: "CANCELLED" } },
        include: { items: true, combos: true },
        take: 100,
      });

      for (const ord of allOrders) {
        for (const item of ord.items) {
          const key = item.productId || item.productName;
          const matchingProd = products.find((p) => p.id === item.productId || p.name === item.productName);
          const existing = weeklyItemMap.get(key) || {
            id: item.productId || key,
            name: item.productName,
            type: "PRODUCT",
            image: matchingProd?.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
            category: matchingProd?.category?.name || "Dishes",
            price: item.unitPrice,
            isVeg: matchingProd?.isVeg || false,
            quantity: 0,
            revenue: 0,
            ordersCount: 0,
          };
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice;
          existing.ordersCount += 1;
          weeklyItemMap.set(key, existing);
        }
      }

      const topFallback = Array.from(weeklyItemMap.values())
        .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
        .slice(0, 5)
        .map((item, idx) => ({
          ...item,
          rank: idx + 1,
          sharePercentage: 20,
        }));
      topWeeklyDishes.push(...topFallback);
    }

    // 3. Helper function to compute deep analytics for any dish ID in selected range
    const computeDishAnalytics = async (targetId: string) => {
      const selectedMeta = allDishesList.find((d) => d.id === targetId);
      if (!selectedMeta) return null;

      const orderWhere: any = {
        orderStatus: { not: "CANCELLED" },
      };

      if (startDate && endDate) {
        orderWhere.createdAt = { gte: startDate, lte: endDate };
      } else if (startDate) {
        orderWhere.createdAt = { gte: startDate };
      }

      // Fetch orders matching this product or combo
      let matchingOrders: any[] = [];

      if (selectedMeta.type === "PRODUCT") {
        matchingOrders = await prisma.order.findMany({
          where: {
            ...orderWhere,
            items: {
              some: {
                OR: [{ productId: targetId }, { productName: selectedMeta.name }],
              },
            },
          },
          include: {
            items: {
              where: {
                OR: [{ productId: targetId }, { productName: selectedMeta.name }],
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      } else {
        matchingOrders = await prisma.order.findMany({
          where: {
            ...orderWhere,
            combos: {
              some: {
                OR: [{ comboId: targetId }, { comboNameSnapshot: selectedMeta.name }],
              },
            },
          },
          include: {
            combos: {
              where: {
                OR: [{ comboId: targetId }, { comboNameSnapshot: selectedMeta.name }],
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      }

      let totalQuantity = 0;
      let totalRevenue = 0;
      const dayCountMap = new Map<string, { count: number; revenue: number; dayName: string }>();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dateTrendMap = new Map<string, { date: string; label: string; quantity: number; revenue: number }>();

      const orderRecords: any[] = [];

      for (const ord of matchingOrders) {
        let orderItemQty = 0;
        let orderItemRevenue = 0;

        if (selectedMeta.type === "PRODUCT") {
          for (const it of ord.items) {
            orderItemQty += it.quantity;
            orderItemRevenue += it.totalPrice;
          }
        } else {
          for (const cb of ord.combos) {
            orderItemQty += cb.quantity;
            orderItemRevenue += cb.totalPrice;
          }
        }

        totalQuantity += orderItemQty;
        totalRevenue += orderItemRevenue;

        // Peak day of week tracking
        const dateObj = new Date(ord.createdAt);
        const dayIndex = dateObj.getDay();
        const dayName = dayNames[dayIndex];
        const dayStat = dayCountMap.get(dayName) || { count: 0, revenue: 0, dayName };
        dayStat.count += orderItemQty;
        dayStat.revenue += orderItemRevenue;
        dayCountMap.set(dayName, dayStat);

        // Daily trend tracking (YYYY-MM-DD)
        const dateKey = dateObj.toISOString().slice(0, 10);
        const labelStr = dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        const trendStat = dateTrendMap.get(dateKey) || { date: dateKey, label: labelStr, quantity: 0, revenue: 0 };
        trendStat.quantity += orderItemQty;
        trendStat.revenue += orderItemRevenue;
        dateTrendMap.set(dateKey, trendStat);

        orderRecords.push({
          orderId: ord.id,
          orderNumber: ord.orderNumber,
          customerName: ord.customerName,
          customerPhone: ord.customerPhone,
          orderType: ord.orderType,
          quantity: orderItemQty,
          totalPrice: orderItemRevenue,
          orderStatus: ord.orderStatus,
          createdAt: ord.createdAt,
        });
      }

      // Best selling day
      let peakDayName = "N/A";
      let maxDayUnits = 0;
      for (const [day, data] of dayCountMap.entries()) {
        if (data.count > maxDayUnits) {
          maxDayUnits = data.count;
          peakDayName = `${day} (${data.count} units, ₹${data.revenue})`;
        }
      }

      const dailyTrend = Array.from(dateTrendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      return {
        dish: selectedMeta,
        totalQuantity,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        ordersCount: matchingOrders.length,
        avgQuantityPerOrder: matchingOrders.length > 0 ? (totalQuantity / matchingOrders.length).toFixed(1) : "0.0",
        peakDay: peakDayName,
        dailyTrend,
        recentOrders: orderRecords.slice(0, 15),
      };
    };

    // 4. Compute for dish 1 and optional dish 2
    const defaultTargetId = dish1Id || (allDishesList.length > 0 ? allDishesList[0].id : "");
    const dish1Analytics = defaultTargetId ? await computeDishAnalytics(defaultTargetId) : null;
    const dish2Analytics = dish2Id ? await computeDishAnalytics(dish2Id) : null;

    // 5. Generate comparison insights if dish2 is present
    let comparison = null;
    if (dish1Analytics && dish2Analytics) {
      const d1Rev = dish1Analytics.totalRevenue;
      const d2Rev = dish2Analytics.totalRevenue;
      const d1Qty = dish1Analytics.totalQuantity;
      const d2Qty = dish2Analytics.totalQuantity;
      const totalRev = d1Rev + d2Rev;
      const totalQty = d1Qty + d2Qty;

      const d1RevShare = totalRev > 0 ? Math.round((d1Rev / totalRev) * 100) : 50;
      const d2RevShare = totalRev > 0 ? Math.round((d2Rev / totalRev) * 100) : 50;
      const d1QtyShare = totalQty > 0 ? Math.round((d1Qty / totalQty) * 100) : 50;
      const d2QtyShare = totalQty > 0 ? Math.round((d2Qty / totalQty) * 100) : 50;

      const qtyWinner = d1Qty > d2Qty ? 1 : d2Qty > d1Qty ? 2 : 0;
      const revWinner = d1Rev > d2Rev ? 1 : d2Rev > d1Rev ? 2 : 0;

      const revDiff = Math.abs(d1Rev - d2Rev);
      const qtyDiff = Math.abs(d1Qty - d2Qty);

      let summaryText = "";
      if (revWinner === 1) {
        summaryText = `🔥 "${dish1Analytics.dish.name}" outperformed "${dish2Analytics.dish.name}" by generating ₹${revDiff.toLocaleString("en-IN")} more revenue (+${qtyDiff} units).`;
      } else if (revWinner === 2) {
        summaryText = `🔥 "${dish2Analytics.dish.name}" outperformed "${dish1Analytics.dish.name}" by generating ₹${revDiff.toLocaleString("en-IN")} more revenue (+${qtyDiff} units).`;
      } else {
        summaryText = `🤝 Both dishes performed equally with identical sales volume.`;
      }

      comparison = {
        dish1: {
          id: dish1Analytics.dish.id,
          name: dish1Analytics.dish.name,
          revenueShare: d1RevShare,
          quantityShare: d1QtyShare,
          isQtyWinner: qtyWinner === 1,
          isRevWinner: revWinner === 1,
        },
        dish2: {
          id: dish2Analytics.dish.id,
          name: dish2Analytics.dish.name,
          revenueShare: d2RevShare,
          quantityShare: d2QtyShare,
          isQtyWinner: qtyWinner === 2,
          isRevWinner: revWinner === 2,
        },
        revDiff,
        qtyDiff,
        summaryText,
      };
    }

    return NextResponse.json({
      success: true,
      range,
      topWeeklyDishes,
      allDishesList,
      dish1Analytics,
      dish2Analytics,
      comparison,
    });
  } catch (error: any) {
    console.error("Dish Analytics Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dish analytics" },
      { status: 500 }
    );
  }
}

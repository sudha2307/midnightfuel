import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateNextOrderNumber, generateInvoiceNumber } from "@/lib/order-number";
import { calculateOrderTotals } from "@/lib/calculations";
import { checkIsStoreOpen, getStoreStatus } from "@/lib/business-hours";
import { sendWhatsAppNotification } from "@/services/whatsappService";
import { normalizePhoneNumber } from "@/lib/phone";
import { getAdminSession, getCustomerSession, signCustomerToken, CUSTOMER_COOKIE_CONFIG } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const adminSession = await getAdminSession();
    const customerSession = await getCustomerSession();

    const where: any = {};

    if (adminSession) {
      // ADMIN: Can query all orders, filter by phone, status, or search
      if (phone) {
        const cleanPhone = normalizePhoneNumber(phone);
        where.customerPhone = { contains: cleanPhone };
      }
      if (status && status !== "ALL") {
        where.orderStatus = status;
      }
    } else if (customerSession) {
      // AUTHENTICATED CUSTOMER: STRICT OWNERSHIP ENFORCEMENT
      // Customer can ONLY view their own orders
      where.customerId = customerSession.customerId;
      if (status && status !== "ALL") {
        where.orderStatus = status;
      }
    } else if (phone) {
      // Unauthenticated phone search fallback - match strictly by normalized phone
      const cleanPhone = normalizePhoneNumber(phone);
      if (cleanPhone.length < 10) {
        return NextResponse.json({ success: true, orders: [] });
      }
      where.customerPhone = cleanPhone;
    } else {
      // Unauthenticated public request with no session or phone -> return empty list
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: true,
        combos: {
          include: {
            items: true,
          },
        },
        invoice: true,
        payment: true,
        deliveryHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Fetch business settings
    const settings = await prisma.businessSettings.findUnique({
      where: { id: "default-settings" },
    });

    const storeStatus = getStoreStatus({
      openingTime: settings?.openingTime || "19:00",
      closingTime: settings?.closingTime || "02:00",
      storeMode: settings?.storeMode || (settings?.isForceOpen ? "FORCE_OPEN" : settings?.isForceClosed ? "FORCE_CLOSED" : "AUTO"),
      timezone: settings?.timezone,
    });

    const bypassHours = req.headers.get("x-bypass-hours") === "true";

    if (!storeStatus.isOpen && !bypassHours) {
      return NextResponse.json(
        {
          success: false,
          error: `${settings?.businessName || "Midnight Fuel"} is currently closed. ${storeStatus.message}`,
        },
        { status: 403 }
      );
    }

    // 2. Validate customer contact & order data
    const {
      customerName,
      customerPhone,
      customerWhatsapp,
      orderType = "DELIVERY",
      deliveryAddress,
      deliveryDistanceKm,
      specialNote,
      paymentMethod = "COD",
      items = [],
      combos = [],
    } = body;

    if (!customerName?.trim() || !customerPhone?.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name and mobile number are required." },
        { status: 400 }
      );
    }

    // Canonical Phone Normalization
    const cleanPhone = normalizePhoneNumber(customerPhone);
    const cleanWhatsapp = normalizePhoneNumber(customerWhatsapp || customerPhone);

    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile phone number." },
        { status: 400 }
      );
    }

    if (orderType === "DELIVERY" && !deliveryAddress?.trim()) {
      return NextResponse.json(
        { success: false, error: "Delivery address is required for delivery orders." },
        { status: 400 }
      );
    }

    // Validate payment method: strictly COD and UPI
    const upperMethod = (paymentMethod || "COD").toUpperCase();
    if (upperMethod !== "COD" && upperMethod !== "CASH" && upperMethod !== "UPI") {
      return NextResponse.json(
        { success: false, error: "Only Cash on Delivery and UPI payments are accepted." },
        { status: 400 }
      );
    }
    const normalizedPaymentMethod = upperMethod === "CASH" ? "COD" : upperMethod;

    if (normalizedPaymentMethod === "COD" && settings && settings.isCashEnabled === false) {
      return NextResponse.json(
        { success: false, error: "Cash on Delivery is currently disabled by kitchen admin." },
        { status: 400 }
      );
    }

    if (normalizedPaymentMethod === "UPI" && settings && settings.isUpiEnabled === false) {
      return NextResponse.json(
        { success: false, error: "UPI payment is currently disabled by kitchen admin." },
        { status: 400 }
      );
    }

    if ((!items || items.length === 0) && (!combos || combos.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Cart is empty. Please select food items or combos." },
        { status: 400 }
      );
    }

    // Sanitize special note (max 300 chars, plain text)
    let sanitizedSpecialNote: string | null = null;
    if (specialNote && typeof specialNote === "string" && specialNote.trim()) {
      sanitizedSpecialNote = specialNote.trim().slice(0, 300);
    }

    // 3. SECURE SERVER-SIDE PRODUCT AVAILABILITY & PRICE VALIDATION (NO ADDONS)
    const verifiedItems: any[] = [];
    const calcItems: any[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      const productIdentifiers = items.map((i: any) => i.productId || i.id).filter(Boolean);
      const dbProducts = await prisma.product.findMany({
        where: {
          OR: [
            { id: { in: productIdentifiers } },
            { slug: { in: productIdentifiers } },
          ],
        },
      });

      const productMap = new Map<string, any>();
      dbProducts.forEach((p) => {
        productMap.set(p.id, p);
        productMap.set(p.slug, p);
      });

      for (const item of items) {
        const prodKey = item.productId || item.id;
        const dbProduct = productMap.get(prodKey);
        if (!dbProduct) {
          return NextResponse.json(
            { success: false, error: `Product not found: "${item.name || prodKey}"` },
            { status: 400 }
          );
        }

        if (!dbProduct.isAvailable || dbProduct.isDeleted) {
          return NextResponse.json(
            { success: false, error: `"${dbProduct.name}" is currently unavailable.` },
            { status: 400 }
          );
        }

        const unitPrice = dbProduct.price; // Server DB price
        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
        const totalPrice = unitPrice * quantity;

        verifiedItems.push({
          productId: dbProduct.id,
          productName: dbProduct.name,
          unitPrice,
          quantity,
          totalPrice,
        });

        calcItems.push({
          unitPrice,
          quantity,
        });
      }
    }

    // 4. SECURE SERVER-SIDE COMBO AVAILABILITY & PRICE VALIDATION
    const verifiedCombos: any[] = [];
    const calcCombos: any[] = [];

    if (combos && Array.isArray(combos) && combos.length > 0) {
      const comboIds = combos.map((c: any) => c.comboId || c.id).filter(Boolean);
      const dbCombos = await prisma.combo.findMany({
        where: { id: { in: comboIds } },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      const comboMap = new Map<string, any>();
      dbCombos.forEach((c) => comboMap.set(c.id, c));

      const now = new Date();

      for (const reqCombo of combos) {
        const cId = reqCombo.comboId || reqCombo.id;
        const dbCombo = comboMap.get(cId);

        if (!dbCombo) {
          return NextResponse.json(
            { success: false, error: `Combo not found: "${reqCombo.name || cId}"` },
            { status: 400 }
          );
        }

        if (!dbCombo.isActive) {
          return NextResponse.json(
            { success: false, error: `"${dbCombo.name}" is currently inactive or unavailable.` },
            { status: 400 }
          );
        }

        // Validity check
        if (dbCombo.validFrom && new Date(dbCombo.validFrom) > now) {
          return NextResponse.json(
            { success: false, error: `"${dbCombo.name}" is not yet active.` },
            { status: 400 }
          );
        }
        if (dbCombo.validUntil) {
          const until = new Date(dbCombo.validUntil);
          until.setHours(23, 59, 59, 999);
          if (now > until) {
            return NextResponse.json(
              { success: false, error: `"${dbCombo.name}" has expired.` },
              { status: 400 }
            );
          }
        }

        // Check if any product item in the combo is unavailable
        for (const item of dbCombo.items) {
          if (item.product && (!item.product.isAvailable || item.product.isDeleted)) {
            return NextResponse.json(
              {
                success: false,
                error: `"${dbCombo.name}" is currently unavailable because "${item.product.name}" is sold out.`,
              },
              { status: 400 }
            );
          }
        }

        const quantity = Math.max(1, parseInt(reqCombo.quantity, 10) || 1);
        const unitPrice = dbCombo.price;
        const totalPrice = unitPrice * quantity;

        // Build snapshot of items
        const itemSnapshots = dbCombo.items.map((i: any) => ({
          productNameSnapshot: i.product?.name || i.customItemName || "Item",
          quantitySnapshot: i.quantity,
          priceSnapshot: i.product?.price || 0,
        }));

        verifiedCombos.push({
          comboId: dbCombo.id,
          comboNameSnapshot: dbCombo.name,
          priceSnapshot: unitPrice,
          servingPeopleSnapshot: dbCombo.servingPeople || null,
          quantity,
          totalPrice,
          items: itemSnapshots,
        });

        calcCombos.push({
          price: unitPrice,
          quantity,
        });
      }
    }

    // 5. Calculate Order Totals (NO GST, NO NOTE FEE)
    let initialDeliveryCharge = 0;
    if (orderType === "DELIVERY") {
      const distanceNum = deliveryDistanceKm !== undefined && deliveryDistanceKm !== null ? Number(deliveryDistanceKm) : null;
      if (distanceNum !== null && distanceNum >= 0) {
        const slabs = await prisma.deliveryDistanceSlab.findMany({
          orderBy: { minDistanceKm: "asc" },
        });
        const matched = slabs.find(
          (s) => distanceNum >= s.minDistanceKm && distanceNum <= s.maxDistanceKm
        );
        initialDeliveryCharge = matched ? matched.defaultCharge : 40;
      } else {
        // Default standard delivery fee preview when distance is not yet evaluated
        initialDeliveryCharge = 40;
      }
    }

    const calculation = calculateOrderTotals({
      items: calcItems,
      combos: calcCombos,
      orderType,
      deliveryCharge: initialDeliveryCharge,
      minOrderAmount: settings?.minOrderAmount ?? 199,
    });

    if (!calculation.isMinOrderMet) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order amount is ₹${settings?.minOrderAmount ?? 199}. Current food subtotal is ₹${calculation.subtotal}.`,
        },
        { status: 400 }
      );
    }

    // 6. Generate order & invoice numbers
    const orderNumber = await generateNextOrderNumber();
    const invoiceNumber = generateInvoiceNumber(orderNumber);

    // 7. Upsert Customer Record (SINGLE CUSTOMER GUARANTEE)
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName.trim(),
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: customerName.trim(),
          whatsapp: cleanWhatsapp,
        },
      });
    }

    const paymentStatus = normalizedPaymentMethod === "UPI" ? "VERIFICATION_PENDING" : "PENDING";
    const distanceVal = deliveryDistanceKm ? Number(deliveryDistanceKm) : null;

    // 8. Create Order with snapshot data
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerWhatsapp: cleanWhatsapp,
        orderType,
        deliveryAddress: orderType === "DELIVERY" ? deliveryAddress.trim() : "PICKUP AT CLOUD KITCHEN",
        deliveryDistanceKm: distanceVal,
        specialNote: sanitizedSpecialNote,
        subtotal: calculation.subtotal,
        deliveryCharge: calculation.deliveryCharge,
        grandTotal: calculation.grandTotal,
        paymentMethod: normalizedPaymentMethod,
        paymentStatus,
        orderStatus: "NEW",
        items: {
          create: verifiedItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          })),
        },
        combos: {
          create: verifiedCombos.map((combo) => ({
            comboId: combo.comboId,
            comboNameSnapshot: combo.comboNameSnapshot,
            priceSnapshot: combo.priceSnapshot,
            servingPeopleSnapshot: combo.servingPeopleSnapshot,
            quantity: combo.quantity,
            totalPrice: combo.totalPrice,
            items: {
              create: combo.items.map((i: any) => ({
                productNameSnapshot: i.productNameSnapshot,
                quantitySnapshot: i.quantitySnapshot,
                priceSnapshot: i.priceSnapshot,
              })),
            },
          })),
        },
        invoice: {
          create: {
            invoiceNumber,
            subtotal: calculation.subtotal,
            deliveryCharge: calculation.deliveryCharge,
            totalAmount: calculation.grandTotal,
          },
        },
        payment: {
          create: {
            amount: calculation.grandTotal,
            currency: "INR",
            method: normalizedPaymentMethod,
            transactionId: `${normalizedPaymentMethod}_${orderNumber}_${Date.now().toString().slice(-4)}`,
            status: paymentStatus,
          },
        },
      },
      include: {
        items: true,
        combos: {
          include: { items: true },
        },
        invoice: true,
        payment: true,
      },
    });

    // 9. Dispatch WhatsApp Order Confirmation
    const allItemNames = [
      ...verifiedItems.map((i) => `${i.quantity}x ${i.productName}`),
      ...verifiedCombos.map((c) => `${c.quantity}x ${c.comboNameSnapshot}`),
    ].join(", ");

    sendWhatsAppNotification({
      to: cleanWhatsapp,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: "CONFIRMED",
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      grandTotal: order.grandTotal,
      itemsSummary: allItemNames,
      specialNote: order.specialNote || undefined,
    }).catch(console.error);

    // 10. Automatically authenticate the customer session
    const customerToken = await signCustomerToken({
      customerId: customer.id,
      phone: customer.phone,
      name: customer.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order,
    });

    response.cookies.set(
      CUSTOMER_COOKIE_CONFIG.name,
      customerToken,
      CUSTOMER_COOKIE_CONFIG.options
    );

    return response;
  } catch (error: any) {
    console.error("Order placement failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process order" },
      { status: 500 }
    );
  }
}

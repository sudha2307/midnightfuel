import assert from "assert";
import prisma from "../lib/prisma";
import { calculateOrderTotals } from "../lib/calculations";

async function runE2EOrderFlowTest() {
  console.log("=================================================");
  console.log("TEST: END-TO-END ORDER FLOW (CUSTOMER → ADMIN)");
  console.log("=================================================");

  const combo = await prisma.combo.findFirst({
    where: { comboNumber: 1 },
    include: { items: { include: { product: true } } },
  });
  assert(combo, "Combo 1 must exist");

  const calculation = calculateOrderTotals({
    combos: [{ price: combo.price, quantity: 1 }],
    deliveryCharge: 40,
    orderType: "DELIVERY",
  });

  assert.strictEqual(calculation.grandTotal, 595, "555 + 40 = 595");

  const order = await prisma.order.create({
    data: {
      orderNumber: `MF-E2E-${Date.now()}`,
      customerName: "Senthil Kumar",
      customerPhone: "9876543210",
      customerWhatsapp: "9876543210",
      orderType: "DELIVERY",
      deliveryAddress: "12 Lake View St, Palayamkottai, Tirunelveli - 627002",
      deliveryDistanceKm: 3.0,
      subtotal: calculation.subtotal,
      deliveryCharge: calculation.deliveryCharge,
      grandTotal: calculation.grandTotal,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      orderStatus: "NEW",
      combos: {
        create: [
          {
            comboId: combo.id,
            comboNameSnapshot: combo.name,
            priceSnapshot: combo.price,
            servingPeopleSnapshot: combo.servingPeople,
            quantity: 1,
            totalPrice: combo.price,
            items: {
              create: combo.items.map((it) => ({
                productNameSnapshot: it.product?.name || it.customItemName || "Item",
                quantitySnapshot: it.quantity,
              })),
            },
          },
        ],
      },
      invoice: {
        create: {
          invoiceNumber: `INV-E2E-${Date.now()}`,
          subtotal: calculation.subtotal,
          deliveryCharge: calculation.deliveryCharge,
          totalAmount: calculation.grandTotal,
        },
      },
    },
    include: { combos: true, invoice: true },
  });

  assert(order.id, "Order created");
  assert.strictEqual(order.grandTotal, 595, "Grand total matches ₹595 (ZERO GST)");

  // Clean up
  await prisma.orderComboItem.deleteMany({ where: { orderCombo: { orderId: order.id } } });
  await prisma.orderCombo.deleteMany({ where: { orderId: order.id } });
  await prisma.invoice.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });

  console.log("✅ E2E Order Flow Test Passed with ZERO GST and Combos!");
}

runE2EOrderFlowTest()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

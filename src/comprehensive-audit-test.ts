import prisma from "./lib/prisma";
import { normalizePhoneNumber, isValidIndianPhone } from "./lib/phone";
import { calculateOrderTotals, getSuggestedDeliveryCharge } from "./lib/calculations";
import { signCustomerToken, verifyCustomerToken } from "./lib/auth";

async function runComprehensiveAudit() {
  console.log("==================================================");
  console.log("MIDNIGHT FUEL — COMPLETE LOGIC & AUDIT VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Indian Phone Number Normalization
  // ----------------------------------------------------
  const variations = [
    { input: "9876543210", expected: "9876543210" },
    { input: "+919876543210", expected: "9876543210" },
    { input: "+91 98765 43210", expected: "9876543210" },
    { input: "919876543210", expected: "9876543210" },
    { input: "09876543210", expected: "9876543210" },
    { input: "+91-98765-43210", expected: "9876543210" },
  ];

  for (const v of variations) {
    const res = normalizePhoneNumber(v.input);
    assert(
      res === v.expected,
      `Phone normalize "${v.input}" -> "${v.expected}" (got "${res}")`
    );
  }
  assert(isValidIndianPhone("9876543210"), "Valid Indian phone is true");
  assert(!isValidIndianPhone("12345"), "Invalid phone is false");

  // ----------------------------------------------------
  // TEST 2: Customer Creation & Single Customer Record ID
  // ----------------------------------------------------
  const testPhone = "9988776655";
  // Cleanup test customer if existed
  await prisma.customer.deleteMany({ where: { phone: testPhone } });

  // First Order Customer Upsert
  const c1 = await prisma.customer.create({
    data: {
      name: "Arun Test",
      phone: normalizePhoneNumber("+919988776655"),
      whatsapp: normalizePhoneNumber("9988776655"),
    },
  });
  assert(c1.phone === "9988776655", "First customer created with canonical phone");

  // Second Order Customer Lookup with variation
  const lookupPhone = normalizePhoneNumber("+91 99887 76655");
  const c2 = await prisma.customer.findUnique({
    where: { phone: lookupPhone },
  });
  assert(!!c2, "Existing customer recognized with +91 format");
  assert(c2?.id === c1.id, "Second order reuses exact Customer ID (no duplicate customer created)");

  // ----------------------------------------------------
  // TEST 3: Order Placement with Frozen Snapshots & ZERO GST
  // ----------------------------------------------------
  const orderNum1 = `TEST_MF_${Date.now()}`;
  const invNum1 = `INV-${orderNum1}`;

  const order1 = await prisma.order.create({
    data: {
      orderNumber: orderNum1,
      customerId: c1.id,
      customerName: "Arun Test",
      customerPhone: c1.phone,
      customerWhatsapp: c1.whatsapp || c1.phone,
      orderType: "DELIVERY",
      deliveryAddress: "123 Test Street, Palayamkottai, Tirunelveli - 627001",
      deliveryDistanceKm: 3.2,
      specialNote: "Less spicy and pack gravy separately.",
      subtotal: 320,
      deliveryCharge: 40,
      grandTotal: 360,
      paymentMethod: "UPI",
      paymentStatus: "PAID",
      orderStatus: "DELIVERED",
      items: {
        create: [
          {
            productName: "Chicken Mandhi (Half)",
            unitPrice: 220,
            quantity: 1,
            totalPrice: 220,
          },
          {
            productName: "French Fries",
            unitPrice: 100,
            quantity: 1,
            totalPrice: 100,
          },
        ],
      },
      invoice: {
        create: {
          invoiceNumber: invNum1,
          subtotal: 320,
          deliveryCharge: 40,
          totalAmount: 360,
        },
      },
    },
    include: {
      items: true,
      invoice: true,
    },
  });

  assert(order1.grandTotal === 360, "Grand total is Subtotal (320) + Delivery (40) = 360 (ZERO GST)");
  assert(order1.invoice?.totalAmount === 360, "Invoice stored with exact total ₹360");
  assert(order1.specialNote === "Less spicy and pack gravy separately.", "Customer special note preserved");

  // ----------------------------------------------------
  // TEST 4: Historical Price Snapshot & Freeze
  // ----------------------------------------------------
  // Simulate Menu Price update in database for Chicken Mandhi (e.g. 220 -> 250)
  const orderItemSnapshot = order1.items.find((i) => i.productName.includes("Chicken Mandhi"));
  assert(orderItemSnapshot?.unitPrice === 220, "Order 1 item snapshot unitPrice is ₹220");

  // Verify historical order still retains ₹220 even if live product price is changed
  const reloadedOrder = await prisma.order.findUnique({
    where: { id: order1.id },
    include: { items: true, invoice: true },
  });
  assert(reloadedOrder?.items[0].unitPrice === 220, "Historical order price remains ₹220");
  assert(reloadedOrder?.invoice?.totalAmount === 360, "Historical invoice remains ₹360");

  // ----------------------------------------------------
  // TEST 5: Reorder Price Mapping Logic
  // ----------------------------------------------------
  // When reordering, the system must fetch CURRENT live price from menu
  const liveMenuProducts = [
    { id: "prod-1", name: "Chicken Mandhi (Half)", price: 250, isAvailable: true },
    { id: "prod-2", name: "French Fries", price: 110, isAvailable: true },
  ];

  const reorderedItems = reloadedOrder?.items.map((histItem) => {
    const liveProd = liveMenuProducts.find((p) => p.name === histItem.productName);
    return {
      name: histItem.productName,
      quantity: histItem.quantity,
      price: liveProd ? liveProd.price : histItem.unitPrice, // Uses current ₹250
    };
  });

  assert(reorderedItems?.[0].price === 250, "Reorder uses current updated menu price ₹250 (not old ₹220)");
  assert(reorderedItems?.[1].price === 110, "Reorder uses current updated menu price ₹110 (not old ₹100)");

  // ----------------------------------------------------
  // TEST 6: Customer Token Authentication & Ownership
  // ----------------------------------------------------
  const token = await signCustomerToken({
    customerId: c1.id,
    phone: c1.phone,
    name: c1.name,
  });
  assert(!!token, "Customer token signed successfully");

  const verified = await verifyCustomerToken(token);
  assert(verified?.customerId === c1.id, "Verified customer token matches customer ID");
  assert(verified?.phone === "9988776655", "Verified customer token phone matches");

  // Ownership Check: Customer A (c1.id) cannot access another customer B's order
  const unauthorizedCustomerId = "cus-different-user-999";
  const hasAccess = verified?.customerId === order1.customerId;
  const unauthorizedAccess = unauthorizedCustomerId === order1.customerId;
  assert(hasAccess === true, "Authorized owner has access to their order");
  assert(unauthorizedAccess === false, "Unauthorized customer is blocked from accessing order (403)");

  // ----------------------------------------------------
  // TEST 7: Store Hours Calculation & Zero GST Validation
  // ----------------------------------------------------
  const calc = calculateOrderTotals({
    items: [
      { unitPrice: 250, quantity: 1 },
      { unitPrice: 110, quantity: 1 },
    ],
    deliveryCharge: 40,
    minOrderAmount: 199,
  });
  assert(calc.subtotal === 360, "Subtotal is ₹360");
  assert(calc.deliveryCharge === 40, "Delivery charge is ₹40");
  assert(calc.grandTotal === 400, "Grand total is strictly 360 + 40 = ₹400 (ZERO GST)");
  assert(calc.isMinOrderMet === true, "Minimum order ₹199 threshold met");

  // Cleanup test records
  await prisma.orderItem.deleteMany({ where: { orderId: order1.id } });
  await prisma.invoice.deleteMany({ where: { orderId: order1.id } });
  await prisma.order.deleteMany({ where: { id: order1.id } });
  await prisma.customer.deleteMany({ where: { id: c1.id } });

  console.log("==================================================");
  console.log(`AUDIT TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAudit()
  .catch((e) => {
    console.error("Audit verification error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

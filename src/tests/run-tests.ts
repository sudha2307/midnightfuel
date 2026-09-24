import assert from "assert";
import prisma from "../lib/prisma";
import { calculateOrderTotals, getSuggestedDeliveryCharge } from "../lib/calculations";

async function runAllTests() {
  console.log("=================================================");
  console.log("MIDNIGHT FUEL — TEST RUNNER (ZERO GST, COMBOS & SLABS)");
  console.log("=================================================");

  // 1. Math & Calculation Engine
  console.log("\n1. Testing Distance Slabs & Calculations...");
  const slabs = [
    { minDistanceKm: 0, maxDistanceKm: 2, defaultCharge: 30 },
    { minDistanceKm: 2, maxDistanceKm: 4, defaultCharge: 40 },
    { minDistanceKm: 4, maxDistanceKm: 6, defaultCharge: 60 },
    { minDistanceKm: 6, maxDistanceKm: 8, defaultCharge: 80 },
    { minDistanceKm: 8, maxDistanceKm: 10, defaultCharge: 100 },
  ];

  const c1 = getSuggestedDeliveryCharge(1.2, slabs);
  assert.strictEqual(c1, 30, "0-2 KM should be ₹30");

  const c2 = getSuggestedDeliveryCharge(3.5, slabs);
  assert.strictEqual(c2, 40, "2-4 KM should be ₹40");

  const calc = calculateOrderTotals({
    items: [{ unitPrice: 200, quantity: 2 }],
    combos: [{ price: 555, quantity: 1 }],
    deliveryCharge: 40,
    orderType: "DELIVERY",
  });

  assert.strictEqual(calc.subtotal, 955, "400 + 555 = 955 subtotal");
  assert.strictEqual(calc.deliveryCharge, 40, "Delivery charge is ₹40");
  assert.strictEqual(calc.grandTotal, 995, "955 + 40 = 995 (ZERO GST)");
  console.log("   ✅ Calculations verified!");

  // 2. Database Models Verification
  console.log("\n2. Testing Database Models & Seed Data...");
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  const combos = await prisma.combo.findMany();
  const dbSlabs = await prisma.deliveryDistanceSlab.findMany();

  assert(categories.length > 0, "Categories must exist");
  assert(products.length > 0, "Products must exist");
  assert(combos.length >= 3, "At least 3 Daily Combos must exist");
  assert(dbSlabs.length >= 5, "At least 5 Distance Slabs must exist");
  console.log("   ✅ Database models verified!");

  console.log("\n=================================================");
  console.log("🎉 ALL TESTS PASSED!");
  console.log("=================================================\n");
}

runAllTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

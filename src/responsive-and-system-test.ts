import prisma from "./lib/prisma";
import { getSuggestedDeliveryCharge, calculateOrderTotals } from "./lib/calculations";

async function runVerification() {
  console.log("==================================================");
  console.log("MIDNIGHT FUEL — RESPONSIVE & SYSTEM INTEGRATION TEST");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  // Test 1: Verify Business Settings (Store Hours, Zero GST, UPI)
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default-settings" },
  });
  assert(!!settings, "Business settings exist in database");
  assert(settings?.openingTime === "19:00", "Store opening time is 7:00 PM (19:00)");
  assert(settings?.closingTime === "02:00", "Store closing time is 2:00 AM (02:00)");
  assert(settings?.upiId === "midnightfuel@upi", "UPI VPA ID is midnightfuel@upi");

  // Test 2: Verify Daily Combos Structure
  const combos = await prisma.combo.findMany({
    include: { items: true },
  });
  assert(combos.length >= 3, `Daily Combos seeded (Found ${combos.length} combos)`);
  const combo1 = combos.find((c) => c.comboNumber === 1);
  assert(!!combo1, "Combo 1 exists");
  assert(combo1?.price === 555, "Combo 1 price is ₹555");
  assert(combo1?.servingPeople?.includes("3 People") || false, "Combo 1 serves 3 people");

  // Test 3: Verify Delivery Distance Slabs
  const slabs = await prisma.deliveryDistanceSlab.findMany({
    orderBy: { minDistanceKm: "asc" },
  });
  assert(slabs.length >= 4, `Delivery distance slabs exist (Found ${slabs.length} slabs)`);

  const slab2km = getSuggestedDeliveryCharge(1.5, slabs);
  assert(slab2km === 30, `1.5 KM charge is ₹30 (Got ₹${slab2km})`);

  const slab3km = getSuggestedDeliveryCharge(2.5, slabs);
  assert(slab3km === 40, `2.5 KM charge is ₹40 (Got ₹${slab3km})`);

  const slab7km = getSuggestedDeliveryCharge(6.5, slabs);
  assert(slab7km === 80, `6.5 KM charge is ₹80 (Got ₹${slab7km})`);

  const slab12km = getSuggestedDeliveryCharge(12, slabs);
  assert(slab12km === 130, `12 KM charge is ₹130 (Got ₹${slab12km})`);

  // Test 4: Verify Zero Add-ons & Zero GST Formula
  const calculation = calculateOrderTotals({
    items: [
      { unitPrice: 220, quantity: 2 }, // 440
      { unitPrice: 180, quantity: 1 }, // 180
    ],
    combos: [
      { price: 555, quantity: 1 }, // 555
    ],
    deliveryCharge: 60,
  });

  assert(calculation.subtotal === 1175, `Subtotal is ₹1175 (Got ₹${calculation.subtotal})`);
  assert(calculation.deliveryCharge === 60, `Delivery charge is ₹60 (Got ₹${calculation.deliveryCharge})`);
  assert(calculation.grandTotal === 1235, `Grand total is exactly Subtotal + Delivery = ₹1235 (Got ₹${calculation.grandTotal})`);

  // Test 5: Verify Products are active
  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    include: { category: true },
  });
  assert(products.length >= 10, `Active menu products exist (Found ${products.length} products)`);

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification()
  .catch((e) => {
    console.error("Verification error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

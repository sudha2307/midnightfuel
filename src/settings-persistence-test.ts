import prisma from "./lib/prisma";
import { checkIsStoreOpen, getStoreStatus, formatTime12Hour } from "./lib/business-hours";
import { calculateOrderTotals } from "./lib/calculations";

async function runSettingsPersistenceAudit() {
  console.log("==================================================");
  console.log("MIDNIGHT FUEL — SETTINGS PERSISTENCE & SYNC AUDIT");
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
  // TEST 1: Initial Database State
  // ----------------------------------------------------
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
        minOrderAmount: 199,
        upiId: "midnightfuel@upi",
        phone: "+91 98765 43210",
        whatsapp: "+91 98765 43210",
        address: "123 Food Street, Late Night Hub, Tirunelveli - 627001",
        city: "Tirunelveli",
        storeMode: "AUTO",
      },
    });
  }

  assert(!!settings, "Database has BusinessSettings record with id 'default-settings'");

  // ----------------------------------------------------
  // TEST 2: Admin Updates All Settings (Simulate PUT API)
  // ----------------------------------------------------
  const updatePayload = {
    businessName: "Midnight Fuel Cloud Kitchen",
    tagline: "HOT FOOD • ZERO TAX • LATE NIGHT",
    phone: "+91 99440 12345",
    whatsapp: "+91 99440 12345",
    address: "456 Nightowl Expressway, Palayamkottai, Tirunelveli - 627002",
    city: "Tirunelveli",
    openingTime: "18:30",
    closingTime: "03:30",
    minOrderAmount: 299,
    upiId: "kitchenmaster@upi",
    storeMode: "FORCE_OPEN",
    isForceOpen: true,
    isForceClosed: false,
    isCashEnabled: true,
    isUpiEnabled: true,
  };

  const updatedSettings = await prisma.businessSettings.update({
    where: { id: "default-settings" },
    data: updatePayload,
  });

  assert(updatedSettings.businessName === "Midnight Fuel Cloud Kitchen", "Kitchen name updated in database");
  assert(updatedSettings.upiId === "kitchenmaster@upi", "UPI VPA ID updated in database");
  assert(updatedSettings.minOrderAmount === 299, "Minimum order amount updated to ₹299 in database");
  assert(updatedSettings.openingTime === "18:30", "Opening time updated to 18:30 in database");
  assert(updatedSettings.closingTime === "03:30", "Closing time updated to 03:30 in database");
  assert(updatedSettings.phone === "+91 99440 12345", "Phone updated in database");
  assert(updatedSettings.whatsapp === "+91 99440 12345", "WhatsApp updated in database");
  assert(updatedSettings.address.includes("Nightowl Expressway"), "Address updated in database");
  assert(updatedSettings.storeMode === "FORCE_OPEN", "Store mode updated to FORCE_OPEN in database");

  // ----------------------------------------------------
  // TEST 3: Dynamic 12-Hour Time Formatter & Status Display
  // ----------------------------------------------------
  assert(formatTime12Hour("18:30") === "6:30 PM", "18:30 formats to '6:30 PM'");
  assert(formatTime12Hour("03:30") === "3:30 AM", "03:30 formats to '3:30 AM'");
  assert(formatTime12Hour("12:00") === "12:00 PM", "12:00 formats to '12:00 PM'");
  assert(formatTime12Hour("00:00") === "12:00 AM", "00:00 formats to '12:00 AM'");

  const forceOpenStatus = getStoreStatus({
    openingTime: updatedSettings.openingTime,
    closingTime: updatedSettings.closingTime,
    storeMode: "FORCE_OPEN",
  });
  assert(forceOpenStatus.isOpen === true, "FORCE_OPEN status is open");
  assert(forceOpenStatus.badgeText.includes("FORCE OPEN"), "FORCE_OPEN badge rendered");

  const forceClosedStatus = getStoreStatus({
    openingTime: updatedSettings.openingTime,
    closingTime: updatedSettings.closingTime,
    storeMode: "FORCE_CLOSED",
  });
  assert(forceClosedStatus.isOpen === false, "FORCE_CLOSED status is closed");
  assert(forceClosedStatus.badgeText.includes("FORCE CLOSED"), "FORCE_CLOSED badge rendered");

  // ----------------------------------------------------
  // TEST 4: Midnight Rollover Logic in AUTOMATIC Mode
  // ----------------------------------------------------
  // Test schedule: 18:30 (6:30 PM) -> 03:30 (3:30 AM)
  const config = {
    openingTime: "18:30",
    closingTime: "03:30",
    storeMode: "AUTO",
  };

  // 6:29 PM -> Closed
  const dBeforeOpen = new Date(2026, 7, 14, 18, 29);
  assert(checkIsStoreOpen(config, dBeforeOpen) === false, "6:29 PM is closed for 18:30 opening");

  // 6:30 PM -> Open
  const dAtOpen = new Date(2026, 7, 14, 18, 30);
  assert(checkIsStoreOpen(config, dAtOpen) === true, "6:30 PM is open");

  // 11:45 PM -> Open
  const dLateNight = new Date(2026, 7, 14, 23, 45);
  assert(checkIsStoreOpen(config, dLateNight) === true, "11:45 PM is open");

  // 12:05 AM (next day) -> Open
  const dPastMidnight = new Date(2026, 7, 15, 0, 5);
  assert(checkIsStoreOpen(config, dPastMidnight) === true, "12:05 AM is open");

  // 3:29 AM -> Open
  const dBeforeClose = new Date(2026, 7, 15, 3, 29);
  assert(checkIsStoreOpen(config, dBeforeClose) === true, "3:29 AM is open");

  // 3:31 AM -> Closed
  const dAfterClose = new Date(2026, 7, 15, 3, 31);
  assert(checkIsStoreOpen(config, dAfterClose) === false, "3:31 AM is closed for 03:30 closing");

  // ----------------------------------------------------
  // TEST 5: Dynamic Minimum Order Amount Enforcement
  // ----------------------------------------------------
  const belowThresholdCalc = calculateOrderTotals({
    items: [{ unitPrice: 200, quantity: 1 }],
    deliveryCharge: 40,
    minOrderAmount: updatedSettings.minOrderAmount, // ₹299
  });
  assert(belowThresholdCalc.isMinOrderMet === false, "Order ₹200 rejected when min is ₹299");

  const metThresholdCalc = calculateOrderTotals({
    items: [{ unitPrice: 350, quantity: 1 }],
    deliveryCharge: 40,
    minOrderAmount: updatedSettings.minOrderAmount, // ₹299
  });
  assert(metThresholdCalc.isMinOrderMet === true, "Order ₹350 accepted when min is ₹299");

  // ----------------------------------------------------
  // TEST 6: Dynamic UPI URL & QR Generator
  // ----------------------------------------------------
  const testAmount = 500;
  const upiIntent = `upi://pay?pa=${encodeURIComponent(updatedSettings.upiId)}&pn=${encodeURIComponent(updatedSettings.businessName)}&am=${testAmount.toFixed(2)}&cu=INR`;
  assert(upiIntent.includes("pa=kitchenmaster%40upi"), "UPI Intent contains updated kitchenmaster@upi VPA ID");
  assert(upiIntent.includes("pn=Midnight%20Fuel%20Cloud%20Kitchen"), "UPI Intent contains updated business name");

  // ----------------------------------------------------
  // TEST 7: Reset to standard Midnight Fuel defaults
  // ----------------------------------------------------
  await prisma.businessSettings.update({
    where: { id: "default-settings" },
    data: {
      businessName: "Midnight Fuel",
      tagline: "EAT • ENJOY • RECHARGE",
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      address: "123 Food Street, Late Night Hub, Tirunelveli - 627001",
      city: "Tirunelveli",
      openingTime: "19:00",
      closingTime: "02:00",
      minOrderAmount: 199,
      upiId: "midnightfuel@upi",
      storeMode: "AUTO",
      isForceOpen: false,
      isForceClosed: false,
      isCashEnabled: true,
      isUpiEnabled: true,
    },
  });

  const resetSettings = await prisma.businessSettings.findUnique({
    where: { id: "default-settings" },
  });
  assert(resetSettings?.businessName === "Midnight Fuel", "Successfully restored standard settings");

  console.log("==================================================");
  console.log(`AUDIT TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSettingsPersistenceAudit()
  .catch((e) => {
    console.error("Settings audit error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

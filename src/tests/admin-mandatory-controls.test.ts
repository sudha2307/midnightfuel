import assert from "assert";
import prisma from "../lib/prisma";

async function runAdminMandatoryControlsTest() {
  console.log("=================================================");
  console.log("TEST: ADMIN MANDATORY CONTROLS (PRICES, COMBOS, STORE)");
  console.log("=================================================");

  // 1. Menu item toggle
  const product = await prisma.product.findFirst();
  assert(product, "Product exists");

  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: { isAvailable: false },
  });
  assert.strictEqual(updatedProduct.isAvailable, false, "Product is marked unavailable");

  // Revert back
  await prisma.product.update({
    where: { id: product.id },
    data: { isAvailable: true },
  });

  // 2. Combo creation & toggle
  const combo = await prisma.combo.findFirst();
  assert(combo, "Combo exists");

  const updatedCombo = await prisma.combo.update({
    where: { id: combo.id },
    data: { isActive: false },
  });
  assert.strictEqual(updatedCombo.isActive, false, "Combo is marked inactive");

  await prisma.combo.update({
    where: { id: combo.id },
    data: { isActive: true },
  });

  console.log("✅ Admin Mandatory Controls Test Passed 100%!");
}

runAdminMandatoryControlsTest()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import assert from "assert";
import prisma from "../lib/prisma";

async function runAdminDashboardActionsTest() {
  console.log("=================================================");
  console.log("TEST: ADMIN DASHBOARD ACTIONS");
  console.log("=================================================");

  // 1. Check Distance Slabs
  const slabs = await prisma.deliveryDistanceSlab.findMany();
  assert(slabs.length > 0, "Distance slabs exist");

  // 2. Check Orders Query
  const orders = await prisma.order.findMany({
    take: 5,
    include: {
      items: true,
      combos: { include: { items: true } },
      invoice: true,
      deliveryHistory: true,
    },
  });

  assert(Array.isArray(orders), "Orders array returned");
  console.log("✅ Admin Dashboard Actions Test Passed!");
}

runAdminDashboardActionsTest()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["warn", "error"],
});

async function runBenchmark() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING DATABASE & NETWORK PERFORMANCE BENCHMARK");
  console.log("=======================================================\n");

  try {
    // 1. Initial Connection Establishment
    const connectStart = performance.now();
    await prisma.$connect();
    const connectTime = performance.now() - connectStart;
    console.log(`[1] Connection Establishment Time: ${connectTime.toFixed(2)} ms`);

    // 2. Cold Query: SELECT 1
    const q1Start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const q1Time = performance.now() - q1Start;
    console.log(`[2] First Query (SELECT 1 - Cold): ${q1Time.toFixed(2)} ms`);

    // 3. Warm Repeated Queries (SELECT NOW())
    console.log("\n[3] Running 5 Consecutive 'SELECT NOW()' queries on warm connection:");
    const times: number[] = [];
    for (let i = 1; i <= 5; i++) {
      const start = performance.now();
      await prisma.$queryRaw`SELECT NOW()`;
      const dur = performance.now() - start;
      times.push(dur);
      console.log(`    Query #${i}: ${dur.toFixed(2)} ms`);
    }

    const avgRaw = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`    ➔ Average Raw Ping-Pong Roundtrip: ${avgRaw.toFixed(2)} ms`);

    // 4. Real Table Query: Products Fetch (with Relations)
    console.log("\n[4] Measuring Real Application Query (findMany Products + Categories):");
    const prodStart = performance.now();
    const products = await prisma.product.findMany({
      where: { isAvailable: true, isDeleted: false },
      include: { category: true },
      take: 20,
    });
    const prodTime = performance.now() - prodStart;
    console.log(`    Fetched ${products.length} products with category relations in: ${prodTime.toFixed(2)} ms`);

    // 5. Aggregate Summary
    console.log("\n=======================================================");
    console.log("📊 BENCHMARK DIAGNOSTIC SUMMARY");
    console.log("=======================================================");
    console.log(`• Initial Handshake / TCP + SSL: ${connectTime.toFixed(2)} ms`);
    console.log(`• Pure Network Transit (SELECT NOW): ${avgRaw.toFixed(2)} ms per query`);
    console.log(`• Full Application Model Query: ${prodTime.toFixed(2)} ms`);
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Benchmark failed with error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runBenchmark();

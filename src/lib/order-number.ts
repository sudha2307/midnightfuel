import prisma from "./prisma";

export async function generateNextOrderNumber(): Promise<string> {
  try {
    // Fetch latest order by creation date (fast indexed query)
    const latestOrder = await prisma.order.findFirst({
      where: { orderNumber: { startsWith: "MF" } },
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true },
    });

    if (!latestOrder || !latestOrder.orderNumber) {
      return "MF10001";
    }

    const currentNum = parseInt(latestOrder.orderNumber.replace("MF", ""), 10);
    if (!isNaN(currentNum) && currentNum >= 10000) {
      return `MF${currentNum + 1}`;
    }

    return "MF10001";
  } catch (error) {
    // Unique fallback using timestamp suffix
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `MF${Date.now().toString().slice(-4)}${randomSuffix}`;
  }
}

export function generateInvoiceNumber(orderNumber: string): string {
  const cleanNumber = orderNumber.replace("MF", "");
  return `INV-MF-${cleanNumber}`;
}

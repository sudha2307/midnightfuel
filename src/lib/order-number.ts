import prisma from "./prisma";

export async function generateNextOrderNumber(): Promise<string> {
  // Find highest existing order number
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  if (!latestOrder || !latestOrder.orderNumber.startsWith("MF")) {
    return "MF10001";
  }

  const numPart = latestOrder.orderNumber.replace("MF", "");
  const nextNum = parseInt(numPart, 10) + 1;

  if (isNaN(nextNum)) {
    return `MF${Date.now().toString().slice(-5)}`;
  }

  return `MF${nextNum}`;
}

export function generateInvoiceNumber(orderNumber: string): string {
  const cleanNumber = orderNumber.replace("MF", "");
  return `INV-MF-${cleanNumber}`;
}

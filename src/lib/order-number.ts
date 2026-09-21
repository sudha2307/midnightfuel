import prisma from "./prisma";

export async function generateNextOrderNumber(): Promise<string> {
  try {
    // Find all existing order numbers to determine the true maximum integer
    const orders = await prisma.order.findMany({
      select: { orderNumber: true },
    });

    if (!orders || orders.length === 0) {
      return "MF10001";
    }

    let maxNum = 10000;
    for (const ord of orders) {
      if (ord.orderNumber && ord.orderNumber.startsWith("MF")) {
        const num = parseInt(ord.orderNumber.replace("MF", ""), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    return `MF${nextNum}`;
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

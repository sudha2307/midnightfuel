export interface CalculationItem {
  unitPrice: number;
  quantity: number;
}

export interface CalculationCombo {
  price: number;
  quantity: number;
}

export interface DistanceSlab {
  minDistanceKm: number;
  maxDistanceKm: number;
  defaultCharge: number;
}

export interface OrderCalculationResult {
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  isMinOrderMet: boolean;
}

/**
 * Finds suggested delivery charge based on distance and slabs
 */
export function getSuggestedDeliveryCharge(
  distanceKm: number,
  slabs: DistanceSlab[] = [
    { minDistanceKm: 0, maxDistanceKm: 2, defaultCharge: 30 },
    { minDistanceKm: 2, maxDistanceKm: 4, defaultCharge: 40 },
    { minDistanceKm: 4, maxDistanceKm: 6, defaultCharge: 60 },
    { minDistanceKm: 6, maxDistanceKm: 8, defaultCharge: 80 },
    { minDistanceKm: 8, maxDistanceKm: 10, defaultCharge: 100 },
  ]
): number {
  if (distanceKm < 0) return 0;

  // Sort slabs ascending
  const sorted = [...slabs].sort((a, b) => a.minDistanceKm - b.minDistanceKm);

  for (const slab of sorted) {
    if (distanceKm >= slab.minDistanceKm && distanceKm <= slab.maxDistanceKm) {
      return slab.defaultCharge;
    }
  }

  // If beyond highest slab, use highest or fallback + incremental
  if (sorted.length > 0 && distanceKm > sorted[sorted.length - 1].maxDistanceKm) {
    return (
      sorted[sorted.length - 1].defaultCharge +
      Math.ceil(distanceKm - sorted[sorted.length - 1].maxDistanceKm) * 15
    );
  }

  return 40; // Default fallback
}

/**
 * Calculates order totals deterministically: Subtotal + Delivery Charge = Grand Total (NO GST, NO ADDONS, NO NOTE CHARGE)
 */
export function calculateOrderTotals({
  items = [],
  combos = [],
  orderType = "DELIVERY",
  deliveryCharge = 0,
  minOrderAmount = 199,
}: {
  items?: CalculationItem[];
  combos?: CalculationCombo[];
  orderType?: "DELIVERY" | "PICKUP";
  deliveryCharge?: number;
  minOrderAmount?: number;
}): OrderCalculationResult {
  // 1. Calculate items subtotal
  let itemsSubtotal = 0;
  for (const item of items) {
    const itemTotal = Number(item.unitPrice) * item.quantity;
    itemsSubtotal += itemTotal;
  }

  // 2. Calculate combos subtotal
  let combosSubtotal = 0;
  for (const combo of combos) {
    combosSubtotal += Number(combo.price) * Number(combo.quantity);
  }

  const subtotal = Math.round((itemsSubtotal + combosSubtotal) * 100) / 100;

  // 3. Final delivery charge (zero for pickup, non-negative)
  const finalDeliveryCharge =
    orderType === "PICKUP" ? 0 : Math.max(0, Number(deliveryCharge) || 0);

  // 4. Grand Total = Subtotal + Delivery Charge (ZERO GST, Zero Note Charge)
  const grandTotal = Math.round((subtotal + finalDeliveryCharge) * 100) / 100;
  const isMinOrderMet = subtotal >= minOrderAmount;

  return {
    subtotal,
    deliveryCharge: finalDeliveryCharge,
    grandTotal,
    isMinOrderMet,
  };
}

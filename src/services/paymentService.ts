export type PaymentMethodType = "COD" | "UPI" | "ONLINE";

export interface PaymentInitiationResult {
  method: PaymentMethodType;
  status: "PENDING" | "COMPLETED" | "REQUIRES_ACTION";
  transactionId?: string;
  upiPaymentUrl?: string;
  gatewayOrderId?: string;
  gatewayKey?: string;
  instructions: string;
}

export function initiatePayment({
  orderNumber,
  grandTotal,
  paymentMethod,
  upiId = "midnightfuel@upi",
}: {
  orderNumber: string;
  grandTotal: number;
  paymentMethod: PaymentMethodType;
  upiId?: string;
}): PaymentInitiationResult {
  if (paymentMethod === "COD") {
    return {
      method: "COD",
      status: "PENDING",
      transactionId: `COD_${orderNumber}`,
      instructions: "Pay with cash or scan delivery partner's QR upon arrival.",
    };
  }

  if (paymentMethod === "UPI") {
    // Standard Indian UPI Intent URL
    // Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&tn=<note>&cu=INR
    const note = encodeURIComponent(`Midnight Fuel Order ${orderNumber}`);
    const name = encodeURIComponent("Midnight Fuel");
    const upiUrl = `upi://pay?pa=${upiId}&pn=${name}&am=${grandTotal}&tn=${note}&cu=INR`;

    return {
      method: "UPI",
      status: "PENDING",
      transactionId: `UPI_INIT_${orderNumber}_${Date.now().toString().slice(-4)}`,
      upiPaymentUrl: upiUrl,
      instructions: `Scan the UPI QR code or pay to ${upiId} using GPay, PhonePe or Paytm.`,
    };
  }

  // ONLINE (Razorpay / Indian Payment Gateway Architecture)
  const gatewayKey = process.env.PAYMENT_GATEWAY_KEY || "rzp_test_midnightfuel";
  return {
    method: "ONLINE",
    status: "REQUIRES_ACTION",
    gatewayOrderId: `order_rzp_${orderNumber}_${Date.now().toString().slice(-4)}`,
    gatewayKey,
    instructions: "Complete payment via Debit/Credit Card, NetBanking or Wallets.",
  };
}

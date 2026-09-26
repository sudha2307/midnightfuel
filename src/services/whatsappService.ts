export interface WhatsAppMessagePayload {
  to: string; // phone number e.g. "9876543210" or "919876543210"
  orderNumber: string;
  customerName: string;
  status: string;
  orderType?: "DELIVERY" | "PICKUP" | string;
  subtotal?: number;
  deliveryDistanceKm?: number;
  deliveryCharge?: number;
  grandTotal: number;
  itemsSummary?: string;
  specialNote?: string;
  estimatedMinutes?: number;
  isDeliveryChargeUpdate?: boolean;
}

export function generateWhatsAppMessageText({
  customerName,
  orderNumber,
  status,
  orderType = "DELIVERY",
  subtotal,
  deliveryDistanceKm,
  deliveryCharge,
  grandTotal,
  itemsSummary,
  specialNote,
  estimatedMinutes = 20,
  isDeliveryChargeUpdate = false,
}: WhatsAppMessagePayload): string {
  const isPickup = orderType === "PICKUP";
  const noteSection = specialNote && specialNote.trim()
    ? `\n📝 Special Request:\n"${specialNote.trim()}"\n`
    : "";

  if (isDeliveryChargeUpdate) {
    const distText = deliveryDistanceKm ? `\nDistance: ${deliveryDistanceKm} KM` : "";
    const foodText = subtotal ? `\nFood: ₹${subtotal}` : "";
    const chargeText = deliveryCharge !== undefined ? `\nDelivery Charge: ₹${deliveryCharge}` : "";
    return `🌙 MIDNIGHT FUEL\n\nUpdate for your order #${orderNumber}\n\nYour delivery charge has been calculated based on your delivery distance.${distText}${chargeText}${foodText}\n\nTOTAL: ₹${grandTotal}${noteSection}\nYour order is being prepared. 🍗🔥\n\nThank you for choosing Midnight Fuel!\nEAT • ENJOY • RECHARGE`;
  }

  switch (status.toUpperCase()) {
    case "NEW":
    case "CONFIRMED": {
      const itemsLine = itemsSummary ? `\nItems:\n${itemsSummary}\n` : "";
      const delivLine = !isPickup && deliveryCharge !== undefined && deliveryCharge > 0 ? `Delivery: ₹${deliveryCharge}\n` : "";
      const typeText = isPickup ? "Self-Pickup (Collect at Kitchen Counter)" : "Doorstep Delivery";
      return `🌙 MIDNIGHT FUEL\n\nHi ${customerName}!\n\nOrder #${orderNumber} confirmed for ${typeText}! ✅${itemsLine}\nSubtotal: ₹${subtotal || grandTotal}\n${delivLine}Total: ₹${grandTotal}${noteSection}\nEstimated preparation time: ${estimatedMinutes}–25 minutes.\n\nThank you for choosing Midnight Fuel! 🌙`;
    }

    case "PREPARING":
      return `🌙 MIDNIGHT FUEL\n\nHi ${customerName}!\n\nYour ${isPickup ? "pickup " : ""}order #${orderNumber} is now being freshly prepared in our kitchen. 👨‍🍳🔥${noteSection}\nHot & fresh food will be packed shortly!`;

    case "READY":
      if (isPickup) {
        return `🌙 MIDNIGHT FUEL\n\nHi ${customerName}!\n\n🎉 Your parcel for Order #${orderNumber} is PACKED & READY FOR PICKUP at our kitchen counter!\n\nPlease visit our kitchen counter to collect your order.\nShow your Order #${orderNumber} at the counter. 🍱🔥`;
      }
      return `🌙 MIDNIGHT FUEL\n\nHi ${customerName}!\n\nYour order #${orderNumber} is packed in thermal packaging and ready for dispatch. 🍱`;

    case "OUT_FOR_DELIVERY":
      if (isPickup) {
        return `🌙 MIDNIGHT FUEL\n\nHi ${customerName}!\n\nReminder: Your Order #${orderNumber} is waiting for pickup at our kitchen counter. 🍱`;
      }
      return `🌙 MIDNIGHT FUEL\n\nHi ${customerName}!\n\nYour order #${orderNumber} is out for delivery! Our delivery rider is on the way to your location. 🛵💨`;

    case "DELIVERED":
      if (isPickup) {
        return `🌙 MIDNIGHT FUEL\n\nHi ${customerName}!\n\nThank you for collecting your Order #${orderNumber} from Midnight Fuel.\n\nEnjoy your midnight feast!\nEAT • ENJOY • RECHARGE 🌙`;
      }
      return `🌙 MIDNIGHT FUEL\n\nHi ${customerName}!\n\nYour order #${orderNumber} has been successfully delivered.\n\nEnjoy your midnight feast!\nEAT • ENJOY • RECHARGE 🌙`;

    case "CANCELLED":
      return `🌙 MIDNIGHT FUEL\n\nHi ${customerName},\n\nYour order #${orderNumber} has been cancelled. For any queries, reach us directly on WhatsApp support (+91 90801 39363).`;

    default:
      return `🌙 MIDNIGHT FUEL\n\nHi ${customerName},\n\nYour order #${orderNumber} status update: ${status}.${noteSection}`;
  }
}

/**
 * Creates a direct click-to-chat WhatsApp link
 */
export function getWhatsAppDirectLink(
  phone: string,
  messageText: string
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const formattedPhone =
    cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encoded = encodeURIComponent(messageText);
  return `https://wa.me/${formattedPhone}?text=${encoded}`;
}

/**
 * WhatsApp Cloud API Dispatcher
 */
export async function sendWhatsAppNotification(
  payload: WhatsAppMessagePayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const text = generateWhatsAppMessageText(payload);
  console.log(`\n📱 [WhatsApp Service] Dispatching to +91 ${payload.to}:`);
  console.log(text);
  console.log(`--------------------------------------------------\n`);

  if (!token || token.includes("placeholder") || !phoneId) {
    // Graceful fallback / simulation for development
    return {
      success: true,
      messageId: `sim_wa_${Date.now()}`,
    };
  }

  try {
    const cleanPhone = payload.to.replace(/[^0-9]/g, "");
    const formattedPhone =
      cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: { body: text },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("[WhatsApp API Error]", data);
      return { success: false, error: data.error?.message || "WhatsApp API error" };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    console.error("[WhatsApp Service Error]", err);
    return { success: false, error: err.message };
  }
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  if (isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatDate(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}

export function formatTimeOnly(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}

export function getStatusInfo(status: string, orderType: string = "DELIVERY") {
  const isPickup = orderType === "PICKUP";

  switch (status) {
    case "NEW":
      return {
        label: "New Order",
        badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        stepIndex: 0,
      };
    case "CONFIRMED":
      return {
        label: isPickup ? "Order Accepted for Pickup" : "Confirmed",
        badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        stepIndex: 1,
      };
    case "PREPARING":
      return {
        label: "Preparing Your Food",
        badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/40 animate-pulse",
        stepIndex: 2,
      };
    case "READY":
      return {
        label: isPickup ? "Ready for Pickup at Kitchen" : "Food Ready & Packed",
        badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        stepIndex: 3,
      };
    case "OUT_FOR_DELIVERY":
      return {
        label: isPickup ? "Ready for Collection" : "Out for Delivery",
        badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/40",
        stepIndex: isPickup ? 3 : 4,
      };
    case "DELIVERED":
      return {
        label: isPickup ? "Picked Up by Customer" : "Delivered",
        badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        stepIndex: isPickup ? 4 : 5,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        badgeClass: "bg-rose-500/20 text-rose-400 border-rose-500/40",
        stepIndex: -1,
      };
    default:
      return {
        label: status,
        badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
        stepIndex: 0,
      };
  }
}

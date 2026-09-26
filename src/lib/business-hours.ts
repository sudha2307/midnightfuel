export interface BusinessHoursConfig {
  openingTime: string; // e.g. "19:00"
  closingTime: string; // e.g. "02:00"
  storeMode?: string; // "AUTO" | "FORCE_OPEN" | "FORCE_CLOSED"
  isForceOpen?: boolean;
  isForceClosed?: boolean;
  timezone?: string; // "Asia/Kolkata"
}

export interface StoreStatus {
  isOpen: boolean;
  storeMode: "AUTO" | "FORCE_OPEN" | "FORCE_CLOSED";
  badgeText: string;
  subText: string;
  message: string;
  nextChangeText: string;
}

/**
 * Checks if the store is currently open given opening & closing times (handling midnight rollover).
 * Default hours: 7:00 PM (19:00) to 2:00 AM (02:00) in Asia/Kolkata timezone.
 */
export function checkIsStoreOpen(
  config: BusinessHoursConfig = {
    openingTime: "19:00",
    closingTime: "02:00",
    storeMode: "AUTO",
  },
  targetDate: Date = new Date()
): boolean {
  const mode = config.storeMode || (config.isForceOpen ? "FORCE_OPEN" : config.isForceClosed ? "FORCE_CLOSED" : "AUTO");

  if (mode === "FORCE_OPEN") return true;
  if (mode === "FORCE_CLOSED") return false;

  const [openHour, openMinute] = config.openingTime.split(":").map(Number);
  const [closeHour, closeMinute] = config.closingTime.split(":").map(Number);

  // Convert to target timezone (Asia/Kolkata) if needed
  const dateInTz = new Intl.DateTimeFormat("en-US", {
    timeZone: config.timezone || "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(targetDate);

  let currentHour = targetDate.getHours();
  let currentMinute = targetDate.getMinutes();

  for (const part of dateInTz) {
    if (part.type === "hour") {
      const h = parseInt(part.value, 10);
      currentHour = h === 24 ? 0 : h;
    }
    if (part.type === "minute") currentMinute = parseInt(part.value, 10);
  }

  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const openTotalMinutes = openHour * 60 + openMinute;
  const closeTotalMinutes = closeHour * 60 + closeMinute;

  // Case 1: Operates across midnight (e.g. 19:00 -> 02:00)
  // 6:59 PM (18:59 = 1139) -> CLOSED
  // 7:00 PM (19:00 = 1140) -> OPEN
  // 11:59 PM (23:59 = 1439) -> OPEN
  // 12:00 AM (00:00 = 0) -> OPEN
  // 1:59 AM (01:59 = 119) -> OPEN
  // 2:00 AM (02:00 = 120) -> CLOSED
  // 2:01 AM (02:01 = 121) -> CLOSED
  if (closeTotalMinutes < openTotalMinutes) {
    return (
      currentTotalMinutes >= openTotalMinutes ||
      currentTotalMinutes < closeTotalMinutes
    );
  }

  // Case 2: Same day hours (e.g. 09:00 -> 22:00)
  return (
    currentTotalMinutes >= openTotalMinutes &&
    currentTotalMinutes < closeTotalMinutes
  );
}

/**
 * Formats a 24-hour time string ("19:00" or "02:30") into a 12-hour string ("7:00 PM" or "2:30 AM")
 */
export function formatTime12Hour(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24 || "7:00 PM";
  const [hourStr, minStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minStr || "00";
  if (isNaN(hour)) return time24;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return minute === "00" ? `${hour}:00 ${ampm}` : `${hour}:${minute} ${ampm}`;
}

/**
 * Returns comprehensive store status information for UI display
 */
export function getStoreStatus(
  config: BusinessHoursConfig = {
    openingTime: "19:00",
    closingTime: "02:00",
    storeMode: "AUTO",
  },
  targetDate: Date = new Date()
): StoreStatus {
  const mode = (config.storeMode || (config.isForceOpen ? "FORCE_OPEN" : config.isForceClosed ? "FORCE_CLOSED" : "AUTO")) as "AUTO" | "FORCE_OPEN" | "FORCE_CLOSED";
  const isOpen = checkIsStoreOpen(config, targetDate);

  const openTimeDisplay = formatTime12Hour(config.openingTime || "19:00");
  const closeTimeDisplay = formatTime12Hour(config.closingTime || "02:00");

  if (mode === "FORCE_OPEN") {
    return {
      isOpen: true,
      storeMode: "FORCE_OPEN",
      badgeText: "FORCE OPEN (MANUAL)",
      subText: "Open 24/7 (Admin Override)",
      message: "Accepting orders right now (Force Open).",
      nextChangeText: "Open until manually closed",
    };
  }

  if (mode === "FORCE_CLOSED") {
    return {
      isOpen: false,
      storeMode: "FORCE_CLOSED",
      badgeText: "FORCE CLOSED (MANUAL)",
      subText: "Temporarily Not Accepting Orders",
      message: "Ordering is currently paused by admin.",
      nextChangeText: "Closed until manually opened",
    };
  }

  if (isOpen) {
    return {
      isOpen: true,
      storeMode: "AUTO",
      badgeText: "OPEN NOW",
      subText: `${openTimeDisplay} – ${closeTimeDisplay}`,
      message: "Accepting late-night orders right now!",
      nextChangeText: `Taking orders until ${closeTimeDisplay}`,
    };
  }

  return {
    isOpen: false,
    storeMode: "AUTO",
    badgeText: "CURRENTLY CLOSED",
    subText: `Opens at ${openTimeDisplay}`,
    message: `We operate from ${openTimeDisplay} to ${closeTimeDisplay}.`,
    nextChangeText: `Ordering opens at ${openTimeDisplay}`,
  };
}

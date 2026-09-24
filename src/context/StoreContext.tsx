"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { BusinessSettingsType } from "@/types";
import { getStoreStatus, StoreStatus } from "@/lib/business-hours";

interface StoreContextType {
  settings: BusinessSettingsType | null;
  status: StoreStatus;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  setStoreMode: (mode: "AUTO" | "FORCE_OPEN" | "FORCE_CLOSED") => Promise<boolean>;
  openStore: () => Promise<boolean>;
  closeStore: () => Promise<boolean>;
}

const defaultStatus: StoreStatus = {
  isOpen: false,
  storeMode: "AUTO",
  badgeText: "CURRENTLY CLOSED",
  subText: "Opens tonight at 7:00 PM",
  message: "We operate exclusively late night from 7:00 PM to 2:00 AM.",
  nextChangeText: "Opens today at 7:00 PM",
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettingsType | null>(null);
  const [status, setStatus] = useState<StoreStatus>(defaultStatus);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          const computed = getStoreStatus({
            openingTime: data.settings.openingTime || "19:00",
            closingTime: data.settings.closingTime || "02:00",
            storeMode: data.settings.storeMode || (data.settings.isForceOpen ? "FORCE_OPEN" : data.settings.isForceClosed ? "FORCE_CLOSED" : "AUTO"),
            timezone: data.settings.timezone || "Asia/Kolkata",
          });
          setStatus(computed);
        }
      }
    } catch (e) {
      console.error("Failed to fetch store settings", e);
      setStatus(
        getStoreStatus({
          openingTime: "19:00",
          closingTime: "02:00",
          storeMode: "AUTO",
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setStoreMode = async (mode: "AUTO" | "FORCE_OPEN" | "FORCE_CLOSED") => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ storeMode: mode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          setStatus(data.storeStatus);
        }
        await fetchSettings();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to set store mode", e);
      return false;
    }
  };

  const openStore = () => setStoreMode("FORCE_OPEN");
  const closeStore = () => setStoreMode("FORCE_CLOSED");

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentSettings = settingsRef.current;
      if (currentSettings) {
        setStatus(
          getStoreStatus({
            openingTime: currentSettings.openingTime,
            closingTime: currentSettings.closingTime,
            storeMode: currentSettings.storeMode || (currentSettings.isForceOpen ? "FORCE_OPEN" : currentSettings.isForceClosed ? "FORCE_CLOSED" : "AUTO"),
            timezone: currentSettings.timezone,
          })
        );
      }
    }, 15000); // 15s check

    return () => clearInterval(interval);
  }, []);

  return (
    <StoreContext.Provider
      value={{
        settings,
        status,
        isLoading,
        refreshSettings: fetchSettings,
        setStoreMode,
        openStore,
        closeStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

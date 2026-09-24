"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { CartItem, ProductType, ComboType } from "@/types";
import { calculateOrderTotals } from "@/lib/calculations";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  specialNote: string;
  setSpecialNote: (note: string) => void;
  orderType: "DELIVERY" | "PICKUP";
  setOrderType: (type: "DELIVERY" | "PICKUP") => void;
  addItem: (product: ProductType, quantity?: number) => void;
  addCombo: (combo: ComboType, quantity?: number) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [specialNote, setSpecialNoteState] = useState<string>("");
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart and note from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("mf_cart");
      if (savedCart) setItems(JSON.parse(savedCart));

      const savedNote = localStorage.getItem("mf_special_note");
      if (savedNote) setSpecialNoteState(savedNote);
    } catch (e) {
      console.error("Failed to load saved cart", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("mf_cart", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to persist cart", e);
    }
  }, [items, isLoaded]);

  // Set and persist special note (max 300 chars)
  const setSpecialNote = useCallback((note: string) => {
    const capped = note.slice(0, 300);
    setSpecialNoteState(capped);
    try {
      localStorage.setItem("mf_special_note", capped);
    } catch {}
  }, []);

  // Recalculate totals (NO GST, NO coupons, NO addons)
  const productItems = items.filter((i) => !i.isCombo);
  const comboItems = items.filter((i) => i.isCombo);

  const calcItems = productItems.map((i) => ({
    unitPrice: i.price,
    quantity: i.quantity,
  }));

  const calcCombos = comboItems.map((c) => ({
    price: c.price,
    quantity: c.quantity,
  }));

  const totals = calculateOrderTotals({
    items: calcItems,
    combos: calcCombos,
    orderType,
    deliveryCharge: orderType === "DELIVERY" ? 40 : 0, // Estimated default for preview
  });

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback((product: ProductType, quantity = 1) => {
    setItems((prevItems) => {
      const cartItemId = `prod_${product.id}`;
      const existingIndex = prevItems.findIndex((i) => i.id === cartItemId);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        isVeg: product.isVeg,
        quantity,
        categoryName: product.category?.name,
      };

      return [...prevItems, newItem];
    });
  }, []);

  const addCombo = useCallback((combo: ComboType, quantity = 1) => {
    setItems((prevItems) => {
      const cartItemId = `combo_${combo.id}`;
      const existingIndex = prevItems.findIndex((i) => i.id === cartItemId);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      const formattedIncludedItems = combo.items.map((it) => ({
        name: it.product?.name || it.customItemName || "Item",
        quantity: it.quantity,
      }));

      const newItem: CartItem = {
        id: cartItemId,
        comboId: combo.id,
        isCombo: true,
        name: combo.name,
        price: combo.price,
        image: combo.image || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
        servingPeople: combo.servingPeople || undefined,
        quantity,
        comboItems: formattedIncludedItems,
      };

      return [...prevItems, newItem];
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setItems((prevItems) => {
      return prevItems
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSpecialNoteState("");
    try {
      localStorage.removeItem("mf_cart");
      localStorage.removeItem("mf_special_note");
    } catch {}
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal: totals.subtotal,
        deliveryCharge: totals.deliveryCharge,
        grandTotal: totals.grandTotal,
        specialNote,
        setSpecialNote,
        orderType,
        setOrderType,
        addItem,
        addCombo,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

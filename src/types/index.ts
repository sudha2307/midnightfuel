export interface CartItem {
  id: string; // Unique cart item key (e.g. productId OR combo-comboId)
  productId?: string;
  comboId?: string;
  isCombo?: boolean;
  name: string;
  price: number;
  image: string;
  isVeg?: boolean;
  quantity: number;
  servingPeople?: string;
  categoryName?: string;
  comboItems?: Array<{
    name: string;
    quantity: number;
  }>;
}

export interface PriceHistoryType {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: string | Date;
}

export interface ProductType {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isDeleted?: boolean;
  preparationTime: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  priceHistories?: PriceHistoryType[];
}

export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  order: number;
  isActive: boolean;
  products?: ProductType[];
  _count?: {
    products: number;
  };
}

// Daily Combo Types
export interface ComboItemType {
  id: string;
  comboId: string;
  productId?: string | null;
  product?: ProductType | null;
  customItemName?: string | null;
  quantity: number;
}

export interface ComboPriceHistoryType {
  id: string;
  comboId: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: string | Date;
}

export interface ComboType {
  id: string;
  comboNumber: number;
  name: string;
  description?: string | null;
  image?: string | null;
  servingPeople?: string | null;
  price: number;
  originalPrice?: number | null;
  isActive: boolean;
  displayOrder: number;
  validFrom?: string | Date | null;
  validUntil?: string | Date | null;
  items: ComboItemType[];
  priceHistories?: ComboPriceHistoryType[];
  isPartiallyUnavailable?: boolean;
  unavailableItemNames?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface DeliveryDistanceSlabType {
  id: string;
  minDistanceKm: number;
  maxDistanceKm: number;
  defaultCharge: number;
  displayOrder: number;
}

export interface OrderItemType {
  id: string;
  productId?: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderComboItemType {
  id: string;
  productNameSnapshot: string;
  quantitySnapshot: number;
  priceSnapshot: number;
}

export interface OrderComboType {
  id: string;
  comboId?: string | null;
  comboNameSnapshot: string;
  priceSnapshot: number;
  servingPeopleSnapshot?: string | null;
  quantity: number;
  totalPrice: number;
  items: OrderComboItemType[];
}

export interface OrderDeliveryChargeHistoryType {
  id: string;
  orderId: string;
  oldDistance?: number | null;
  newDistance?: number | null;
  oldDeliveryCharge: number;
  newDeliveryCharge: number;
  changedBy: string;
  changedAt: string | Date;
}

export interface InvoiceType {
  id: string;
  invoiceNumber: string;
  orderId: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  pdfUrl?: string | null;
  whatsappStatus?: string;
  issuedAt: string | Date;
}

export interface OrderType {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerWhatsapp: string;
  orderType: "DELIVERY" | "PICKUP" | string;
  deliveryAddress?: string | null;
  deliveryDistanceKm?: number | null;
  specialNote?: string | null;
  internalKitchenNote?: string | null;
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  paymentMethod: "COD" | "UPI" | string;
  paymentStatus: "PENDING" | "VERIFICATION_PENDING" | "PAID" | "COMPLETED" | "FAILED" | "REFUNDED" | string;
  orderStatus:
    | "NEW"
    | "CONFIRMED"
    | "PREPARING"
    | "READY"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: OrderItemType[];
  combos?: OrderComboType[];
  invoice?: InvoiceType | null;
  deliveryHistory?: OrderDeliveryChargeHistoryType[];
}

export interface CustomerType {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  orders?: OrderType[];
  totalOrders?: number;
  totalSpent?: number;
  lastOrderNumber?: string;
  lastOrderDate?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    orders: number;
  };
}

export interface BusinessSettingsType {
  id: string;
  businessName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  openingTime: string;
  closingTime: string;
  minOrderAmount: number;
  upiId: string;
  storeMode?: "AUTO" | "FORCE_OPEN" | "FORCE_CLOSED" | string;
  isCashEnabled?: boolean;
  isUpiEnabled?: boolean;
  currency: string;
  timezone: string;
  isForceOpen: boolean;
  isForceClosed: boolean;
  todaySpecialProductId?: string | null;
  todaySpecialProduct?: ProductType | null;
}

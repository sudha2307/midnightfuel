"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Phone,
  MapPin,
  QrCode,
  Banknote,
  AlertCircle,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Moon,
  MessageCircle,
  MessageSquare,
  Truck,
  Building2,
} from "lucide-react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    deliveryCharge,
    grandTotal,
    specialNote,
    setSpecialNote,
    orderType,
    setOrderType,
    clearCart,
  } = useCart();

  const { settings, status } = useStore();

  // Form State — STRICTLY NAME, PHONE, WHATSAPP (NO EMAIL)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(true);

  // Address State
  const [houseNo, setHouseNo] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Tirunelveli");
  const [pincode, setPincode] = useState("627001");

  // Payment Method: ONLY CASH ON DELIVERY and UPI
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill logged in customer details and saved address
  useEffect(() => {
    const fetchCustomerSession = async () => {
      try {
        const res = await fetch("/api/auth/customer/me");
        const data = await res.json();
        if (res.ok && data.authenticated && data.customer) {
          if (data.customer.name && !fullName) {
            setFullName(data.customer.name);
          }
          if (data.customer.phone && !phone) {
            setPhone(data.customer.phone);
            if (sameAsPhone) {
              setWhatsapp(data.customer.phone);
            }
          }
          if (data.customer.address && !houseNo && !streetArea) {
            // Pre-fill street/area with existing full address
            setStreetArea(data.customer.address);
          }
        }
      } catch (err) {
        // Guest user fallback
      }
    };
    fetchCustomerSession();
  }, []);

  const configuredUpiId = settings?.upiId || "midnightfuel@upi";
  const businessName = settings?.businessName || "Midnight Fuel";

  // UPI deep link & QR
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(configuredUpiId)}&pn=${encodeURIComponent(businessName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Midnight Fuel Order")}`;
  const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiDeepLink)}`;

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, "");
    setPhone(clean);
    if (sameAsPhone) {
      setWhatsapp(clean);
    }
  };

  const handleSamePhoneToggle = (checked: boolean) => {
    setSameAsPhone(checked);
    if (checked) {
      setWhatsapp(phone);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(configuredUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 300) {
      setSpecialNote(val);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!status.isOpen) {
      setErrorMessage(status.message || "The kitchen is currently closed. Orders cannot be placed right now.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const cleanWhatsapp = (sameAsPhone ? phone : whatsapp).replace(/[^0-9]/g, "");

    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (cleanWhatsapp.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit WhatsApp number.");
      return;
    }

    let fullAddress = "";
    if (orderType === "DELIVERY") {
      if (!houseNo.trim() || !streetArea.trim() || !pincode.trim()) {
        setErrorMessage("Please complete your delivery address details.");
        return;
      }
      fullAddress = `${houseNo.trim()}, ${streetArea.trim()}${
        landmark ? `, Near ${landmark.trim()}` : ""
      }, ${city.trim()} - ${pincode.trim()}`;
    }

    setIsSubmitting(true);

    try {
      const regularProductItems = items
        .filter((i) => !i.isCombo)
        .map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
        }));

      const comboOrderItems = items
        .filter((i) => i.isCombo)
        .map((c) => ({
          comboId: c.comboId,
          name: c.name,
          quantity: c.quantity,
        }));

      const payload = {
        customerName: fullName.trim(),
        customerPhone: cleanPhone,
        customerWhatsapp: cleanWhatsapp,
        orderType,
        deliveryAddress: orderType === "DELIVERY" ? fullAddress : undefined,
        specialNote: specialNote.trim() ? specialNote.trim() : null,
        paymentMethod,
        items: regularProductItems,
        combos: comboOrderItems,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to place order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Clear cart
      clearCart();

      // Redirect to confirmation screen
      router.push(`/order-success?orderId=${data.order.id}&orderNumber=${data.order.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-2xl font-extrabold text-white">Your cart is empty</h2>
          <p className="text-xs text-zinc-400">Please add items before checking out.</p>
          <Link
            href="/menu"
            className="inline-block px-6 py-3 rounded-xl bg-primary text-black font-bold text-xs uppercase shadow-glow"
          >
            Explore Menu
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">
            CHECKOUT
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Fast late-night ordering. WhatsApp updates, Cash on Delivery and Direct UPI. Zero GST.
          </p>
        </div>

        {/* Store Closed Warning Banner */}
        {!status.isOpen && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/80 border border-amber-500/80 text-amber-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-glow">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 flex-shrink-0 text-amber-400" />
              <div>
                <strong className="block font-bold">{businessName} is Currently Closed</strong>
                <span className="text-xs text-amber-300">
                  {status.message}
                </span>
              </div>
            </div>
            <Link
              href="/menu"
              className="px-3.5 py-2 rounded-xl bg-surface border border-amber-600/60 text-xs font-bold text-white hover:bg-amber-900/60 whitespace-nowrap min-h-[40px] flex items-center justify-center w-full sm:w-auto"
            >
              Browse Menu
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left: Contact Info, Address & Payment */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Step 1: Contact Details (Strictly Name, Phone, WhatsApp) */}
            <div className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-card">
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 font-heading">
                <Phone className="w-4 h-4 text-primary" /> 1. Customer Contact Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                  />
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      WhatsApp Number *
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      disabled={sameAsPhone}
                      maxLength={10}
                      value={sameAsPhone ? phone : whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="98765 43210"
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-75 min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Checkbox: WhatsApp number is same as mobile number */}
                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 font-semibold cursor-pointer bg-surface-raised/50 p-3 rounded-xl border border-border min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => handleSamePhoneToggle(e.target.checked)}
                      className="rounded border-zinc-700 bg-surface text-primary w-4 h-4 focus:ring-0"
                    />
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp number is same as mobile number</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Step 2: Order Type & Delivery Address */}
            <div className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 font-heading">
                  <MapPin className="w-4 h-4 text-primary" /> 2. Order Type & Address
                </h2>

                <div className="grid grid-cols-2 gap-2 bg-surface-raised p-1 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setOrderType("DELIVERY")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] ${
                      orderType === "DELIVERY"
                        ? "bg-primary text-black shadow-glow font-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Home Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("PICKUP")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] ${
                      orderType === "PICKUP"
                        ? "bg-primary text-black shadow-glow font-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Pickup
                  </button>
                </div>
              </div>

              {orderType === "DELIVERY" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      House / Flat / Door Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={houseNo}
                      onChange={(e) => setHouseNo(e.target.value)}
                      placeholder="e.g. Flat 3B, Plot 14, Lotus Heights"
                      className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Street / Area / Locality *
                    </label>
                    <input
                      type="text"
                      required
                      value={streetArea}
                      onChange={(e) => setStreetArea(e.target.value)}
                      placeholder="e.g. Main Road, Palayamkottai"
                      className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Oxford School"
                      className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      City / District *
                    </label>
                    <select
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-primary transition-colors min-h-[44px] font-bold cursor-default"
                    >
                      <option value="Tirunelveli">Tirunelveli (Service Area)</option>
                    </select>
                    <span className="text-[10px] text-primary font-semibold block mt-1">
                      ⚡ Midnight delivery exclusively across Tirunelveli
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="627001"
                      className="w-full rounded-xl bg-surface-raised border border-border px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 sm:p-4 rounded-xl bg-surface-raised border border-border/80 text-xs text-zinc-300 space-y-1">
                  <p className="font-bold text-white">Pick Up Location:</p>
                  <p>{settings?.address || "Midnight Fuel Cloud Kitchen, 123 Food Street, Late Night Hub, Tirunelveli - 627001"}</p>
                  <p className="text-primary font-semibold">Your food will be ready for pickup in 20–25 minutes.</p>
                </div>
              )}
            </div>

            {/* Step 3: Special Note / Request Box (100% width, min 100px height) */}
            <div className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-2.5 shadow-card w-full">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
                  <MessageSquare className="w-4 h-4 text-primary" /> 3. Special Request / Kitchen Note
                </h2>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {specialNote.length} / 300
                </span>
              </div>

              <textarea
                rows={3}
                maxLength={300}
                value={specialNote}
                onChange={handleNoteChange}
                placeholder="Any special request? Example: Less spicy, no onions, extra sauce, please pack separately..."
                className="w-full min-h-[100px] rounded-xl bg-surface-raised border border-border p-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors resize-none"
              />

              <p className="text-[10px] sm:text-[11px] text-zinc-500 italic">
                "Special requests are subject to kitchen availability." (0 extra cost)
              </p>
            </div>

            {/* Step 4: Payment Method — Cash on Delivery (COD) */}
            <div className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-card">
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 font-heading">
                <Banknote className="w-4 h-4 text-primary" /> 4. Payment Method
              </h2>

              {/* Touch-Friendly Payment Cards */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* Cash on Delivery Card */}
                <div
                  onClick={() => setPaymentMethod("COD")}
                  className="p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between min-h-[90px] bg-primary/10 border-primary shadow-glow text-white ring-1 ring-primary/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Banknote className="w-6 h-6 text-primary" />
                    <input
                      type="radio"
                      name="payment"
                      checked={true}
                      readOnly
                      className="text-primary w-4 h-4"
                    />
                  </div>
                  <div>
                    <span className="text-sm font-black block text-white">💵 CASH ON DELIVERY (COD)</span>
                    <span className="text-xs text-zinc-400 mt-0.5 block">
                      Pay cash when your hot food arrives at your doorstep or pickup
                    </span>
                  </div>
                </div>

                {/* 
                // UPI / Online payment option commented out for now — will be re-enabled in future updates
                <div
                  onClick={() => setPaymentMethod("UPI")}
                  className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between min-h-[90px] ${
                    paymentMethod === "UPI"
                      ? "bg-primary/10 border-primary shadow-glow text-white ring-1 ring-primary/40"
                      : "bg-surface-raised border-border text-zinc-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <QrCode className="w-6 h-6 text-emerald-400" />
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "UPI"}
                      onChange={() => setPaymentMethod("UPI")}
                      className="text-primary w-4 h-4"
                    />
                  </div>
                  <div>
                    <span className="text-sm font-black block text-white">📱 UPI</span>
                    <span className="text-xs text-zinc-400 mt-0.5 block">
                      Pay using UPI (GPay, PhonePe, Paytm)
                    </span>
                  </div>
                </div>
                */}
              </div>

              {/* 
              // Dedicated UPI Box (Commented out)
              {paymentMethod === "UPI" && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e0e] border border-emerald-500/40 space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between border-b border-border/60 pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-heading">
                        {businessName} • UPI
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 font-bold self-start xs:self-auto">
                      Direct Kitchen Transfer
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5 items-center">
                    <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-white text-black shadow-lg">
                      <img
                        src={upiQrCodeUrl}
                        alt="Midnight Fuel UPI QR"
                        className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-lg"
                      />
                      <span className="text-[10px] font-bold text-zinc-700 uppercase mt-1">
                        Scan with any UPI App
                      </span>
                    </div>

                    <div className="sm:col-span-7 space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                          Payable Amount
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-primary">
                          {formatINR(grandTotal)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                          Kitchen UPI ID
                        </span>
                        <div className="flex items-center gap-2 bg-surface-raised p-2 rounded-xl border border-border">
                          <code className="text-emerald-400 font-mono text-xs flex-1 font-bold truncate">
                            {configuredUpiId}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-emerald-950 border border-border text-zinc-300 hover:text-emerald-400 flex items-center gap-1 text-[11px] font-bold min-h-[36px]"
                          >
                            {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedUpi ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <a
                          href={upiDeepLink}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow min-h-[44px]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Pay with UPI App (Mobile)
                        </a>
                      </div>

                      <p className="text-[10px] text-zinc-400 italic">
                        After transferring, click "Place Order" below. Kitchen admin will verify the payment and accept your order.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              */}
            </div>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:col-span-5 space-y-6 w-full">
            <div className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-card">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-heading">
                  Order Summary ({itemCount} items)
                </h3>
                <Link href="/cart" className="text-xs text-primary hover:underline font-semibold">
                  Edit Cart
                </Link>
              </div>

              {/* Itemized Mini List */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity;

                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-primary flex-shrink-0">{item.quantity}×</span>
                        <span className="text-white font-medium truncate">{item.name}</span>
                      </div>
                      <span className="text-zinc-300 font-semibold flex-shrink-0">
                        {formatINR(itemTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Display special note snippet if entered */}
              {specialNote.trim() && (
                <div className="p-2.5 rounded-xl bg-surface-raised border border-border text-[11px] text-zinc-300 space-y-0.5">
                  <span className="font-bold text-primary block flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Kitchen Note:
                  </span>
                  <p className="text-zinc-400 italic line-clamp-2">"{specialNote}"</p>
                </div>
              )}

              {/* Price Breakdown (NO GST, NO COUPON, NO NOTE CHARGE) */}
              <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Food Subtotal</span>
                  <span className="text-white font-semibold">{formatINR(subtotal)}</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <div>
                    <span>Delivery Charge</span>
                    {orderType === "DELIVERY" && (
                      <span className="text-[10px] text-zinc-500 block">
                        Estimated / confirmed by team
                      </span>
                    )}
                  </div>
                  <span className="text-white font-semibold">
                    {orderType === "PICKUP" ? (
                      <span className="text-emerald-400 font-bold">FREE</span>
                    ) : (
                      formatINR(deliveryCharge)
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-border/80 flex items-center justify-between text-base">
                  <div>
                    <span className="font-extrabold text-white font-heading block text-sm sm:text-base">Grand Total</span>
                    <span className="text-[10px] text-zinc-500">No GST • Zero Note Fee</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-primary font-heading">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Final Prominent Place Order Button (Min 50px touch height) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !status.isOpen}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-orange-600 hover:from-primary-hover hover:to-orange-500 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 min-h-[52px]"
                >
                  {isSubmitting ? (
                    <span>Placing Your Order...</span>
                  ) : !status.isOpen ? (
                    <span>Store is Currently Closed</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 stroke-[2.5]" />
                      <span>PLACE ORDER — {formatINR(grandTotal)}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Instant WhatsApp Order Confirmation & Live Tracking</span>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

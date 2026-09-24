import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { StoreProvider } from "@/context/StoreContext";
import MobileCartBar from "@/components/customer/MobileCartBar";

export const metadata: Metadata = {
  title: "Midnight Fuel | Late Night Food Delivery (7 PM – 2 AM)",
  description:
    "Order fresh and delicious food from Midnight Fuel, your late-night cloud kitchen serving authentic Mandhi, crispy chicken, burgers, and gravies from 7 PM to 2 AM.",
  keywords: [
    "Midnight Fuel",
    "Late night food delivery",
    "Mandhi",
    "Fried Chicken",
    "Midnight Burger",
    "Tirunelveli food delivery",
    "Cloud kitchen",
  ],
  openGraph: {
    title: "Midnight Fuel | Your Midnight Hunger, Fueled.",
    description:
      "Fresh, hot and delicious food delivered from 7 PM to 2 AM. Mandhi, Burgers, Fried Chicken, Gravies & Shakes.",
    url: "https://midnightfuel.com",
    siteName: "Midnight Fuel",
    locale: "en_IN",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-black">
        <StoreProvider>
          <CartProvider>
            {children}
            <MobileCartBar />
          </CartProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

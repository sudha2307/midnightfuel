import { NextRequest, NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/phone";
import { signCustomerToken, CUSTOMER_COOKIE_CONFIG } from "@/lib/auth";
import prisma from "@/lib/prisma";

// In-memory OTP storage (preserved for optional future OTP verification)
export const otpStore = new Map<string, { code: string; expiresAt: number; name?: string }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name } = body;

    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Direct Instant Sign-in: Upsert customer record
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    const customerName = name?.trim() || customer?.name || "Customer";

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: cleanPhone,
          whatsapp: cleanPhone,
        },
      });
    } else if (name && name.trim() && customer.name !== name.trim()) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name: name.trim() },
      });
    }

    // Sign secure customer JWT token
    const token = await signCustomerToken({
      customerId: customer.id,
      phone: customer.phone,
      name: customer.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Customer logged in successfully",
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        whatsapp: customer.whatsapp,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set(
      CUSTOMER_COOKIE_CONFIG.name,
      token,
      CUSTOMER_COOKIE_CONFIG.options
    );

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}

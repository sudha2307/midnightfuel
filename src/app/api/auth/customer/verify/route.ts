import { NextRequest, NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/phone";
import { signCustomerToken, CUSTOMER_COOKIE_CONFIG } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { otpStore } from "../login/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp, name } = body;

    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number." },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json(
        { success: false, error: "Please enter the 6-digit OTP." },
        { status: 400 }
      );
    }

    // Verify OTP
    const stored = otpStore.get(cleanPhone);
    const isValidOtp =
      (stored && stored.code === otp.trim() && stored.expiresAt > Date.now()) ||
      otp.trim() === "123456"; // Default universal test OTP

    if (!isValidOtp) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP. Please try again." },
        { status: 400 }
      );
    }

    // OTP is valid - clear from store
    otpStore.delete(cleanPhone);

    // Upsert customer record (SINGLE CUSTOMER GUARANTEE)
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    const customerName = name?.trim() || stored?.name || customer?.name || "Customer";

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
      message: "Customer authenticated successfully",
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
      { success: false, error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}

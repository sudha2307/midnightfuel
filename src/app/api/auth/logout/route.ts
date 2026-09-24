import { NextResponse } from "next/server";
import { ADMIN_COOKIE_CONFIG } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete(ADMIN_COOKIE_CONFIG.name);
  return response;
}

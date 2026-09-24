import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  signAdminToken as signAdminTokenWeb,
  verifyAdminToken as verifyAdminTokenWeb,
  signCustomerToken as signCustomerTokenWeb,
  verifyCustomerToken as verifyCustomerTokenWeb,
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
  AdminSessionPayload,
  CustomerSessionPayload,
} from "./token";

export type { AdminSessionPayload, CustomerSessionPayload };
export { ADMIN_COOKIE_NAME, CUSTOMER_COOKIE_NAME };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ========================================================================= */
/* ADMIN AUTHENTICATION                                                      */
/* ========================================================================= */

export async function signAdminToken(payload: Omit<AdminSessionPayload, "exp">): Promise<string> {
  return signAdminTokenWeb(payload);
}

export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  return verifyAdminTokenWeb(token);
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export const ADMIN_COOKIE_CONFIG = {
  name: ADMIN_COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  },
};

/* ========================================================================= */
/* CUSTOMER AUTHENTICATION & SESSION IDENTIFICATION                          */
/* ========================================================================= */

export async function signCustomerToken(
  payload: Omit<CustomerSessionPayload, "exp">
): Promise<string> {
  return signCustomerTokenWeb(payload);
}

export async function verifyCustomerToken(
  token: string
): Promise<CustomerSessionPayload | null> {
  return verifyCustomerTokenWeb(token);
}

export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export const CUSTOMER_COOKIE_CONFIG = {
  name: CUSTOMER_COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    path: "/",
  },
};

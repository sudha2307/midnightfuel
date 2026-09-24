const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "midnight-fuel-super-secret-auth-key-2026-production-ready";

export const ADMIN_COOKIE_NAME = "mf_admin_token";
export const CUSTOMER_COOKIE_NAME = "mf_customer_token";

export interface AdminSessionPayload {
  adminId: string;
  username: string;
  name: string;
  role: string;
  exp: number;
}

export interface CustomerSessionPayload {
  customerId: string;
  phone: string;
  name: string;
  exp: number;
}

// Convert string to Uint8Array with proper ArrayBuffer
function strToUint8(str: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(str);
  const copy = new Uint8Array(encoded.length);
  copy.set(encoded);
  return copy;
}

// Base64URL encode
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Base64URL decode
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

// Web Crypto HMAC-SHA256 Sign
async function createHmacSha256(data: string, secret: string): Promise<string> {
  const keyBytes = strToUint8(secret);
  const dataBytes = strToUint8(data);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, dataBytes.buffer);
  return base64UrlEncode(new Uint8Array(signature));
}

// Web Crypto HMAC-SHA256 Verify
async function verifyHmacSha256(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const keyBytes = strToUint8(secret);
  const dataBytes = strToUint8(data);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  let sigBase64 = signature.replace(/-/g, "+").replace(/_/g, "/");
  while (sigBase64.length % 4) {
    sigBase64 += "=";
  }
  const binarySig = atob(sigBase64);
  const sigBytes = new Uint8Array(binarySig.length);
  for (let i = 0; i < binarySig.length; i++) {
    sigBytes[i] = binarySig.charCodeAt(i);
  }

  return crypto.subtle.verify("HMAC", key, sigBytes.buffer, dataBytes.buffer);
}

/* ========================================================================= */
/* ADMIN TOKEN                                                               */
/* ========================================================================= */

export async function signAdminToken(
  payload: Omit<AdminSessionPayload, "exp">
): Promise<string> {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data: AdminSessionPayload = { ...payload, exp };
  const jsonStr = JSON.stringify(data);
  const base64Data = base64UrlEncode(strToUint8(jsonStr));
  const signature = await createHmacSha256(base64Data, AUTH_SECRET);
  return `${base64Data}.${signature}`;
}

export async function verifyAdminToken(
  token: string
): Promise<AdminSessionPayload | null> {
  try {
    const [base64Data, signature] = token.split(".");
    if (!base64Data || !signature) return null;

    const isValid = await verifyHmacSha256(base64Data, signature, AUTH_SECRET);
    if (!isValid) return null;

    const jsonStr = base64UrlDecode(base64Data);
    const payload = JSON.parse(jsonStr) as AdminSessionPayload;

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/* ========================================================================= */
/* CUSTOMER TOKEN                                                            */
/* ========================================================================= */

export async function signCustomerToken(
  payload: Omit<CustomerSessionPayload, "exp">
): Promise<string> {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const data: CustomerSessionPayload = { ...payload, exp };
  const jsonStr = JSON.stringify(data);
  const base64Data = base64UrlEncode(strToUint8(jsonStr));
  const signature = await createHmacSha256(base64Data, AUTH_SECRET);
  return `${base64Data}.${signature}`;
}

export async function verifyCustomerToken(
  token: string
): Promise<CustomerSessionPayload | null> {
  try {
    const [base64Data, signature] = token.split(".");
    if (!base64Data || !signature) return null;

    const isValid = await verifyHmacSha256(base64Data, signature, AUTH_SECRET);
    if (!isValid) return null;

    const jsonStr = base64UrlDecode(base64Data);
    const payload = JSON.parse(jsonStr) as CustomerSessionPayload;

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

import { JwtPayload, sign, verify } from "jsonwebtoken"
import crypto from "crypto"

const ADMIN_COOKIE = "admin_auth_token"
const TWO_FACTOR_TTL_MS = 10 * 60 * 1000
const RESET_TTL_MS = 30 * 60 * 1000
export const MAX_LOGIN_ATTEMPTS = 5
export const MAX_2FA_ATTEMPTS = 5
export const LOCKOUT_MS = 15 * 60 * 1000

export function createAdminSessionToken(payload: { userId: string; schoolCode: string }) {
  return sign({ ...payload, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: "1h" })
}

export function createTwoFactorToken(payload: { userId: string; schoolCode: string; email: string }) {
  return sign({ ...payload, purpose: "admin_2fa" }, process.env.JWT_SECRET!, { expiresIn: "10m" })
}

export function verifyTwoFactorToken(token: string): { userId: string; schoolCode: string; email: string } | null {
  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload & {
      purpose?: string
      userId?: string
      schoolCode?: string
      email?: string
    }
    if (decoded?.purpose !== "admin_2fa" || !decoded?.userId || !decoded?.schoolCode) return null
    return {
      userId: decoded.userId,
      schoolCode: decoded.schoolCode,
      email: decoded.email,
    }
  } catch {
    return null
  }
}

export function verifyAdminSessionToken(token: string): { userId: string; schoolCode: string; role: string } | null {
  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload & {
      userId?: string
      schoolCode?: string
      role?: string
    }
    if (!decoded?.userId || !decoded?.schoolCode || decoded?.role !== "admin") return null
    return {
      userId: decoded.userId,
      schoolCode: decoded.schoolCode,
      role: decoded.role,
    }
  } catch {
    return null
  }
}

export function getAdminCookieName() {
  return ADMIN_COOKIE
}

export function generateTwoFactorCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function getTwoFactorExpiryDate() {
  return new Date(Date.now() + TWO_FACTOR_TTL_MS)
}

export function getResetExpiryDate() {
  return new Date(Date.now() + RESET_TTL_MS)
}

export function getLockoutExpiryDate() {
  return new Date(Date.now() + LOCKOUT_MS)
}

export function buildAdminResetLink(schoolCode: string, resetToken: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
  return `${baseUrl}/schools/${schoolCode}/reset-password?token=${encodeURIComponent(resetToken)}`
}

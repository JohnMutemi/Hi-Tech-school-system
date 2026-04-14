import { sign, verify } from 'jsonwebtoken'

interface EmailDownloadTokenPayload {
  purpose: 'email_download'
  schoolCode: string
  studentId: string
  receiptNumber?: string
}

const EMAIL_DOWNLOAD_TOKEN_EXPIRY = process.env.EMAIL_DOWNLOAD_TOKEN_EXPIRY || '7d'

export function createEmailDownloadToken(payload: {
  schoolCode: string
  studentId: string
  receiptNumber?: string
}): string | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null

  return sign(
    {
      purpose: 'email_download',
      schoolCode: payload.schoolCode.toLowerCase(),
      studentId: payload.studentId,
      ...(payload.receiptNumber ? { receiptNumber: payload.receiptNumber } : {}),
    } satisfies EmailDownloadTokenPayload,
    secret,
    { expiresIn: EMAIL_DOWNLOAD_TOKEN_EXPIRY }
  )
}

export function verifyEmailDownloadToken(
  token: string | null | undefined
): EmailDownloadTokenPayload | null {
  if (!token) return null
  const secret = process.env.JWT_SECRET
  if (!secret) return null

  try {
    const payload = verify(token, secret) as EmailDownloadTokenPayload
    if (payload.purpose !== 'email_download') return null
    if (!payload.schoolCode || !payload.studentId) return null
    return payload
  } catch {
    return null
  }
}

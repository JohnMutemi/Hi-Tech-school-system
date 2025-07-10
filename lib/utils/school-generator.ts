export function generateSchoolCode(schoolName: string): string {
  // Remove special characters and spaces, take first 3 letters + random number
  const cleanName = schoolName.replace(/[^a-zA-Z]/g, "").toUpperCase()
  const prefix = cleanName.substring(0, 3) || "SCH"
  const suffix = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}${suffix}`
}

export function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function generateTempPassword(): string {
  // Generate a temporary password
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let password = ""
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function generatePortalUrl(domain: string, schoolCode: string): string {
  return `${domain}/schools/${schoolCode.toLowerCase()}`
}

/**
 * Generate the next admission number for a school based on a customizable format.
 * Supported variables: {SCHOOL_CODE}, {YEAR}, {SEQ}
 * @param format - The format string (e.g., "{SCHOOL_CODE}-{YEAR}-{SEQ}")
 * @param lastAdmissionNumber - The last used admission number (e.g., "ABC-2024-001")
 * @param schoolCode - The school's code (e.g., "ABC")
 * @param year - The current year (e.g., 2024)
 * @returns The next admission number (e.g., "ABC-2024-002")
 */
export function generateNextAdmissionNumber({
  format,
  lastAdmissionNumber,
  schoolCode,
  year,
  minSeqLength = 3,
}: {
  format: string
  lastAdmissionNumber?: string
  schoolCode: string
  year: number
  minSeqLength?: number
}): string {
  // Extract the last sequence number from the last admission number
  let nextSeq = 1
  if (lastAdmissionNumber) {
    // Try to find the last sequence number (assume it's the last group of digits)
    const match = lastAdmissionNumber.match(/(\d+)(?!.*\d)/)
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1
    }
  }
  // Pad the sequence with leading zeros
  const seqStr = String(nextSeq).padStart(minSeqLength, "0")
  // Replace variables in the format
  let admissionNumber = format
    .replace(/\{SCHOOL_CODE\}/g, schoolCode)
    .replace(/\{YEAR\}/g, String(year))
    .replace(/\{SEQ\}/g, seqStr)
  return admissionNumber
}

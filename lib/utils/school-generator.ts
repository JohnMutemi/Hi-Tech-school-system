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

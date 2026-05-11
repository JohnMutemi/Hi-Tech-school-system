import nodemailer from "nodemailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"

function getMailerConfig() {
  const provider = (process.env.EMAIL_PROVIDER || "smtp").toLowerCase()
  const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.SMTP_USER
  const fromName = process.env.EMAIL_FROM_NAME || "Hi-Tech School Management"

  if (!fromEmail || !process.env.SMTP_HOST || !process.env.SMTP_PASS) return null

  const isGmail = provider === "gmail" || process.env.SMTP_HOST === "smtp.gmail.com"
  return {
    fromEmail,
    fromName,
    transport: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: (process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER || fromEmail,
        pass: process.env.SMTP_PASS,
      },
      ...(isGmail ? { service: "gmail", tls: { rejectUnauthorized: false } } : {}),
    },
  }
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const config = getMailerConfig()
  if (!config) return false
  const transporter = nodemailer.createTransport(config.transport as SMTPTransport.Options)
  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to,
    subject,
    html,
    text,
  })
  return true
}

export async function sendAdminResetEmail(to: string, schoolName: string, resetLink: string) {
  const subject = `${schoolName}: Reset your admin password`
  const html = `<p>Your admin account requires a password change.</p><p><a href="${resetLink}">Reset password</a></p><p>This link expires in 30 minutes.</p>`
  const text = `Your admin account requires a password change.\nReset password: ${resetLink}\nThis link expires in 30 minutes.`
  return sendEmail(to, subject, html, text)
}

export async function sendAdminTwoFactorCodeEmail(to: string, schoolName: string, code: string) {
  const subject = `${schoolName}: Your login verification code`
  const html = `<p>Use this one-time login code: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`
  const text = `Use this one-time login code: ${code}\nIt expires in 10 minutes.`
  return sendEmail(to, subject, html, text)
}

export async function sendFinanceResetEmail(to: string, schoolName: string, resetLink: string) {
  const subject = `${schoolName}: Reset your finance password`
  const html = `<p>You requested to reset your finance account password.</p><p><a href="${resetLink}">Reset password</a></p><p>This link expires in 30 minutes.</p>`
  const text = `You requested to reset your finance account password.\nReset password: ${resetLink}\nThis link expires in 30 minutes.`
  return sendEmail(to, subject, html, text)
}

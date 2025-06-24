import { getIronSession } from "iron-session"
import { cookies } from "next/headers"

export interface SessionData {
  isLoggedIn: boolean
  id: string
  email: string
  name: string
  role: string
}

export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: "hitechsms-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
}

export const getSession = () => {
  const session = getIronSession<SessionData>(cookies(), sessionOptions)
  return session
} 
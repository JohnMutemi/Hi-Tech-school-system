import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  isLoggedIn: boolean
  id?: string
  name?: string
  email?: string
  role?: string
}

export function useUser({ redirectTo = '', redirectIfFound = false } = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | undefined>()

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/superadmin/user')
        const data: User = await res.json()
        setUser(data)
      } catch (error) {
        setUser({ isLoggedIn: false })
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (user && redirectTo) {
      if ((redirectIfFound && user.isLoggedIn) || (!redirectIfFound && !user.isLoggedIn)) {
        router.push(redirectTo)
      }
    }
  }, [user, redirectIfFound, redirectTo, router])

  return { user }
} 
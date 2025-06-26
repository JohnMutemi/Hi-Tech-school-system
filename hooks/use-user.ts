import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/navigation'

interface User {
  isLoggedIn: boolean
  id?: string
  name?: string
  email?: string
  role?: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useUser({ redirectTo = '', redirectIfFound = false, enabled = true } = {}) {
  const router = useRouter()
  const { data: user, error, isLoading } = useSWR<User>(
    enabled ? '/api/superadmin/user' : null, 
    fetcher
  )

  // Handle redirects based on user state
  if (user && redirectTo) {
    if ((redirectIfFound && user.isLoggedIn) || (!redirectIfFound && !user.isLoggedIn)) {
      router.push(redirectTo)
    }
  }

  return { user, isLoading, error }
}

export { mutate } 
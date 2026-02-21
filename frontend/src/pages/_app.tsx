import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { Toaster } from '@/components/ui/sonner'
import { useEffect, useSyncExternalStore } from 'react'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { pathname } = router
  const token = useSyncExternalStore(subscribe, getToken, () => null)
  const isAuthPage = pathname === '/login'

  useEffect(() => {
    if (!token && !isAuthPage) {
      router.replace('/login')
    }
  }, [token, isAuthPage, router])

  if (!token && !isAuthPage) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  )
}

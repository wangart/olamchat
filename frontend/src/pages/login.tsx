import { useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { login, signup } from '@/lib/api'
import { Geist } from 'next/font/google'
import { SparklesIcon, Loader2Icon } from 'lucide-react'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSignup) {
        await signup(email, password)
      } else {
        await login(email, password)
      }
      router.push('/')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`${geistSans.variable} flex min-h-screen items-center justify-center bg-[#141414] font-sans`}
    >
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600">
            <SparklesIcon className="size-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">
            {isSignup ? 'Create an account' : 'Welcome back'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-500/40 focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-500/40 focus:outline-none"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            {isLoading && <Loader2Icon className="size-4 animate-spin" />}
            {isSignup ? 'Sign up' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-white/40">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-violet-400 hover:text-violet-300"
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { redirectByRole } from '@/lib/auth/redirect-by-role'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    await redirectByRole(supabase, router)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-arinoe text-3xl">Welcome back</CardTitle>
        <CardDescription className="font-abel">Log in to your Doula Hive account</CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-abel text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-abel">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-abel">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-dark-green px-4 py-2.5 font-abel font-bold text-cotton transition-colors duration-200 hover:bg-popping-pink hover:text-cotton disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
          <p className="text-center text-sm font-abel text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline underline-offset-4 transition-colors duration-200 hover:text-popping-pink">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

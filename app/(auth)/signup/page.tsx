'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { redirectByRole } from '@/lib/auth/redirect-by-role'
import { Button } from '@/components/ui/button'
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
import type { Role } from '@/lib/types/database'

export default function SignupPage() {
  const router = useRouter()

  const [role, setRole]         = useState<Role | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id:        data.user.id,
        email:     data.user.email ?? email,
        role,
        full_name: fullName,
      })
    }

    await redirectByRole(supabase, router)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-arinoe text-3xl">Create your account</CardTitle>
        <CardDescription className="font-abel">Who are you joining as?</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Role selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('doula')}
            className={`rounded-xl border-2 px-4 py-5 text-center font-abel text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              role === 'doula'
                ? 'border-dark-green bg-dark-green/5 text-dark-green'
                : 'border-dark-green/30 text-muted-foreground hover:border-dark-green'
            }`}
          >
            <span className="block text-2xl mb-1">🤝</span>
            I&apos;m a doula
          </button>
          <button
            type="button"
            onClick={() => setRole('family')}
            className={`rounded-xl border-2 px-4 py-5 text-center font-abel text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              role === 'family'
                ? 'border-dark-green bg-dark-green/5 text-dark-green'
                : 'border-dark-green/30 text-muted-foreground hover:border-dark-green'
            }`}
          >
            <span className="block text-2xl mb-1">🌱</span>
            I&apos;m expecting
          </button>
        </div>

        {/* Fields revealed after role is picked */}
        {role && (
          <form id="signup-form" onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-abel text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="full-name" className="font-abel">Full name</Label>
              <Input
                id="full-name"
                type="text"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

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
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {role && (
          <Button
            type="submit"
            form="signup-form"
            className="w-full font-abel"
            disabled={loading}
          >
            {loading
              ? 'Creating account…'
              : `Continue as ${role === 'doula' ? 'a doula' : 'expecting family'}`}
          </Button>
        )}
        <p className="text-center text-sm font-abel text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-4 hover:text-dark-green">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

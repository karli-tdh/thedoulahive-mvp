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

  const [role, setRole] = useState<Role | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setError(null)
    setLoading(true)

    // createClient() is called here so it only runs in the browser
    const supabase = createClient()

    // 1. Create the auth user — pass role + name in metadata so the DB
    //    trigger stamps them on the profiles row automatically
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

    // 2. Upsert the profile row — handles both paths:
    //    a) trigger already created the row → update it with full_name
    //    b) trigger didn't fire (manually-created user) → insert fresh row
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email ?? email,
        role,
        full_name: fullName,
      })
    }

    // 3. Redirect based on role
    await redirectByRole(supabase, router)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Who are you joining as?</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Role selection — always visible */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('doula')}
            className={`rounded-lg border-2 px-4 py-5 text-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              role === 'doula'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            <span className="block text-2xl mb-1">🤝</span>
            I&apos;m a doula
          </button>
          <button
            type="button"
            onClick={() => setRole('family')}
            className={`rounded-lg border-2 px-4 py-5 text-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              role === 'family'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
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
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="full-name">Full name</Label>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
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
            className="w-full"
            disabled={loading}
          >
            {loading
              ? 'Creating account…'
              : `Continue as ${role === 'doula' ? 'a doula' : 'expecting family'}`}
          </Button>
        )}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

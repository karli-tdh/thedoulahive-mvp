'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HandHeart, Flower, CaretRight } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { redirectByRole } from '@/lib/auth/redirect-by-role'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <div className="space-y-6">

      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="font-arinoe text-3xl text-dark-green">Create Your Account</h1>
        <p className="font-abel text-base text-dark-green/70">
          We&apos;re so happy you&apos;re here!
        </p>
      </div>

      {/* Role selector tiles */}
      <div className="grid grid-cols-2 gap-4">

        {/* Doula tile */}
        <button
          type="button"
          onClick={() => setRole('doula')}
          className={`group flex flex-col items-center justify-center gap-3 rounded-2xl px-4 py-14 font-abel font-bold text-base transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-green focus-visible:ring-offset-2
            bg-dark-green text-cotton
            ${role === 'doula'
              ? 'ring-2 ring-dark-green ring-offset-2 opacity-100'
              : role !== null
                ? 'opacity-50'
                : 'opacity-100 hover:bg-[#0a5249]'
            }`}
        >
          <HandHeart size={36} weight="duotone" />
          <span className="flex items-center gap-1">
            I&apos;m a doula
            <CaretRight
              size={16}
              weight="bold"
              className="opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
            />
          </span>
        </button>

        {/* Family tile */}
        <button
          type="button"
          onClick={() => setRole('family')}
          className={`group flex flex-col items-center justify-center gap-3 rounded-2xl px-4 py-14 font-abel font-bold text-base transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-green focus-visible:ring-offset-2
            bg-light-pink text-dark-green
            ${role === 'family'
              ? 'ring-2 ring-dark-green ring-offset-2 opacity-100'
              : role !== null
                ? 'opacity-50'
                : 'opacity-100 hover:bg-[#f8a5ce]'
            }`}
        >
          <Flower size={36} weight="duotone" />
          <span className="flex items-center gap-1">
            I&apos;m looking for a doula
            <CaretRight
              size={16}
              weight="bold"
              className="opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
            />
          </span>
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

      {/* Footer */}
      <div className="flex flex-col gap-4">
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
      </div>

    </div>
  )
}

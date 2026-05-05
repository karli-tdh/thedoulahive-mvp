'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

// ── Data ──────────────────────────────────────────────────────────────────────

const FAMILY_STEPS = [
  {
    num: 1,
    title: 'Browse',
    body: 'Watch intro videos from verified doulas. Filter by location, birth setting, and specialism to find your shortlist.',
  },
  {
    num: 2,
    title: 'Connect',
    body: 'Spot someone who feels right? Send a reaction note and your intro video. That\'s the first thing they\'ll see.',
  },
  {
    num: 3,
    title: 'Talk',
    body: 'Exchange async video messages at your own pace. No phone tag, no awkward first calls, no pressure.',
  },
  {
    num: 4,
    title: 'Find your doula',
    body: 'When it clicks, share contact details and take the next step together.',
  },
]

const DOULA_STEPS = [
  {
    num: 1,
    title: 'Build your profile',
    body: 'Record a short intro video and share the details families care about: location, birth setting, and specialisms.',
  },
  {
    num: 2,
    title: 'Go live',
    body: 'Publish when everything feels right. Your profile stays private until you\'re ready to be found.',
  },
  {
    num: 3,
    title: 'Receive requests',
    body: 'When a family connects, you\'ll see what caught their eye and their intro video. No cold enquiries, ever.',
  },
  {
    num: 4,
    title: 'Find your family',
    body: 'If it feels like a fit, open the conversation. Share contact details when you\'re both ready to take the next step.',
  },
]

// ── Hex badge ─────────────────────────────────────────────────────────────────

function HexBadge({ n }: { n: number }) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center bg-dark-green font-arinoe text-xl text-light-pink"
      style={{ clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)' }}
      aria-hidden
    >
      {n}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

type Persona = 'families' | 'doulas'

export function HowItWorks() {
  const [persona,        setPersona]        = useState<Persona>('families')
  const [visible,        setVisible]        = useState(true)
  const [nextPersona,    setNextPersona]    = useState<Persona | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When nextPersona is set, wait for the fade-out then swap content
  useEffect(() => {
    if (!nextPersona) return
    timerRef.current = setTimeout(() => {
      setPersona(nextPersona)
      setNextPersona(null)
      setVisible(true)
    }, 180)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [nextPersona])

  function switchPersona(next: Persona) {
    if (next === persona || nextPersona !== null) return
    setVisible(false)
    setNextPersona(next)
  }

  const steps = persona === 'families' ? FAMILY_STEPS : DOULA_STEPS
  const photo = persona === 'families'
    ? { src: '/images/Family-with-baby.png',   alt: 'Family with baby' }
    : { src: '/images/doulas-standing.png',    alt: 'Doulas standing together' }

  return (
    <section className="bg-cotton px-6 py-12">
      <div className="mx-auto max-w-6xl">

        {/* Heading */}
        <h2 className="mb-4 text-center font-arinoe text-[48px] text-dark-green">
          How it works
        </h2>

        {/* Persona toggle pills */}
        <div className="mb-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => switchPersona('families')}
            className={`rounded-full px-6 py-2 font-abel text-sm font-bold transition-colors duration-200
              ${persona === 'families'
                ? 'bg-dark-green text-cotton'
                : 'border-2 border-dark-green bg-transparent text-dark-green hover:bg-light-pink hover:border-light-pink'
              }`}
          >
            For Families
          </button>
          <button
            type="button"
            onClick={() => switchPersona('doulas')}
            className={`rounded-full px-6 py-2 font-abel text-sm font-bold transition-colors duration-200
              ${persona === 'doulas'
                ? 'bg-dark-green text-cotton'
                : 'border-2 border-dark-green bg-transparent text-dark-green hover:bg-light-pink hover:border-light-pink'
              }`}
          >
            For Doulas
          </button>
        </div>

        {/* Two-column grid — fades on persona switch */}
        <div
          className={`grid items-center gap-10 transition-opacity duration-200 lg:grid-cols-2
            ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Left: photo — fixed height so both images occupy the same space */}
          <div className="h-80 w-full overflow-hidden rounded-xl lg:h-96">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={640}
              height={480}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover object-top"
            />
          </div>

          {/* Right: steps */}
          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.num} className="flex items-start gap-5">
                <HexBadge n={step.num} />
                <div>
                  <h3 className="font-abel text-lg font-bold text-dark-green">
                    {step.title}
                  </h3>
                  <p className="mt-1 font-abel text-[15px] leading-relaxed text-dark-green/75">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

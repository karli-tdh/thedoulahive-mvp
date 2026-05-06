import Image from 'next/image'
import Link from 'next/link'
import { HowItWorks } from './_components/how-it-works'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1  —  SPLIT HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col lg:flex-row lg:min-h-screen">

        {/* Right column (image) — first in DOM so it appears on top on mobile */}
        <div className="relative h-[280px] bg-light-pink lg:order-2 lg:h-auto lg:w-1/2 overflow-hidden">
          <Image
            src="/images/pregnant-mum-smile.png"
            alt="Smiling pregnant woman"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-top"
            priority
          />
        </div>

        {/* Left column (text) */}
        <div className="relative flex flex-col justify-center overflow-hidden bg-cotton px-8 py-16 lg:order-1 lg:w-1/2 lg:px-16 lg:py-20">

          {/* Honeycomb shape02 — top-left, z-0 so it sits behind content — hidden on mobile */}
          <div className="pointer-events-none absolute left-0 top-0 z-0 hidden w-[440px] select-none lg:block">
            <Image
              src="/shapes/honeycombe_shape02_yellow.png"
              alt=""
              width={440}
              height={440}
              className="w-full"
              aria-hidden
            />
          </div>

          {/* Content sits above honeycomb */}
          <div className="relative z-10">

            {/* Eyebrow */}
            <p className="mb-6 font-abel text-xs font-bold uppercase tracking-[0.18em] text-dark-green">
              Where doulas and families find each other
            </p>

            {/* Logo as hero statement */}
            <div className="w-[280px] lg:w-[320px]">
              <Image
                src="/logos/DH_Primary_multi01.png"
                alt="The Doula Hive"
                width={340}
                height={340}
                className="w-full"
                priority
              />
            </div>

            {/* Subheading */}
            <p className="mt-6 max-w-[420px] font-abel text-lg leading-relaxed text-dark-green/80">
              The right doula is out there. Video profiles help you feel it before you make the call.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/doulas"
                className="inline-flex items-center justify-center rounded-xl bg-dark-green px-7 py-3 font-abel text-base font-bold text-cotton transition-opacity duration-200 hover:opacity-85"
              >
                Find a doula
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl border-2 border-dark-green bg-transparent px-7 py-3 font-abel text-base font-bold text-dark-green transition-all duration-200 hover:border-light-pink hover:bg-light-pink"
              >
                Get Started
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2  —  DARK GREEN BAND
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-12 text-center" style={{ backgroundColor: '#07403B' }}>
        <h2 className="font-arinoe text-[28px] text-cotton lg:text-[40px]">
          Birth is better together.
        </h2>
        <p className="mx-auto mt-3 max-w-xl font-abel text-base text-cotton/80">
          Fewer than 1 in 100 UK births include a doula. We&apos;re changing that.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3  —  HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════ */}
      <HowItWorks />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4  —  FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-dark-green px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">

          {/* Logo */}
          <Image
            src="/logos/DH_Primary_creamltblue.png"
            alt="The Doula Hive"
            width={192}
            height={48}
            className="h-12 w-auto"
          />

          {/* Copyright */}
          <p className="font-abel text-sm text-cotton/75">
            © 2026 The Doula Hive ·{' '}
            <a
              href="https://thedoulahive.co"
              className="underline underline-offset-4 hover:text-cotton transition-colors"
            >
              thedoulahive.co
            </a>
          </p>
        </div>
      </footer>
    </>
  )
}

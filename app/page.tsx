import Image from 'next/image'
import Link from 'next/link'

// ── How-it-works steps data ───────────────────────────────────────────────────

const STEPS = [
  {
    num: 1,
    title: 'Browse',
    body: 'Watch intro videos from verified doulas. Filter by location, setting, and specialism.',
  },
  {
    num: 2,
    title: 'Connect',
    body: "React to something specific on a doula’s profile. Your reaction note is the first thing they read.",
  },
  {
    num: 3,
    title: 'Talk',
    body: 'Exchange async video messages at your own pace. No phone tag, no pressure.',
  },
  {
    num: 4,
    title: 'Find your doula',
    body: 'When it feels right, share contact details and take the next step together.',
  },
]

// ── Hexagon number badge ──────────────────────────────────────────────────────

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

          {/* Label */}
          <p className="mb-4 font-abel text-xs font-bold uppercase tracking-[0.18em] text-dark-green">
            The digital village for families &amp; doulas
          </p>

          {/* Heading */}
          <h1 className="font-arinoe leading-none">
            <span className="block text-[24px] text-dark-green lg:text-[48px]">
              Find Your
            </span>
            <span className="block text-[56px] text-brand-orange lg:text-[96px]">
              DOULA
            </span>
          </h1>

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
              Join as a doula
            </Link>
          </div>

          {/* Honeycomb shape02 — bottom-left, absolute, full colour — hidden on mobile */}
          <div className="pointer-events-none absolute bottom-0 left-0 hidden w-[220px] select-none lg:block">
            <Image
              src="/shapes/honeycombe_shape02_yellow.png"
              alt=""
              width={220}
              height={220}
              className="w-full"
              aria-hidden
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2  —  DARK GREEN BAND
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-dark-green px-6 py-12 text-center">
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
      <section className="bg-cotton px-6 py-20">
        <div className="mx-auto max-w-6xl">

          {/* Heading */}
          <h2 className="mb-14 text-center font-arinoe text-[48px] text-dark-green">
            How it works
          </h2>

          {/* Two-column grid */}
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Left: image */}
            <div className="w-full overflow-hidden rounded-xl border-[2.5px] border-dark-green">
              <Image
                src="/images/Family-with-baby.png"
                alt="Family with baby"
                width={640}
                height={480}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full object-cover"
              />
            </div>

            {/* Right: steps */}
            <div className="space-y-8">
              {STEPS.map((step) => (
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

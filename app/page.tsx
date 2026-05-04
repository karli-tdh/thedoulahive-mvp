import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cotton px-4 text-center">

      {/* Decorative honeycomb — top-right */}
      <div className="pointer-events-none absolute right-0 top-0 w-64 select-none sm:w-80 lg:w-[420px]">
        <Image
          src="/shapes/honeycombe_shape05_yellow.png"
          alt=""
          width={420}
          height={420}
          className="w-full opacity-70"
          priority
          aria-hidden
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl">
        <h1 className="font-arinoe text-[4.5rem] leading-none text-dark-green sm:text-[5.5rem] lg:text-[6rem]">
          Find your doula
        </h1>
        <p className="mt-6 font-abel text-xl text-dark-green/80 sm:text-2xl">
          The right doula is out there. Video profiles help you feel it
          before you make the call.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* Primary */}
          <Link
            href="/doulas"
            className="inline-flex items-center justify-center rounded-xl bg-dark-green px-8 py-3.5 font-abel text-base font-medium text-cotton transition-opacity hover:opacity-85"
          >
            Find a doula
          </Link>
          {/* Outline */}
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl border-2 border-dark-green bg-transparent px-8 py-3.5 font-abel text-base font-medium text-dark-green transition-colors hover:bg-dark-green hover:text-cotton"
          >
            Join as a doula
          </Link>
        </div>
      </div>

    </main>
  )
}

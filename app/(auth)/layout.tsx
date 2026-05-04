import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cotton px-4 py-12">

      {/* Decorative honeycomb — bottom-left */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-52 select-none sm:w-72">
        <Image
          src="/shapes/honeycombe_shape01_yellow.png"
          alt=""
          width={288}
          height={288}
          className="w-full opacity-60"
          aria-hidden
        />
      </div>

      {/* Card area */}
      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <a href="/" className="inline-block hover:opacity-80 transition-opacity">
            <Image
              src="/logos/DH_Primary_creamltblue.png"
              alt="The Doula Hive"
              width={180}
              height={45}
              className="h-auto w-44"
              priority
            />
          </a>
        </div>

        {children}
      </div>
    </div>
  )
}

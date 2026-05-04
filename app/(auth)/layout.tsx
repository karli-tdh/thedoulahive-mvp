import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cotton px-4 py-12">

      {/* Card area */}
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <a href="/" className="inline-block hover:opacity-80 transition-opacity">
            <Image
              src="/logos/DH_Primary_multi01.png"
              alt="The Doula Hive"
              width={220}
              height={220}
              className="h-auto w-[220px]"
              priority
            />
          </a>
        </div>

        {children}
      </div>
    </div>
  )
}

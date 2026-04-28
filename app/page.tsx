import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Find your doula
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        The right doula is out there. Video profiles help you feel it before
        you make the call.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/doulas" className={cn(buttonVariants({ size: 'lg' }))}>
          Find a doula
        </Link>
        <Link
          href="/signup"
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
        >
          Join as a doula
        </Link>
      </div>
    </main>
  )
}

import type { Metadata } from 'next'
import { NavBar } from '@/components/nav/nav-bar'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Doula Hive',
  description: 'Find and connect with birth and postpartum doulas.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  )
}

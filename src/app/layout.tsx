import type { Metadata } from 'next'
import { Space_Grotesk, DM_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'VibeSky — Where Ideas Take Flight',
  description: 'A social platform for the curious, creative, and connected.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${dmMono.variable} font-body bg-sky-void text-white antialiased`}
      >
        {children}
      </body>
    </html>
  )
}

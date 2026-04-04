import type { Metadata } from 'next'
import { Manrope, Inter, Playfair_Display } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'FiloDesk App', template: '%s | FiloDesk' },
  description: 'Gestioná tu barbería en tiempo real.',
  robots: { index: false },
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${manrope.variable} ${inter.variable} ${playfair.variable}`}
    >

      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

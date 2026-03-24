import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FiloDesk App',
    template: '%s | FiloDesk',
  },
  description: 'Gestioná tu barbería en tiempo real.',
  robots: { index: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

import { redirect } from 'next/navigation'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import MockupCarousel from '@/components/landing/MockupCarousel'
import Features from '@/components/landing/Features'
import Pricing from '@/components/landing/Pricing'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import AuthErrorBanner from '@/components/landing/AuthErrorBanner'
import styles from '@/components/landing/landing.module.css'

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>
}) {
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`)
  }

  return (
    <>
      <Navbar />
      <AuthErrorBanner searchParams={params} />
      <Hero />
      <MockupCarousel />
      <hr className={styles.divider} />
      <Features />
      <hr className={styles.divider} />
      <Pricing />
      <CTASection />
      <Footer />
    </>
  )
}

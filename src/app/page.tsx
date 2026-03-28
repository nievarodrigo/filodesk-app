import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import SocialProof from '@/components/landing/SocialProof'
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
  const hdrs = await headers()
  const ua = (hdrs.get('user-agent') ?? '').toLowerCase()
  const isMobileDevice = /android|iphone|ipod|windows phone|blackberry|mobile/.test(ua)
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`)
  }

  return (
    <>
      <Navbar />
      <div className={styles.mobileTopbarOffset}>
        <AuthErrorBanner searchParams={params} />
        <Hero />
        <hr className={styles.divider} />
        <SocialProof />
        <hr className={styles.divider} />
        <MockupCarousel defaultViewMode={isMobileDevice ? 'mobile' : 'desktop'} />
        <hr className={styles.divider} />
        <Features />
        <hr className={styles.divider} />
        <Pricing />
        <CTASection />
        <Footer />
      </div>
    </>
  )
}

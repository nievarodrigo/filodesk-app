'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { createMPCheckoutWithMonths, createMPSubscription } from '@/app/actions/subscription'
import { createGalioPayPaymentLink } from '@/app/actions/galiopay'
import { generateTransferProofWhatsAppLink } from '@/lib/whatsapp'

// CVU y Alias de FiloDesk (hardcodeados para mostrarlos al usuario)
const FILODESK_CVU = '0070396130004005324429'
const FILODESK_ALIAS = 'FIlodeskapp'

const MONTH_OPTIONS = [
  { months: 1,  label: '1 mes',   discount: 0    },
  { months: 3,  label: '3 meses', discount: 0.08 },
  { months: 6,  label: '6 meses', discount: 0.13 },
  { months: 12, label: '1 año',   discount: 0.20 },
]

type Method = 'checkout' | 'subscription' | 'transfer' | 'transfer-inline'
type Screen = 'plans' | 'payment'

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  active: boolean
}

interface Props {
  barbershopId:       string
  barbershopName:     string
  currentPlan:        string
  subscriptionStatus: string
  trialEnd:           string | null
  plans:              Plan[]
  proAvailable:       boolean
}

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

export default function SuscripcionClient({ barbershopId, barbershopName, currentPlan, subscriptionStatus, trialEnd, plans, proAvailable }: Props) {
  // Si está en trial, solo mostrar Plan Base
  const isTrial = subscriptionStatus === 'trial'
  const visiblePlans = plans.filter((plan) => plan.id === 'base' || plan.id === 'pro')
  const [screen, setScreen] = useState<Screen>(isTrial ? 'payment' : 'plans')
  const normalizedCurrentPlan = currentPlan || 'Base'
  const initialSelectedPlanId = visiblePlans.find((plan) => plan.name === normalizedCurrentPlan)?.id ?? 'base'
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialSelectedPlanId)
  const [months, setMonths] = useState(1)
  const [method, setMethod] = useState<Method>('checkout')
  const [pending, start] = useTransition()

  // Guard clause para evitar crash si no hay planes
  if (!visiblePlans || visiblePlans.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <h2 style={{ color: 'var(--cream)' }}>Servicio temporalmente no disponible</h2>
          <p style={{ color: 'var(--muted)', marginTop: 10 }}>No pudimos cargar los planes. Por favor contactá a soporte.</p>
          <a href="https://wa.me/5491138901234" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', display: 'block', marginTop: 20 }}>Hablar con soporte →</a>
        </div>
      </div>
    )
  }

  const currentPlanData = visiblePlans.find((plan) => plan.name === normalizedCurrentPlan) ?? visiblePlans[0]
  const currentPlanPrice = currentPlanData?.price ?? 0

  const uiPlans = visiblePlans.map(p => {
    const isCurrent = subscriptionStatus === 'active' && p.name === normalizedCurrentPlan
    const isUpgrade = p.price > currentPlanPrice
    const available = p.id === 'pro' ? proAvailable : true

    return {
      ...p,
      badge: isCurrent ? 'TU PLAN ACTUAL' : p.id === 'base' ? 'BASE' : 'PRO',
      badgeColor: isCurrent ? 'gold' : p.id === 'base' ? 'gold' : 'blue',
      accent: p.id === 'base' ? 'var(--gold)' : 'var(--blue)',
      available,
      isCurrent,
      isUpgrade,
      sub: isCurrent
        ? 'Este es el plan activo de tu barbería'
        : isUpgrade
          ? 'Desbloqueá funciones adicionales para tu equipo'
          : 'Disponible para elegir',
      note: isCurrent
        ? 'Podés conservarlo o mejorar cuando quieras'
        : isUpgrade
          ? 'Upgrade disponible'
          : 'También podés elegir este plan',
    }
  })

  const plan = uiPlans.find(p => p.id === selectedPlanId) || uiPlans[0]
  const opt = MONTH_OPTIONS.find(o => o.months === months) || MONTH_OPTIONS[0]
  const pricePerMonth = Math.round(plan.price * (1 - opt.discount))
  const total = pricePerMonth * months
  const savings = plan.price * months - total
  const subDisabled = months > 1

  function selectPlan(id: string) {
    setSelectedPlanId(id)
    setMonths(1)
    setMethod('checkout')
    setScreen('payment')
  }

  function goBack() {
    setScreen('plans')
  }

  function pickMonths(m: number) {
    setMonths(m)
    if (m > 1 && method === 'subscription') setMethod('checkout')
  }

  function handlePay() {
    start(async () => {
      if (method === 'subscription') {
        await createMPSubscription(barbershopId, selectedPlanId)
      } else if (method === 'transfer') {
        // GalioPay Automático con redirección a /suscripcion/procesando (via server action)
        await createGalioPayPaymentLink(barbershopId, months, selectedPlanId)
      } else if (method === 'transfer-inline') {
        // La UI ya se muestra inline (WhatsApp)
        return
      } else {
        await createMPCheckoutWithMonths(barbershopId, months, selectedPlanId)
      }
    })
  }

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .suscripcion-spinner { animation: spin 1s linear infinite; }
        .suscripcion-month-btn:hover { opacity: 0.85; }
        .suscripcion-method-btn:hover:not(:disabled) { border-color: var(--gold) !important; }
        .suscripcion-pay-btn:hover:not(:disabled) { filter: brightness(1.1); }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '40px 20px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 20, right: 20, textAlign: 'right',
          fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.5,
        }}>
          <p>Hoy: <strong style={{ color: 'var(--text)' }}>{capitalize(today)}</strong></p>
          {trialEnd && (
            <p>{subscriptionStatus === 'trial' ? 'Trial' : 'Plan'} vence: <strong style={{ color: 'var(--gold)' }}>{trialEnd}</strong></p>
          )}
        </div>
        <div style={{ width: '100%', maxWidth: 920, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {screen === 'plans' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <a href={`/dashboard/${barbershopId}`} style={{ fontSize: '.82rem', color: 'var(--muted)', textDecoration: 'none', padding: '4px 0' }}>← Volver al dashboard</a>
              </div>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <Image src="/logo-dark.png"  alt="FiloDesk" width={60} height={60} style={{ borderRadius: 12 }} />
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--cream)', marginBottom: 6 }}>
                    {isTrial
                      ? 'PERÍODO DE PRUEBA ✨'
                      : subscriptionStatus === 'active'
                        ? 'Gestioná tu suscripción'
                        : 'Suscripción vencida'}
                  </h1>
                  <p style={{ fontSize: '.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                    {isTrial
                      ? `Activá tu Plan Base para seguir usando todas las funciones sin límites.`
                      : subscriptionStatus === 'active'
                        ? `Tu plan actual es ${normalizedCurrentPlan}. Podés mantenerlo o mejorar a un plan superior.`
                        : trialEnd
                          ? `Tu prueba venció el ${trialEnd}.`
                          : 'Tu suscripción está vencida.'}{' '}
                    {isTrial && trialEnd
                      ? <><br/>Tu prueba termina el <strong style={{ color: 'var(--gold)' }}>{trialEnd}</strong>.</>
                      : `Elegí un plan para seguir con ${barbershopName}.`}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
                width: '100%',
              }}>
                {uiPlans.map(p => (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--surface)',
                      border: `1.5px solid ${p.available ? p.accent === 'var(--gold)' ? 'var(--gold)' : 'var(--border)' : 'var(--border)'}`,
                      borderRadius: 14, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16,
                      position: 'relative', cursor: p.available && !p.isCurrent ? 'pointer' : 'default',
                      transition: 'all 0.15s ease', opacity: p.available ? 1 : p.id === 'expert' ? 0.85 : 0.75,
                    }}
                    onClick={() => p.available && !p.isCurrent && selectPlan(p.id)}
                  >
                    <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 3, background: p.accent, borderRadius: '14px 14px 0 0' }} />
                    <div style={{
                      position: 'absolute', top: 12, right: 12, padding: '4px 12px', borderRadius: 20, fontSize: '.65rem', fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase',
                      ...(p.badgeColor === 'gold' && { background: 'rgba(212,168,42,0.2)', color: 'var(--gold)', border: '1px solid rgba(212,168,42,0.3)' }),
                      ...(p.badgeColor === 'blue' && { background: 'rgba(196,30,58,0.15)', color: '#ff6b6b', border: '1px solid rgba(196,30,58,0.3)' }),
                      ...(p.badgeColor === 'green' && { background: 'linear-gradient(135deg, rgba(212,168,42,0.15), rgba(94,207,135,0.15))', color: 'var(--green)', border: '1px solid rgba(94,207,135,0.3)' }),
                    }}>{p.badge}</div>
                    <div style={{ marginTop: 8 }}>
                      <p style={{ fontSize: '1.8rem', fontWeight: 800, color: p.badgeColor === 'green' ? 'var(--green)' : p.badgeColor === 'blue' ? '#ff6b6b' : 'var(--cream)', lineHeight: 1 }}>
                        {fmt(p.price)} <span style={{ fontSize: '.8rem', fontWeight: 400, color: 'var(--muted)' }}>ARS/mes</span>
                      </p>
                      <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 4 }}>{p.sub}</p>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      {(p.features || []).map(f => (
                        <li key={f} style={{ fontSize: '.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: p.badgeColor === 'green' ? 'var(--green)' : p.badgeColor === 'blue' ? '#ff6b6b' : 'var(--gold)', flexShrink: 0 }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled={p.isCurrent || !p.available}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (p.available && !p.isCurrent) selectPlan(p.id)
                      }}
                      style={{
                        width: '100%',
                        background: p.isCurrent || !p.available ? 'var(--border)' : 'var(--gold)',
                        color: p.isCurrent || !p.available ? 'var(--muted)' : 'var(--bg)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '11px 20px',
                        fontSize: '.9rem',
                        fontWeight: 700,
                        cursor: p.isCurrent || !p.available ? 'not-allowed' : 'pointer',
                        marginTop: 'auto'
                      }}
                    >
                      {p.isCurrent ? 'Activo' : !p.available ? 'Próximamente' : p.isUpgrade ? 'Mejorar a este plan →' : 'Elegir plan →'}
                    </button>
                    <p style={{ fontSize: '.7rem', color: 'var(--border)', textAlign: 'center', marginTop: 4 }}>{p.note}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ width: '100%', maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <button onClick={goBack} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '.9rem', fontWeight: 600, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>← Volver a planes</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={labelStyle}>¿Por cuánto tiempo?</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, background: 'var(--surface)', padding: 5, borderRadius: 12, border: '1px solid var(--border)' }}>
                  {MONTH_OPTIONS.map(o => {
                    const active = months === o.months
                    return (
                      <button key={o.months} className="suscripcion-month-btn" onClick={() => pickMonths(o.months)} style={{ padding: '10px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', background: active ? 'var(--gold)' : 'transparent', color: active ? '#0e0e0e' : 'var(--muted)', fontWeight: active ? 700 : 500, fontSize: '.8rem', transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        {o.label}
                        {o.discount > 0 && <span style={{ fontSize: '.58rem', fontWeight: 700, color: active ? '#0e0e0e' : 'var(--green)' }}>-{Math.round(o.discount * 100)}%</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Plan {plan.name}</p>
                    <p style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>{fmt(total)}</p>
                    {months > 1 && <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 4 }}>{fmt(pricePerMonth)}/mes × {months}</p>}
                  </div>
                  {savings > 0 && <div style={{ background: 'rgba(94,207,135,0.1)', border: '1px solid rgba(94,207,135,0.25)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', flexShrink: 0 }}><p style={{ fontSize: '.62rem', color: 'var(--green)', fontWeight: 600, marginBottom: 2 }}>Ahorrás</p><p style={{ fontSize: '.95rem', color: 'var(--green)', fontWeight: 800 }}>{fmt(savings)}</p></div>}
                </div>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(plan.features || []).map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.82rem', color: 'var(--muted)' }}><span style={{ color: 'var(--gold)', fontSize: '.72rem', flexShrink: 0 }}>✓</span>{f}</li>
                  ))}
                </ul>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={labelStyle}>Método de pago</p>
                <MethodCard active={method === 'checkout'} onClick={() => setMethod('checkout')} icon="💳" title={`Pagar ${months === 1 ? 'este mes' : `${months} meses`}`} subtitle="MP · Uala · NaranjaX · Tarjetas" />
                <MethodCard active={method === 'subscription'} disabled={subDisabled} onClick={() => setMethod('subscription')} icon="🔄" title="Débito automático" subtitle={subDisabled ? 'Solo disponible para 1 mes' : 'Se renueva mensualmente'} badge="MENSUAL" />
                <MethodCard active={method === 'transfer'} onClick={() => setMethod('transfer')} icon="🏦" title="Transferencia bancaria" subtitle="Desde cualquier banco · Rápido" badge="RECOMENDADO" badgeColor="gold" />
              </div>

              {/* UI de Transferencia Inline - #083 */}
              {method === 'transfer-inline' && (
                <TransferInlineUI
                  cvu={FILODESK_CVU}
                  alias={FILODESK_ALIAS}
                  amount={fmt(total)}
                  planName={plan.name}
                  barbershopName={barbershopName}
                  months={months}
                  onBack={() => setMethod('transfer')}
                />
              )}

              <button className="suscripcion-pay-btn" onClick={handlePay} disabled={pending || method === 'transfer-inline'} style={{ width: '100%', padding: '15px 24px', background: pending || method === 'transfer-inline' ? 'var(--border)' : 'var(--gold)', color: pending || method === 'transfer-inline' ? 'var(--muted)' : '#0e0e0e', border: 'none', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: pending || method === 'transfer-inline' ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {pending ? (
                  <>
                    <Loader2 size={18} className="suscripcion-spinner" />
                    Redirigiendo a pago seguro...
                  </>
                ) : (method === 'checkout' ? `Pagar ${fmt(total)} →` : method === 'transfer' ? `Continuar con GalioPay →` : method === 'transfer-inline' ? 'Esperando comprobante...' : 'Activar débito automático →')}
              </button>
              
              {method === 'transfer' && !pending && (
                <button 
                  onClick={() => setMethod('transfer-inline')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '.75rem', textDecoration: 'underline', cursor: 'pointer', marginTop: -8 }}
                >
                  ¿Problemas con GalioPay? Ver datos de CVU manual
                </button>
              )}

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: '.73rem', color: 'var(--muted)' }}>🔒 Pagos seguros vía {method === 'transfer' ? 'GalioPay' : 'MercadoPago'}</p>
                {method !== 'subscription' && <p style={{ fontSize: '.7rem', color: 'var(--border)' }}>{method === 'transfer' ? 'Activación manual en 24hs' : 'No necesitás cuenta en MercadoPago'}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)',
}

interface MethodCardProps {
  active:      boolean
  disabled?:   boolean
  onClick:     () => void
  icon:        string
  title:       string
  subtitle:    string
  badge?:      string
  badgeColor?: string
}

function MethodCard({ active, disabled, onClick, icon, title, subtitle, badge, badgeColor }: MethodCardProps) {
  return (
    <button className="suscripcion-method-btn" onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', background: active ? 'rgba(212,168,42,0.07)' : 'var(--surface)', border: `1.5px solid ${active ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'border-color 0.15s ease', width: '100%', opacity: disabled ? 0.45 : 1 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: active ? 'rgba(212,168,42,0.14)' : 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: '.86rem', fontWeight: 600, color: 'var(--cream)' }}>{title}</p>
          {badge && <span style={{ fontSize: '.58rem', fontWeight: 700, padding: '1px 7px', background: badgeColor === 'gold' ? 'rgba(212,168,42,0.12)' : 'rgba(94,207,135,0.1)', color: badgeColor === 'gold' ? 'var(--gold)' : 'var(--green)', border: badgeColor === 'gold' ? '1px solid rgba(212,168,42,0.3)' : '1px solid rgba(94,207,135,0.22)', borderRadius: 20 }}>{badge}</span>}
        </div>
        <p style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{subtitle}</p>
      </div>
      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${active ? 'var(--gold)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />}
      </div>
    </button>
  )
}

// Componente de Transferencia Inline - Ticket #083
interface TransferInlineUIProps {
  cvu: string
  alias: string
  amount: string
  planName: string
  barbershopName: string
  months: number
  onBack: () => void
}

function TransferInlineUI({ cvu, alias, amount, planName, barbershopName, months, onBack }: TransferInlineUIProps) {
  const whatsAppLink = generateTransferProofWhatsAppLink(barbershopName, planName, amount, months)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1.5px solid var(--gold)',
      borderRadius: 14,
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--gold)' }}>
          Datos para transferir
        </p>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            fontSize: '.75rem',
            cursor: 'pointer',
          }}
        >
          ← Cambiar método
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'rgba(212,168,42,0.08)', border: '1px solid rgba(212,168,42,0.2)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontSize: '.68rem', color: 'var(--muted)', marginBottom: 4 }}>CVU</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cream)', fontFamily: 'monospace', letterSpacing: '1px' }}>{cvu}</p>
        </div>

        <div style={{ background: 'rgba(212,168,42,0.08)', border: '1px solid rgba(212,168,42,0.2)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontSize: '.68rem', color: 'var(--muted)', marginBottom: 4 }}>Alias</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cream)', fontFamily: 'monospace', letterSpacing: '1px' }}>{alias}</p>
        </div>

        <div style={{ background: 'rgba(212,168,42,0.08)', border: '1px solid rgba(212,168,42,0.2)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontSize: '.68rem', color: 'var(--muted)', marginBottom: 4 }}>Monto a transferir</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)' }}>{amount}</p>
          {months > 1 && <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 2 }}>Por {months} meses</p>}
        </div>
      </div>

      <p style={{ fontSize: '.8rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Hacé la transferencia y envianos el comprobante por WhatsApp
      </p>

      <a
        href={whatsAppLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '14px 20px',
          background: '#25D366',
          color: '#fff',
          borderRadius: 10,
          fontSize: '.9rem',
          fontWeight: 700,
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        📱 Enviar comprobante por WhatsApp
      </a>

      <p style={{ fontSize: '.7rem', color: 'var(--muted)', textAlign: 'center' }}>
        Te activamos el acceso en 24hs hábiles después de verificar el pago
      </p>
    </div>
  )
}

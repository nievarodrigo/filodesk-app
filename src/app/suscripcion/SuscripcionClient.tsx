'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { createMPCheckoutWithMonths, createMPSubscription } from '@/app/actions/subscription'
import { createGalioPAyPaymentLink } from '@/app/actions/galiopay'

const PLANS = [
  {
    id: 'base',
    name: 'Base',
    price: 11999,
    features: ['Hasta 5 barberos', 'Comisiones automáticas', 'Ganancia neta en tiempo real', 'Control de stock y gastos'],
    available: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19999,
    features: ['Barberos ilimitados', 'Todo lo del plan Base', 'Roles: Dueño, Encargado, Barbero', 'Historial completo'],
    available: true,
  },
  {
    id: 'premium',
    name: 'Premium IA',
    price: 29999,
    features: ['Todo lo del plan Pro', 'Predicción de demanda', 'Alertas de ingresos', 'Asistente IA'],
    available: true,
  },
]

const MONTH_OPTIONS = [
  { months: 1,  label: '1 mes',   discount: 0    },
  { months: 3,  label: '3 meses', discount: 0.08 },
  { months: 6,  label: '6 meses', discount: 0.13 },
  { months: 12, label: '1 año',   discount: 0.20 },
]

type Method = 'checkout' | 'subscription' | 'transfer'
type Screen = 'plans' | 'payment'

interface Props {
  barbershopId:       string
  barbershopName:     string
  subscriptionStatus: string
  trialEnd:           string | null
}

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

export default function SuscripcionClient({ barbershopId, barbershopName, subscriptionStatus, trialEnd }: Props) {
  const [screen, setScreen] = useState<Screen>('plans')
  const [selectedPlan, setSelectedPlan] = useState<string>('base')
  const [months, setMonths] = useState(1)
  const [method, setMethod] = useState<Method>('checkout')
  const [pending, start] = useTransition()

  const plan = PLANS.find(p => p.id === selectedPlan)!
  const opt = MONTH_OPTIONS.find(o => o.months === months)!
  const pricePerMonth = Math.round(plan.price * (1 - opt.discount))
  const total = pricePerMonth * months
  const savings = plan.price * months - total
  const subDisabled = months > 1

  function selectPlan(planId: string) {
    setSelectedPlan(planId)
    setMonths(1)
    setMethod('checkout')
    setScreen('payment')
  }

  function goBack() {
    setScreen('plans')
  }

  function pickMonths(m: number) {
    setMonths(m)
    if (m > 1) setMethod('checkout')
  }

  function handlePay() {
    start(async () => {
      if (method === 'subscription') {
        await createMPSubscription(barbershopId)
      } else if (method === 'transfer') {
        await createGalioPAyPaymentLink(barbershopId, months)
      } else {
        await createMPCheckoutWithMonths(barbershopId, months)
      }
    })
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
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
      }}>
        <div style={{ width: '100%', maxWidth: 920, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {screen === 'plans' ? (
            <>
              {/* ── Header ── */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div>
                  <Image src="/logo-dark.png"  alt="FiloDesk" width={68} height={68} className="logo-dark"  style={{ borderRadius: 14 }} />
                  <Image src="/logo-light.png" alt="FiloDesk" width={68} height={68} className="logo-light" style={{ borderRadius: 14 }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--cream)', marginBottom: 6 }}>
                    {subscriptionStatus === 'trial' ? 'Tu período de prueba terminó' : 'Suscripción vencida'}
                  </h1>
                  <p style={{ fontSize: '.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                    {trialEnd ? `Tu prueba venció el ${trialEnd}.` : 'Tu suscripción está vencida.'}{' '}
                    Elegí un plan para seguir con{' '}
                    <strong style={{ color: 'var(--text)' }}>{barbershopName}</strong>.
                  </p>
                </div>
              </div>

              {/* ── Planes ── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
                width: '100%',
              }}>
                {PLANS.map(p => (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid var(--gold)`,
                      borderRadius: 14,
                      padding: '24px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      position: 'relative',
                      cursor: p.available ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (p.available) (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,168,42,0.05)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'
                    }}
                    onClick={() => p.available && selectPlan(p.id)}
                  >
                    <div style={{
                      position: 'absolute',
                      top: -1,
                      left: -1,
                      right: -1,
                      height: 3,
                      background: 'var(--gold)',
                      borderRadius: '14px 14px 0 0',
                    }} />

                    <div>
                      <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)', marginBottom: 6 }}>
                        {p.name}
                      </p>
                      <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>
                        {fmt(p.price)} <span style={{ fontSize: '.85rem', fontWeight: 400, color: 'var(--muted)' }}>/mes</span>
                      </p>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      {p.features.map(f => (
                        <li key={f} style={{ fontSize: '.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: 'var(--gold)', flexShrink: 0 }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {p.available ? (
                      <button style={{
                        width: '100%', background: 'var(--gold)', color: 'var(--bg)',
                        border: 'none', borderRadius: 8, padding: '11px 20px',
                        fontSize: '.9rem', fontWeight: 700, cursor: 'pointer',
                        marginTop: 'auto',
                      }}>
                        Elegir plan →
                      </button>
                    ) : (
                      <button disabled style={{
                        width: '100%', background: 'var(--border)', color: 'var(--muted)',
                        border: 'none', borderRadius: 8, padding: '11px 20px',
                        fontSize: '.9rem', fontWeight: 600, cursor: 'not-allowed',
                        marginTop: 'auto',
                      }}>
                        En desarrollo
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* ── Back + Plan seleccionado ── */}
              <button
                onClick={goBack}
                style={{
                  alignSelf: 'flex-start',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--gold)',
                  cursor: 'pointer',
                  fontSize: '.9rem',
                  fontWeight: 600,
                  padding: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                ← Volver a planes
              </button>

              {/* ── Selector de meses ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={labelStyle}>¿Por cuánto tiempo?</p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 6,
                  background: 'var(--surface)',
                  padding: 5,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                }}>
                  {MONTH_OPTIONS.map(o => {
                    const active = months === o.months
                    return (
                      <button
                        key={o.months}
                        className="suscripcion-month-btn"
                        onClick={() => pickMonths(o.months)}
                        style={{
                          padding: '10px 4px',
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          background: active ? 'var(--gold)' : 'transparent',
                          color: active ? '#0e0e0e' : 'var(--muted)',
                          fontWeight: active ? 700 : 500,
                          fontSize: '.8rem',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        {o.label}
                        {o.discount > 0 && (
                          <span style={{
                            fontSize: '.58rem',
                            fontWeight: 700,
                            color: active ? '#0e0e0e' : 'var(--green)',
                          }}>
                            -{Math.round(o.discount * 100)}%
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Precio ── */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>
                      {plan.name}
                    </p>
                    <p style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>
                      {fmt(total)}
                    </p>
                    {months > 1 && (
                      <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 4 }}>
                        {fmt(pricePerMonth)}/mes × {months}
                      </p>
                    )}
                  </div>
                  {savings > 0 && (
                    <div style={{
                      background: 'rgba(94,207,135,0.1)',
                      border: '1px solid rgba(94,207,135,0.25)',
                      borderRadius: 10,
                      padding: '8px 14px',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}>
                      <p style={{ fontSize: '.62rem', color: 'var(--green)', fontWeight: 600, marginBottom: 2 }}>Ahorrás</p>
                      <p style={{ fontSize: '.95rem', color: 'var(--green)', fontWeight: 800 }}>{fmt(savings)}</p>
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: 'var(--border)' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.82rem', color: 'var(--muted)' }}>
                      <span style={{ color: 'var(--gold)', fontSize: '.72rem', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── Método de pago ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={labelStyle}>Método de pago</p>

                <MethodCard
                  active={method === 'checkout'}
                  disabled={false}
                  onClick={() => setMethod('checkout')}
                  icon="💳"
                  title={`Pagar ${months === 1 ? 'este mes' : `${months} meses`}`}
                  subtitle="MP · Uala · NaranjaX · Tarjetas · y más"
                />

                <MethodCard
                  active={method === 'subscription'}
                  disabled={subDisabled}
                  onClick={() => setMethod('subscription')}
                  icon="🔄"
                  title="Débito automático"
                  subtitle={subDisabled ? 'Solo disponible para 1 mes' : 'Se renueva automáticamente cada mes'}
                  badge="MENSUAL"
                />

                <MethodCard
                  active={method === 'transfer'}
                  disabled={false}
                  onClick={() => setMethod('transfer')}
                  icon="🏦"
                  title="Transferencia bancaria"
                  subtitle="Desde cualquier banco · Rápido y seguro"
                  badge="RECOMENDADO"
                  badgeColor="gold"
                />
              </div>

              {/* ── CTA ── */}
              <button
                className="suscripcion-pay-btn"
                onClick={handlePay}
                disabled={pending}
                style={{
                  width: '100%',
                  padding: '15px 24px',
                  background: pending ? 'var(--border)' : 'var(--gold)',
                  color: pending ? 'var(--muted)' : '#0e0e0e',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '.95rem',
                  fontWeight: 700,
                  cursor: pending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {pending ? (
                  <>
                    <span style={{
                      width: 15, height: 15,
                      border: '2px solid var(--muted)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    Redirigiendo...
                  </>
                ) : (
                  method === 'checkout'
                    ? `Pagar ${fmt(total)} →`
                    : method === 'transfer'
                    ? `Transferir ${fmt(total)} →`
                    : 'Activar débito automático →'
                )}
              </button>

              {/* ── Footer ── */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {method === 'transfer' ? (
                  <>
                    <p style={{ fontSize: '.73rem', color: 'var(--muted)' }}>
                      🔒 Procesado de forma segura por GalioPay
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '.73rem', color: 'var(--muted)' }}>
                      🔒 Pagos procesados de forma segura por MercadoPago
                    </p>
                    {method === 'checkout' && (
                      <p style={{ fontSize: '.7rem', color: 'var(--border)' }}>
                        No necesitás tener cuenta en MercadoPago
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}

/* ── Subcomponentes ── */

const labelStyle: React.CSSProperties = {
  fontSize: '.72rem',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

function MethodCard({
  active, disabled, onClick, icon, title, subtitle, badge, badgeColor,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  icon: string
  title: string
  subtitle: string
  badge?: string
  badgeColor?: 'green' | 'gold'
}) {
  return (
    <button
      className="suscripcion-method-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 16px',
        background: active ? 'rgba(212,168,42,0.07)' : 'var(--surface)',
        border: `1.5px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        width: '100%',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: active ? 'rgba(212,168,42,0.14)' : 'var(--card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem',
      }}>
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: '.86rem', fontWeight: 600, color: 'var(--cream)' }}>{title}</p>
          {badge && (
            <span style={{
              fontSize: '.58rem', fontWeight: 700, padding: '1px 7px',
              background: badgeColor === 'gold' ? 'rgba(212,168,42,0.12)' : 'rgba(94,207,135,0.1)',
              color: badgeColor === 'gold' ? 'var(--gold)' : 'var(--green)',
              border: badgeColor === 'gold' ? '1px solid rgba(212,168,42,0.3)' : '1px solid rgba(94,207,135,0.22)',
              borderRadius: 20,
              letterSpacing: '.4px',
            }}>
              {badge}
            </span>
          )}
        </div>
        <p style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{subtitle}</p>
      </div>

      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.15s ease',
      }}>
        {active && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
        )}
      </div>
    </button>
  )
}

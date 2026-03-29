'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { createMPCheckoutWithMonths, createMPSubscription, createBankTransfer } from '@/app/actions/subscription'

const PLANS = [
  {
    id: 'base',
    name: 'Base',
    price: 11999,
    badge: 'BASE',
    sub: '14 días gratis · Cancelás cuando querés',
    features: [
      'Hasta 5 barberos',
      'Comisiones automáticas',
      'Ganancia neta en tiempo real',
      'Control de stock y gastos',
    ],
    disabled: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19999,
    badge: 'PRÓXIMAMENTE',
    sub: 'En desarrollo — disponible pronto',
    features: [
      'Barberos ilimitados',
      'Todo lo del plan Base',
      'Roles: Dueño, Encargado, Barbero',
      'Historial completo',
    ],
    disabled: true,
  },
  {
    id: 'expert',
    name: 'Premium IA',
    price: 29999,
    badge: 'PRÓXIMAMENTE',
    accent: 'green',
    sub: 'En desarrollo — disponible pronto',
    features: [
      'Todo lo del plan Pro',
      'Predicción de demanda',
      'Alertas de ingresos',
      'Asistente IA',
    ],
    disabled: true,
  },
]

const MONTH_OPTIONS = [
  { months: 1,  label: '1 mes',   discount: 0    },
  { months: 3,  label: '3 meses', discount: 0.08 },
  { months: 6,  label: '6 meses', discount: 0.13 },
  { months: 12, label: '1 año',   discount: 0.20 },
]

type View = 'choosing_plan' | 'checkout'
type Method = 'checkout' | 'subscription' | 'transfer'

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
  const [view, setView] = useState<View>('choosing_plan')
  const [planId, setPlanId] = useState('base')
  const [months,  setMonths]  = useState(1)
  const [method,  setMethod]  = useState<Method>('checkout')
  const [pending, start]      = useTransition()

  const plan = PLANS.find(p => p.id === planId)!
  const opt = MONTH_OPTIONS.find(o => o.months === months)!
  
  const pricePerMonth = Math.round(plan.price * (1 - opt.discount))
  const total = pricePerMonth * months
  const savings = (plan.price * months) - total
  const subDisabled = months > 1

  function pickMonths(m: number) {
    setMonths(m)
    if (m > 1 && method === 'subscription') setMethod('checkout')
  }

  function handlePay() {
    start(async () => {
      if (method === 'subscription') {
        await createMPSubscription(barbershopId, planId)
      } else if (method === 'checkout') {
        await createMPCheckoutWithMonths(barbershopId, months, planId)
      } else if (method === 'transfer') {
        await createBankTransfer(barbershopId, months, planId)
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
        .plan-card:hover:not(.disabled) { border-color: var(--gold) !important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '60px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        
        {/* Info lateral superior (como en el screenshot) */}
        <div style={{
          position: 'absolute', top: 20, right: 30, textAlign: 'right',
          fontSize: '.75rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <p>Hoy: <strong style={{ color: 'var(--cream)' }}>Sábado, 28 de marzo</strong></p>
          <p>Plan vence: <strong style={{ color: 'var(--gold)' }}>10 de marzo de 2026</strong></p>
        </div>

        <div style={{ width: '100%', maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Image src="/logo-dark.png" alt="FiloDesk" width={50} height={50} style={{ borderRadius: 10 }} />
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--cream)', marginBottom: 8 }}>
                {subscriptionStatus === 'trial' ? 'Suscripción vencida' : 'Suscripción vencida'}
              </h1>
              <p style={{ fontSize: '.9rem', color: 'var(--muted)', maxWidth: 600, margin: '0 auto' }}>
                Tu prueba venció el 10 de marzo de 2026. Elegí un plan para seguir con <strong>{barbershopName}</strong>.
              </p>
            </div>
          </div>

          {view === 'choosing_plan' ? (
            /* ── VISTA 1: GRID DE PLANES ── */
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: 20 
            }}>
              {PLANS.map(p => {
                const isGreen = p.accent === 'green'
                return (
                  <div
                    key={p.id}
                    className={`plan-card ${p.disabled ? 'disabled' : ''}`}
                    style={{
                      background: 'var(--surface)',
                      border: `1.5px solid ${p.id === 'base' ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius: 20,
                      padding: '34px 28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 24,
                      opacity: p.disabled ? 0.6 : 1,
                      position: 'relative',
                    }}
                  >
                    {p.badge && (
                      <span style={{ 
                        position: 'absolute', top: 18, right: 24,
                        background: p.disabled ? 'rgba(255,255,255,0.05)' : 'rgba(212,168,42,0.1)',
                        color: isGreen ? 'var(--green)' : (p.disabled ? 'var(--muted)' : 'var(--gold)'), 
                        fontSize: '.62rem', fontWeight: 800,
                        padding: '4px 12px', borderRadius: 20, border: `1px solid ${p.disabled ? 'var(--border)' : (isGreen ? 'var(--green)' : 'var(--gold)')}`,
                        letterSpacing: '.5px'
                      }}>
                        {p.badge}
                      </span>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--cream)' }}>{fmt(p.price)}</span>
                        <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>ARS/mes</span>
                      </div>
                      <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 6 }}>{p.sub}</p>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {p.features.map(f => (
                        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                          <span style={{ color: p.disabled ? 'var(--border)' : 'var(--gold)', fontSize: '.75rem', marginTop: 2 }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {p.disabled ? (
                      <button disabled style={{
                        marginTop: 'auto', width: '100%', padding: '14px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)', color: 'var(--muted)',
                        border: 'none', fontWeight: 700, fontSize: '.9rem', cursor: 'not-allowed'
                      }}>
                        Próximamente
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setPlanId(p.id); setView('checkout'); }}
                        style={{
                          marginTop: 'auto', width: '100%', padding: '14px', borderRadius: 12,
                          background: 'var(--gold)', color: '#0e0e0e',
                          border: 'none', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Elegir plan →
                      </button>
                    )}

                    {p.disabled && (
                      <p style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--border)', marginTop: -10 }}>
                        En desarrollo — disponible pronto
                      </p>
                    )}
                    {!p.disabled && (
                      <p style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--border)', marginTop: -10 }}>
                        Sin compromiso, cancelás cuando querés
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* ── VISTA 2: CHECKOUT (TIEMPO + MÉTODO) ── */
            <div style={{ width: '100%', maxWidth: 860, margin: '0 auto' }}>
              
              <button onClick={() => setView('choosing_plan')} style={{
                background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20
              }}>
                ← Volver a elegir plan
              </button>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: 40,
                alignItems: 'start'
              }}>
                {/* Izquierda: Configuración */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={labelStyle}>1. ¿Por cuánto tiempo?</p>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
                      background: 'var(--surface)', padding: 6, borderRadius: 12, border: '1px solid var(--border)',
                    }}>
                      {MONTH_OPTIONS.map(o => {
                        const active = months === o.months
                        return (
                          <button
                            key={o.months}
                            className="suscripcion-month-btn"
                            onClick={() => pickMonths(o.months)}
                            style={{
                              padding: '12px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: active ? 'var(--gold)' : 'transparent',
                              color: active ? '#0e0e0e' : 'var(--muted)',
                              fontWeight: active ? 700 : 500, fontSize: '.85rem', transition: 'all 0.15s ease',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            }}
                          >
                            {o.label}
                            {o.discount > 0 && (
                              <span style={{ fontSize: '.6rem', fontWeight: 800, color: active ? '#0e0e0e' : 'var(--green)' }}>
                                -{Math.round(o.discount * 100)}%
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={labelStyle}>2. Método de pago</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <MethodCard
                        active={method === 'checkout'}
                        disabled={false}
                        onClick={() => setMethod('checkout')}
                        icon="💳"
                        title={`Pagar ${months === 1 ? 'este mes' : `${months} meses`}`}
                        subtitle="MP · Tarjetas · Otros"
                      />
                      <MethodCard
                        active={method === 'subscription'}
                        disabled={subDisabled}
                        onClick={() => setMethod('subscription')}
                        icon="🔄"
                        title="Débito automático"
                        subtitle={subDisabled ? 'Solo para 1 mes' : 'Se renueva cada mes'}
                        badge="MENSUAL"
                      />
                      <MethodCard
                        active={method === 'transfer'}
                        disabled={false}
                        onClick={() => setMethod('transfer')}
                        icon="🏦"
                        title="Transferencia Bancaria"
                        subtitle="Vía GalioPay · CBU/Alias"
                      />
                    </div>
                  </div>
                </div>

                {/* Derecha: Resumen */}
                <div style={{ 
                  background: 'var(--surface)', border: '1px solid var(--border)', 
                  borderRadius: 24, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24,
                }}>
                  <div>
                    <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Resumen del Plan {plan.name}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--cream)' }}>{fmt(total)}</h2>
                    </div>
                    {savings > 0 && <p style={{ color: 'var(--green)', fontSize: '.85rem', fontWeight: 700, marginTop: 4 }}>Ahorrás {fmt(savings)}</p>}
                    <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: 10 }}>
                      {months > 1 ? `Pago por ${months} meses de servicio.` : 'Suscripción mensual.'}
                    </p>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)' }} />

                  <button
                    className="suscripcion-pay-btn"
                    onClick={handlePay}
                    disabled={pending}
                    style={{
                      width: '100%', padding: '18px', background: pending ? 'var(--border)' : 'var(--gold)',
                      color: pending ? 'var(--muted)' : '#0e0e0e', border: 'none', borderRadius: 14,
                      fontSize: '1rem', fontWeight: 800, cursor: pending ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}
                  >
                    {pending ? 'Procesando...' : (
                      method === 'checkout' ? `Pagar ${fmt(total)} →` : 
                      method === 'subscription' ? 'Activar Débito →' : 'Pagar con Transferencia →'
                    )}
                  </button>

                  <p style={{ fontSize: '.7rem', color: 'var(--muted)', textAlign: 'center' }}>
                    Al pagar aceptás los términos y condiciones de FiloDesk.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

/* ── Subcomponentes ── */

const labelStyle: React.CSSProperties = {
  fontSize: '.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)',
}

function MethodCard({ active, disabled, onClick, icon, title, subtitle, badge }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: active ? 'rgba(212,168,42,0.08)' : 'var(--card)',
        border: `1.5px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 14, cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left', width: '100%', opacity: disabled ? 0.4 : 1, transition: 'all 0.2s',
      }}
    >
      <div style={{ fontSize: '1.2rem' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--cream)' }}>{title}</p>
        <p style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{subtitle}</p>
      </div>
      {badge && <span style={{ fontSize: '.6rem', fontWeight: 800, background: 'rgba(94,207,135,0.1)', color: 'var(--green)', padding: '2px 6px', borderRadius: 6 }}>{badge}</span>}
    </button>
  )
}

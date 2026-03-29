'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { createMPCheckoutWithMonths, createMPSubscription, createBankTransfer } from '@/app/actions/subscription'

const PLANS = [
  {
    id: 'base',
    name: 'Base',
    price: 11999,
    features: [
      'Hasta 5 barberos',
      'Comisiones automáticas',
      'Ganancia neta en tiempo real',
      'Control de stock y gastos',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19999,
    badge: 'Recomendado',
    features: [
      'Barberos ilimitados',
      'Roles: Dueño, Encargado y Barbero',
      'Reportes avanzados (Excel/PDF)',
      'Historial completo sin límites',
    ],
  },
  {
    id: 'expert',
    name: 'Premium IA',
    price: 29999,
    badge: 'Nuevo',
    features: [
      'IA Predicción de demanda',
      'Alertas automáticas de ingresos',
      'Sugerencias de inversión',
      'Asistente IA personalizado',
    ],
  },
]

const MONTH_OPTIONS = [
  { months: 1,  label: '1 mes',   discount: 0    },
  { months: 3,  label: '3 meses', discount: 0.08 },
  { months: 6,  label: '6 meses', discount: 0.13 },
  { months: 12, label: '1 año',   discount: 0.20 },
]

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
      // Nota: El backend actualmente espera barbershopId y months. 
      // El planId se usará en futuras actualizaciones del backend.
      if (method === 'subscription') {
        await createMPSubscription(barbershopId)
      } else if (method === 'checkout') {
        await createMPCheckoutWithMonths(barbershopId, months)
      } else if (method === 'transfer') {
        await createBankTransfer(barbershopId, months)
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
        .plan-card:hover { border-color: var(--gold) !important; }
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
        <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 24 }}>

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

          {/* ── Selector de Planes ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={labelStyle}>Elegí tu plan</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLANS.map(p => (
                <button
                  key={p.id}
                  className="plan-card"
                  onClick={() => setPlanId(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: planId === p.id ? 'rgba(212,168,42,0.07)' : 'var(--surface)',
                    border: `1.5px solid ${planId === p.id ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '.9rem', fontWeight: 700, color: planId === p.id ? 'var(--gold)' : 'var(--cream)' }}>
                        Plan {p.name}
                      </span>
                      {p.badge && (
                        <span style={{ fontSize: '.55rem', fontWeight: 800, padding: '2px 6px', background: 'var(--gold)', color: '#0e0e0e', borderRadius: 4, textTransform: 'uppercase' }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{fmt(p.price)}/mes</span>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${planId === p.id ? 'var(--gold)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {planId === p.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

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

          {/* ── Detalle del Plan ── */}
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
                  Plan {plan.name}
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
              title="Transferencia Bancaria"
              subtitle="Vía GalioPay · CBU/Alias"
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
                : method === 'subscription'
                  ? 'Activar débito automático →'
                  : 'Pagar con Transferencia →'
            )}
          </button>

          {/* ── Footer ── */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: '.73rem', color: 'var(--muted)' }}>
              🔒 Pagos seguros vía {method === 'transfer' ? 'GalioPay' : 'MercadoPago'}
            </p>
            {method !== 'subscription' && (
              <p style={{ fontSize: '.7rem', color: 'var(--border)' }}>
                {method === 'transfer' ? 'Transferencia directa sin comisiones' : 'No necesitás tener cuenta en MercadoPago'}
              </p>
            )}
          </div>

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
  active, disabled, onClick, icon, title, subtitle, badge,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  icon: string
  title: string
  subtitle: string
  badge?: string
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
              background: 'rgba(94,207,135,0.1)', color: 'var(--green)',
              border: '1px solid rgba(94,207,135,0.22)', borderRadius: 20,
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

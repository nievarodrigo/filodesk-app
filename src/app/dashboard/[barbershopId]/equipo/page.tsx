import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { getServerAuthContext } from '@/services/auth.service'
import { isFeatureEnabled } from '@/services/plan.service'
import InviteMemberModal from './InviteMemberModal'
import styles from './equipo.module.css'

export const metadata: Metadata = { title: 'Equipo — FiloDesk' }

interface TeamMemberCard {
  id: string
  role: 'owner' | 'manager' | 'barber'
  email: string
  displayName: string
  createdAt: string | null
}

function formatRole(role: TeamMemberCard['role']) {
  if (role === 'owner') return 'Dueño'
  if (role === 'manager') return 'Encargado'
  return 'Barbero'
}

function formatDate(date: string | null) {
  if (!date) return 'Recién agregado'
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function getDisplayName(email: string, metadata: Record<string, unknown> | undefined) {
  const firstName = typeof metadata?.first_name === 'string' ? metadata.first_name : ''
  const lastName = typeof metadata?.last_name === 'string' ? metadata.last_name : ''
  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) return fullName
  return email.split('@')[0] ?? email
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('') || 'FD'
}

async function getUserById(userId: string) {
  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient.auth.admin.getUserById(userId)
  if (error || !data.user.email) return null

  return {
    email: data.user.email,
    displayName: getDisplayName(data.user.email, data.user.user_metadata),
  }
}

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, session.user.id)
  if (!context || !canAccess(context.role, 'manage_members')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  if (context.role !== 'owner' && context.role !== 'manager') {
    redirect(`/dashboard/${barbershopId}`)
  }

  const multiUserEnabled = isFeatureEnabled(context.plan, 'multi_user')

  const serviceClient = createServiceClient()
  const { data: barbershop, error: barbershopError } = await serviceClient
    .from('barbershops')
    .select('id, name, owner_id, created_at')
    .eq('id', barbershopId)
    .single()

  if (barbershopError || !barbershop) {
    redirect(`/dashboard/${barbershopId}`)
  }

  if (!multiUserEnabled) {
    return (
      <div className={styles.lockedWrap}>
        <section className={styles.lockedCard}>
          <div className={styles.lockedIcon}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className={styles.eyebrow}>Feature Locked</p>
          <h1 className={styles.lockedTitle}>Equipo y miembros requiere plan Pro</h1>
          <p className={styles.lockedText}>
            Tu barbería está en plan <strong>{context.plan}</strong>. La colaboración multiusuario,
            la asignación de encargados y la gestión centralizada del equipo se habilitan desde <strong>Pro</strong>.
          </p>
          <div className={styles.lockedHighlights}>
            <span className={styles.lockedChip}>Encargados y Barberos</span>
            <span className={styles.lockedChip}>Permisos por rol</span>
            <span className={styles.lockedChip}>Acceso compartido al dashboard</span>
          </div>
        </section>
      </div>
    )
  }

  // Justificado: necesitamos mostrar todos los miembros y resolver emails desde auth.users.
  const [{ data: members }, owner] = await Promise.all([
    serviceClient
      .from('barbershop_members')
      .select('id, user_id, role, created_at')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: true }),
    getUserById(barbershop.owner_id),
  ])

  const memberCards = (
    await Promise.all(
      (members ?? []).map(async (member) => {
        const authUser = await getUserById(member.user_id)
        if (!authUser) return null

        return {
          id: member.id,
          role: member.role,
          email: authUser.email,
          displayName: authUser.displayName,
          createdAt: member.created_at,
        } satisfies TeamMemberCard
      })
    )
  ).filter((member): member is TeamMemberCard => member !== null)

  const cards: TeamMemberCard[] = [
    {
      id: `owner-${barbershop.owner_id}`,
      role: 'owner',
      email: owner?.email ?? 'owner@filodesk.app',
      displayName: owner?.displayName ?? 'Owner',
      createdAt: barbershop.created_at ?? null,
    },
    ...memberCards,
  ]

  const managerCount = cards.filter((member) => member.role === 'manager').length
  const barberCount = cards.filter((member) => member.role === 'barber').length

  return (
    <div className={styles.page}>
      <section className={styles.heroCard}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Colaboración premium</p>
            <h1 className={styles.title}>Equipo de {barbershop.name}</h1>
            <p className={styles.subtitle}>
              Administrá dueños, encargados y barberos desde una interfaz diseñada para equipos reales:
              clara, rápida y alineada al plan <strong>{context.plan}</strong>.
            </p>
          </div>

          <div className={styles.headerMeta}>
            <span className={styles.planPill}>{context.plan}</span>
            <span className={styles.counterPill}>{cards.length} miembros</span>
            <InviteMemberModal barbershopId={barbershopId} />
          </div>
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.metric}>
            <p className={styles.metricLabel}>Dueños</p>
            <p className={styles.metricValue}>1</p>
            <p className={styles.metricHint}>Control total de configuración y plan</p>
          </div>
          <div className={styles.metric}>
            <p className={styles.metricLabel}>Encargados</p>
            <p className={styles.metricValue}>{managerCount}</p>
            <p className={styles.metricHint}>Operación y coordinación del negocio</p>
          </div>
          <div className={styles.metric}>
            <p className={styles.metricLabel}>Barberos</p>
            <p className={styles.metricValue}>{barberCount}</p>
            <p className={styles.metricHint}>Registro de ventas y uso diario del sistema</p>
          </div>
        </div>
      </section>

      {cards.length === 0 ? (
        <section className={styles.emptyState}>
          <span className={styles.emptyBadge}>Sin miembros</span>
          <h2 className={styles.emptyTitle}>Todavía no hay integrantes adicionales</h2>
          <p className={styles.emptyText}>
            Sumá encargados o barberos para distribuir accesos y empezar a trabajar en equipo dentro del dashboard.
          </p>
        </section>
      ) : (
        <section className={styles.grid}>
          {cards.map((member) => (
            <article key={member.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div className={styles.avatar}>{getInitials(member.displayName)}</div>
                  <div>
                    <h2 className={styles.name}>{member.displayName}</h2>
                    <p className={styles.email}>{member.email}</p>
                  </div>
                </div>
                <span className={styles.roleBadge}>{formatRole(member.role)}</span>
              </div>

              <div className={styles.metaList}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Acceso</span>
                  <span className={styles.metaValue}>{member.role === 'barber' ? 'Ventas' : 'Operativo ampliado'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Alta</span>
                  <span className={styles.metaValue}>{formatDate(member.createdAt)}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

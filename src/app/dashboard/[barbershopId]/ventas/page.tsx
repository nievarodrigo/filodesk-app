import { redirect } from 'next/navigation'

export default async function VentasRedirectPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  redirect(`/dashboard/${barbershopId}/finanzas?tab=movimientos`)
}

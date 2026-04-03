import { redirect } from 'next/navigation'

export default async function GastosRedirectPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  redirect(`/dashboard/${barbershopId}/egresos`)
}

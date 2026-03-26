'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import * as productService from '@/services/product.service'

const ProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').trim(),
  cost_price: z.number({ error: 'Ingresá un precio de costo.' }).min(0),
  sale_price: z.number({ error: 'Ingresá un precio de venta.' }).positive('El precio de venta debe ser mayor a 0.'),
  stock: z.number({ error: 'Ingresá la cantidad.' }).int().min(0),
})

export type ProductoState = {
  errors?: { name?: string[]; cost_price?: string[]; sale_price?: string[]; stock?: string[] }
  message?: string
} | undefined

export async function createProducto(
  barbershopId: string,
  _state: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const validated = ProductSchema.safeParse({
    name: formData.get('name'),
    cost_price: Number(formData.get('cost_price')),
    sale_price: Number(formData.get('sale_price')),
    stock: Number(formData.get('stock')),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await productService.createProduct(supabase, barbershopId, validated.data)
  if (result.error) return { message: result.error }

  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}/gastos`)
}

export type VentaProductoState = { message?: string } | undefined

export async function venderProducto(
  barbershopId: string,
  _state: VentaProductoState,
  formData: FormData
): Promise<VentaProductoState> {
  const product_id = formData.get('product_id') as string
  const quantity = Number(formData.get('quantity')) || 1
  const date = formData.get('date') as string || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  if (!product_id) return { message: 'Seleccioná un producto.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await productService.sellProduct(supabase, barbershopId, { product_id, quantity, date })
  if (result.error) return { message: result.error }

  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}`)
  revalidatePath(`/dashboard/${barbershopId}/ventas`)
}

export type VentaMultipleState = { message?: string } | undefined

export async function venderProductos(
  barbershopId: string,
  _state: VentaMultipleState,
  formData: FormData
): Promise<VentaMultipleState> {
  const raw = formData.get('items') as string
  const date = formData.get('date') as string || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  let items: { product_id: string; quantity: number; sale_price: number }[] = []
  try { items = JSON.parse(raw) } catch { return { message: 'Error al procesar los productos.' } }
  if (!items.length) return { message: 'Agregá al menos un producto.' }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const result = await productService.sellProducts(supabase, barbershopId, { items, date })
  if (result.error) return { message: result.error }

  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}`)
  revalidatePath(`/dashboard/${barbershopId}/ventas`)
}

export async function reponerStock(
  barbershopId: string,
  productId: string,
  quantity: number,
  cost_price: number
) {
  const supabase = await createClient()
  await productService.restockProduct(supabase, barbershopId, productId, quantity, cost_price)
  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}/gastos`)
}

export async function toggleProducto(barbershopId: string, productId: string, active: boolean) {
  const supabase = await createClient()
  await productService.toggleProduct(supabase, productId, active)
  revalidatePath(`/dashboard/${barbershopId}/productos`)
}

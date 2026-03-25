'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ProductSchema = z.object({
  name:       z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').trim(),
  cost_price: z.number({ invalid_type_error: 'Ingresá un precio de costo.' }).min(0),
  sale_price: z.number({ invalid_type_error: 'Ingresá un precio de venta.' }).positive('El precio de venta debe ser mayor a 0.'),
  stock:      z.number({ invalid_type_error: 'Ingresá la cantidad.' }).int().min(0),
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
    name:       formData.get('name'),
    cost_price: Number(formData.get('cost_price')),
    sale_price: Number(formData.get('sale_price')),
    stock:      Number(formData.get('stock')),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase.from('products').insert({
    barbershop_id: barbershopId,
    ...validated.data,
  })

  if (error) return { message: 'No se pudo crear el producto. ' + error.message }
  revalidatePath(`/dashboard/${barbershopId}/productos`)
}

export type VentaProductoState = { message?: string } | undefined

export async function venderProducto(
  barbershopId: string,
  _state: VentaProductoState,
  formData: FormData
): Promise<VentaProductoState> {
  const product_id = formData.get('product_id') as string
  const quantity   = Number(formData.get('quantity')) || 1
  const date       = formData.get('date') as string || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  if (!product_id) return { message: 'Seleccioná un producto.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: product } = await supabase
    .from('products')
    .select('sale_price, stock, name')
    .eq('id', product_id)
    .single()

  if (!product) return { message: 'Producto no encontrado.' }
  if (product.stock < quantity) return { message: `Stock insuficiente. Quedan ${product.stock} unidades.` }

  const [insertRes, updateRes] = await Promise.all([
    supabase.from('product_sales').insert({
      barbershop_id: barbershopId,
      product_id,
      quantity,
      sale_price: product.sale_price,
      date,
    }),
    supabase.from('products').update({ stock: product.stock - quantity }).eq('id', product_id),
  ])

  if (insertRes.error) return { message: 'No se pudo registrar la venta.' }

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

  const { data: product } = await supabase
    .from('products')
    .select('stock, name, cost_price')
    .eq('id', productId)
    .single()

  if (!product) return

  await Promise.all([
    supabase.from('products').update({ stock: product.stock + quantity, cost_price }).eq('id', productId),
    supabase.from('expenses').insert({
      barbershop_id: barbershopId,
      description:   `Reposición: ${product.name} (${quantity} u.)`,
      amount:        cost_price * quantity,
      category:      'Productos',
      date:          new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }),
    }),
  ])

  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}/gastos`)
}

export async function toggleProducto(barbershopId: string, productId: string, active: boolean) {
  const supabase = await createClient()
  await supabase.from('products').update({ active }).eq('id', productId)
  revalidatePath(`/dashboard/${barbershopId}/productos`)
}

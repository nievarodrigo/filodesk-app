'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canAccess } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { CreateProductSchema, UpdateProductDataSchema } from '@/lib/validations/product'
import { getServerAuthContext } from '@/services/auth.service'
import * as productService from '@/services/product.service'

async function requireManageProductsAccess(barbershopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' as const }

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  const canManageProducts = !!context && (
    canAccess(context.role, 'manage_products') || canAccess(context.role, 'manage_inventory')
  )
  if (!canManageProducts) {
    return { error: 'No tenés permisos para gestionar productos.' as const }
  }

  return { supabase, user, context }
}

export type ProductoState = {
  errors?: { name?: string[]; cost_price?: string[]; sale_price?: string[]; stock?: string[] }
  message?: string
} | undefined

export async function createProducto(
  barbershopId: string,
  _state: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const validated = CreateProductSchema.safeParse({
    name: formData.get('name'),
    cost_price: Number(formData.get('cost_price')),
    sale_price: Number(formData.get('sale_price')),
    stock: Number(formData.get('stock')),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const auth = await requireManageProductsAccess(barbershopId)
  if ('error' in auth) return { message: auth.error }

  const { supabase } = auth
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

export type VentaMultipleState = { message?: string; success?: boolean } | undefined

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
  return { success: true, message: 'Venta de productos registrada con éxito.' }
}

export async function reponerStock(
  barbershopId: string,
  productId: string,
  quantity: number,
  cost_price: number
) {
  const auth = await requireManageProductsAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const { supabase } = auth
  await productService.restockProduct(supabase, barbershopId, productId, quantity, cost_price)
  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}/gastos`)
  return { success: true }
}

export async function toggleProducto(barbershopId: string, productId: string, active: boolean) {
  const auth = await requireManageProductsAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const { supabase } = auth
  const result = await productService.updateProductActive(supabase, barbershopId, productId, active)
  if (result.error) return { error: result.error }
  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}`)
  return { success: true }
}

export async function updateProductoData(
  barbershopId: string,
  productId: string,
  payload: { name: string; sale_price: number; stock: number }
) {
  const validated = UpdateProductDataSchema.safeParse(payload)
  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors).find(Boolean)?.[0]
    return { error: firstError ?? 'Datos inválidos.' }
  }

  const auth = await requireManageProductsAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const { supabase } = auth
  const result = await productService.updateProductData(supabase, barbershopId, productId, validated.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}`)
  return { success: true }
}

export async function deleteProducto(barbershopId: string, productId: string) {
  const auth = await requireManageProductsAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const { supabase } = auth
  const result = await productService.deleteProduct(supabase, barbershopId, productId)
  if ('error' in result) return { error: result.error }

  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}`)
  revalidatePath(`/dashboard/${barbershopId}/ventas`)
  return { success: true, mode: result.mode }
}

export async function deleteVentaProducto(barbershopId: string, productSaleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  if (!context || context.role === 'barber') {
    return { error: 'No tenés permisos para eliminar ventas de productos.' }
  }

  const result = await productService.deleteProductSale(supabase, barbershopId, productSaleId)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/${barbershopId}`)
  revalidatePath(`/dashboard/${barbershopId}/ventas`)
  revalidatePath(`/dashboard/${barbershopId}/productos`)
  revalidatePath(`/dashboard/${barbershopId}/finanzas`)

  return { success: true }
}

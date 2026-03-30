import { SupabaseClient } from '@supabase/supabase-js'
import * as productRepo from '@/repositories/product.repository'
import * as productSaleRepo from '@/repositories/product-sale.repository'
import * as expenseRepo from '@/repositories/expense.repository'
import type { CreateProductInput } from '@/types'

function todayAR() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export async function createProduct(
  supabase: SupabaseClient,
  barbershopId: string,
  input: CreateProductInput
) {
  const { error } = await productRepo.insert(supabase, {
    barbershop_id: barbershopId,
    ...input,
  })
  if (error) return { error: 'No se pudo crear el producto. ' + error.message }

  if (input.stock > 0 && input.cost_price > 0) {
    await expenseRepo.insert(supabase, {
      barbershop_id: barbershopId,
      description: `Stock inicial: ${input.name} (${input.stock} u.)`,
      amount: input.cost_price * input.stock,
      category: 'Productos',
      date: todayAR(),
    })
  }

  return {}
}

export async function sellProduct(
  supabase: SupabaseClient,
  barbershopId: string,
  { product_id, quantity, date }: { product_id: string; quantity: number; date: string }
) {
  const product = await productRepo.findById(supabase, barbershopId, product_id)
  if (!product) return { error: 'Producto no encontrado.' }
  if (product.stock < quantity) return { error: `Stock insuficiente. Quedan ${product.stock} unidades.` }

  const [insertRes] = await Promise.all([
    productSaleRepo.insert(supabase, {
      barbershop_id: barbershopId,
      product_id,
      quantity,
      sale_price: product.sale_price,
      date,
    }),
    productRepo.updateStock(supabase, barbershopId, product_id, product.stock - quantity),
  ])

  if (insertRes.error) return { error: 'No se pudo registrar la venta.' }
  return {}
}

export async function sellProducts(
  supabase: SupabaseClient,
  barbershopId: string,
  { items, date }: { items: { product_id: string; quantity: number; sale_price: number }[]; date: string }
) {
  const ids = items.map(i => i.product_id)
  const dbProducts = await productRepo.findByIds(supabase, barbershopId, ids)
  if (!dbProducts) return { error: 'No se pudieron verificar los productos.' }

  for (const item of items) {
    const dbP = dbProducts.find(p => p.id === item.product_id)
    if (!dbP) return { error: 'Producto no encontrado.' }
    if (dbP.stock < item.quantity) return { error: `Stock insuficiente para ${dbP.name} (${dbP.stock} disponibles).` }
  }

  const transaction_id = crypto.randomUUID()

  const [insertRes] = await Promise.all([
    productSaleRepo.insertMany(supabase, items.map(i => ({
      barbershop_id: barbershopId,
      product_id: i.product_id,
      quantity: i.quantity,
      sale_price: i.sale_price,
      date,
      transaction_id,
    }))),
    ...items.map(i => {
      const dbP = dbProducts.find(p => p.id === i.product_id)!
      return productRepo.updateStock(supabase, barbershopId, i.product_id, dbP.stock - i.quantity)
    }),
  ])

  if (insertRes.error) return { error: 'No se pudo registrar la venta.' }
  return {}
}

export async function restockProduct(
  supabase: SupabaseClient,
  barbershopId: string,
  productId: string,
  quantity: number,
  costPrice: number
) {
  const product = await productRepo.findById(supabase, barbershopId, productId)
  if (!product) return

  await Promise.all([
    productRepo.updateStockAndCost(supabase, barbershopId, productId, product.stock + quantity, costPrice),
    expenseRepo.insert(supabase, {
      barbershop_id: barbershopId,
      description: `Reposición: ${product.name} (${quantity} u.)`,
      amount: costPrice * quantity,
      category: 'Productos',
      date: todayAR(),
    }),
  ])
}

export async function toggleProduct(
  supabase: SupabaseClient,
  barbershopId: string,
  productId: string,
  active: boolean
) {
  await productRepo.updateActive(supabase, barbershopId, productId, active)
}

export async function updateProductData(
  supabase: SupabaseClient,
  barbershopId: string,
  productId: string,
  data: { name: string; sale_price: number; stock: number }
) {
  const { error } = await productRepo.updateData(supabase, barbershopId, productId, {
    name: data.name.trim(),
    sale_price: data.sale_price,
    stock: data.stock,
  })
  if (error) return { error: 'No se pudo actualizar el producto.' }
  return { success: true as const }
}

export async function updateProductActive(
  supabase: SupabaseClient,
  barbershopId: string,
  productId: string,
  active: boolean
) {
  const { error } = await productRepo.updateActive(supabase, barbershopId, productId, active)
  if (error) return { error: 'No se pudo actualizar el estado del producto.' }
  return { success: true as const }
}

export async function deleteProduct(
  supabase: SupabaseClient,
  barbershopId: string,
  productId: string
) {
  const salesCount = await productSaleRepo.countByProductId(supabase, barbershopId, productId)

  if (salesCount === 0) {
    const hardDelete = await productRepo.hardDeleteById(supabase, barbershopId, productId)
    if (!hardDelete.error) return { mode: 'hard' as const }
  }

  const softDelete = await productRepo.softDeleteById(supabase, barbershopId, productId)
  if (softDelete.error) return { error: 'No se pudo eliminar el producto.' }

  return { mode: 'soft' as const }
}

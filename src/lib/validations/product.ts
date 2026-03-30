import { z } from 'zod'

export const CreateProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').trim(),
  cost_price: z.number({ error: 'Ingresá un precio de costo.' }).min(0),
  sale_price: z.number({ error: 'Ingresá un precio de venta.' }).positive('El precio de venta debe ser mayor a 0.'),
  stock: z.number({ error: 'Ingresá la cantidad.' }).int().min(0),
})

export const UpdateProductDataSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').trim(),
  sale_price: z.number({ error: 'Ingresá un precio válido.' }).min(0),
  stock: z.number({ error: 'Ingresá un stock válido.' }).int().min(0),
})

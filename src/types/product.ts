export type Product = {
  id: string
  barbershop_id: string
  name: string
  cost_price: number
  sale_price: number
  stock: number
  active: boolean
  created_at: string
}

export type CreateProductInput = {
  name: string
  cost_price: number
  sale_price: number
  stock: number
}

export type ProductSale = {
  id: string
  barbershop_id: string
  product_id: string
  quantity: number
  sale_price: number
  date: string
  created_at: string
}

export type ProductSaleWithRelations = ProductSale & {
  products: { name: string }
}

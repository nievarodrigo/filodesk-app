export const CATEGORIES = ['Alquiler', 'Productos', 'Servicios', 'Sueldos', 'Otros'] as const
export type Category = typeof CATEGORIES[number]

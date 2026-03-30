import { BarbershopRole } from '@/lib/definitions'

export const PERMISSIONS_BY_ROLE: Record<BarbershopRole, string[]> = {
  owner: [
    'view_finance',
    'manage_inventory',
    'register_sale',
    'manage_barbers',
    'manage_services',
    'manage_expenses',
    'manage_payroll',
    'manage_members',
    'change_plan',
    'delete_barbershop',
  ],
  manager: [
    'view_finance',
    'manage_inventory',
    'register_sale',
    'manage_barbers',
    'manage_services',
    'manage_expenses',
    'manage_payroll',
    'manage_members',
  ],
  barber: [
    'register_sale',
  ],
}

export function canAccess(role: BarbershopRole, permission: string): boolean {
  return PERMISSIONS_BY_ROLE[role].includes(permission)
}

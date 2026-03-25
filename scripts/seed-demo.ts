/**
 * FiloDesk — Seed de cuenta demo
 * Uso: SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-demo.ts
 *
 * Crea:
 *  - Usuario: demo@filodesk.com / FiloDesk2024!
 *  - Barbería: "Barbería El Filo"
 *  - 3 barberos con distintas comisiones
 *  - 3 meses de ventas realistas
 *  - Gastos mensuales + ocasionales
 *  - Ventas de productos
 *  - Nóminas liquidadas de los meses anteriores
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://usprinycrhtkcolkleaa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Falta SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── helpers ────────────────────────────────────────────────────────────────

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmt(date: Date) {
  return date.toISOString().slice(0, 10)
}

/** Genera fechas de trabajo en un rango (lun-sab, excluye domingo) */
function workDays(from: Date, to: Date): Date[] {
  const days: Date[] = []
  const cur = new Date(from)
  while (cur <= to) {
    if (cur.getDay() !== 0) days.push(new Date(cur)) // 0 = domingo
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

// ─── fechas base ─────────────────────────────────────────────────────────────

const today = new Date()
today.setHours(0, 0, 0, 0)

const m0start = new Date(today.getFullYear(), today.getMonth() - 3, 1) // hace 3 meses
const m1start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
const m2start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
const m2end   = new Date(today.getFullYear(), today.getMonth(), 0)     // fin del mes pasado
const m3start = new Date(today.getFullYear(), today.getMonth(), 1)     // mes actual

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔑 Creando usuario demo...')

  // Intentar borrar si ya existe
  const { data: existing } = await supabase.auth.admin.listUsers()
  const prev = existing?.users?.find(u => u.email === 'demo@filodesk.com')
  if (prev) {
    await supabase.auth.admin.deleteUser(prev.id)
    console.log('   (usuario anterior eliminado)')
  }

  const { data: { user }, error: userErr } = await supabase.auth.admin.createUser({
    email: 'demo@filodesk.com',
    password: 'FiloDesk2024!',
    email_confirm: true,
    user_metadata: { first_name: 'Demo', last_name: 'FiloDesk' },
  })
  if (userErr || !user) { console.error(userErr); process.exit(1) }
  console.log('   ✓ usuario', user.email)

  // Barbería
  const { data: shop, error: shopErr } = await supabase
    .from('barbershops')
    .insert({ owner_id: user.id, name: 'Barbería El Filo' })
    .select('id')
    .single()
  if (shopErr || !shop) { console.error(shopErr); process.exit(1) }
  const shopId = shop.id
  console.log('✂️  Barbería creada:', shopId)

  // Barberos
  const { data: barbers, error: barberErr } = await supabase
    .from('barbers')
    .insert([
      { barbershop_id: shopId, name: 'Matías Romero',  commission_pct: 50 },
      { barbershop_id: shopId, name: 'Franco Díaz',    commission_pct: 45 },
      { barbershop_id: shopId, name: 'Julián Torres',  commission_pct: 40 },
    ])
    .select('id, name, commission_pct')
  if (barberErr || !barbers) { console.error(barberErr); process.exit(1) }
  console.log('👤 Barberos:', barbers.map(b => b.name).join(', '))

  // Service types globales (obtenemos los IDs)
  const { data: globalServices } = await supabase
    .from('service_types')
    .select('id, name')
    .is('barbershop_id', null)
  const svcMap = Object.fromEntries((globalServices ?? []).map(s => [s.name, s.id]))

  // Servicios custom de la barbería
  const { data: customSvcs } = await supabase
    .from('service_types')
    .insert([
      { barbershop_id: shopId, name: 'Degradé',           active: true },
      { barbershop_id: shopId, name: 'Tintura',            active: true },
      { barbershop_id: shopId, name: 'Corte de niño',      active: true },
    ])
    .select('id, name')
  const customMap = Object.fromEntries((customSvcs ?? []).map(s => [s.name, s.id]))
  const allSvcs = { ...svcMap, ...customMap }
  const svcIds = Object.values(allSvcs)
  console.log('🔧 Servicios:', Object.keys(allSvcs).join(', '))

  // Productos
  const { data: prods } = await supabase
    .from('products')
    .insert([
      { barbershop_id: shopId, name: 'Cera Capilar',    cost_price: 2500,  sale_price: 5000,  stock: 12 },
      { barbershop_id: shopId, name: 'Shampoo Men',      cost_price: 1800,  sale_price: 3500,  stock: 8  },
      { barbershop_id: shopId, name: 'Perfume Oud',      cost_price: 8000,  sale_price: 15000, stock: 4  },
      { barbershop_id: shopId, name: 'Aceite de barba',  cost_price: 3000,  sale_price: 6000,  stock: 6  },
    ])
    .select('id, name, sale_price')
  const prodList = prods ?? []
  console.log('📦 Productos:', prodList.map(p => p.name).join(', '))

  // ─── precios por servicio ────────────────────────────────────────────────
  const svcPrices: Record<string, number> = {
    'Corte':                  8000,
    'Barba':                  5000,
    'Cejas':                  3000,
    'Corte + Barba':          12000,
    'Corte + Barba + Cejas':  15000,
    'Degradé':                10000,
    'Tintura':                18000,
    'Corte de niño':          6000,
  }

  // ─── VENTAS — 3 meses completos ─────────────────────────────────────────
  console.log('💰 Generando ventas...')
  const allSvcNames = Object.keys(allSvcs)

  const salesRows: any[] = []
  const prodSalesRows: any[] = []

  for (const [rangeStart, rangeEnd] of [
    [m0start, new Date(today.getFullYear(), today.getMonth() - 2, 0)],
    [m1start, new Date(today.getFullYear(), today.getMonth() - 1, 0)],
    [m2start, m2end],
  ] as [Date, Date][]) {
    const days = workDays(rangeStart, rangeEnd)

    for (const day of days) {
      const isWeekend = day.getDay() === 6 // sábado
      const salesPerBarber = isWeekend ? rnd(6, 10) : rnd(3, 7)

      for (const barber of barbers) {
        const nSales = salesPerBarber + (barber.name === 'Matías Romero' ? 1 : 0) // matias es el más ocupado
        for (let i = 0; i < nSales; i++) {
          const svcName = allSvcNames[rnd(0, allSvcNames.length - 1)]
          const basePrice = svcPrices[svcName] ?? 8000
          const variation = rnd(-500, 500)
          salesRows.push({
            barbershop_id:   shopId,
            barber_id:       barber.id,
            service_type_id: allSvcs[svcName],
            amount:          basePrice + variation,
            date:            fmt(day),
          })
        }
      }

      // Venta de productos: ~2 por día de forma aleatoria
      if (Math.random() < 0.4 && prodList.length > 0) {
        const prod = prodList[rnd(0, prodList.length - 1)]
        prodSalesRows.push({
          barbershop_id: shopId,
          product_id:    prod.id,
          quantity:      1,
          sale_price:    prod.sale_price,
          date:          fmt(day),
        })
      }
    }
  }

  // Mes actual (desde el 1ro hasta ayer)
  const yesterday = addDays(today, -1)
  if (yesterday >= m3start) {
    const days = workDays(m3start, yesterday)
    for (const day of days) {
      const isWeekend = day.getDay() === 6
      for (const barber of barbers) {
        const nSales = isWeekend ? rnd(5, 9) : rnd(3, 6)
        for (let i = 0; i < nSales; i++) {
          const svcName = allSvcNames[rnd(0, allSvcNames.length - 1)]
          const basePrice = svcPrices[svcName] ?? 8000
          salesRows.push({
            barbershop_id:   shopId,
            barber_id:       barber.id,
            service_type_id: allSvcs[svcName],
            amount:          basePrice + rnd(-500, 500),
            date:            fmt(day),
          })
        }
      }
    }
  }

  // Insertar en batches de 500
  for (let i = 0; i < salesRows.length; i += 500) {
    const { error } = await supabase.from('sales').insert(salesRows.slice(i, i + 500))
    if (error) { console.error('Error ventas:', error); process.exit(1) }
  }
  console.log(`   ✓ ${salesRows.length} ventas de servicios`)

  for (let i = 0; i < prodSalesRows.length; i += 500) {
    const { error } = await supabase.from('product_sales').insert(prodSalesRows.slice(i, i + 500))
    if (error) { console.error('Error product_sales:', error); process.exit(1) }
  }
  console.log(`   ✓ ${prodSalesRows.length} ventas de productos`)

  // ─── GASTOS ──────────────────────────────────────────────────────────────
  console.log('🧾 Cargando gastos...')
  const gastos: any[] = []

  for (const [ms, me] of [
    [m0start, new Date(today.getFullYear(), today.getMonth() - 2, 0)],
    [m1start, new Date(today.getFullYear(), today.getMonth() - 1, 0)],
    [m2start, m2end],
    [m3start, today],
  ] as [Date, Date][]) {
    const mesStr = fmt(addDays(ms, 5))
    gastos.push(
      { barbershop_id: shopId, description: 'Alquiler del local',     amount: 120000, date: fmt(ms)     },
      { barbershop_id: shopId, description: 'Servicios (luz/agua)',    amount: 18000,  date: mesStr      },
      { barbershop_id: shopId, description: 'Productos de limpieza',   amount: 8500,   date: mesStr      },
      { barbershop_id: shopId, description: 'Insumos (toallas, etc.)', amount: 12000,  date: mesStr      },
    )
    // gastos ocasionales
    if (Math.random() < 0.5) {
      gastos.push({ barbershop_id: shopId, description: 'Mantenimiento sillón', amount: rnd(15000, 30000), date: fmt(addDays(ms, rnd(7, 25))) })
    }
  }

  const { error: gastoErr } = await supabase.from('expenses').insert(gastos)
  if (gastoErr) { console.error(gastoErr); process.exit(1) }
  console.log(`   ✓ ${gastos.length} gastos`)

  // ─── NÓMINAS (meses cerrados) ────────────────────────────────────────────
  console.log('📋 Generando nóminas...')
  const payrolls: any[] = []

  for (const [ps, pe] of [
    [m0start, new Date(today.getFullYear(), today.getMonth() - 2, 0)],
    [m1start, new Date(today.getFullYear(), today.getMonth() - 1, 0)],
    [m2start, m2end],
  ] as [Date, Date][]) {
    for (const barber of barbers) {
      // Calculamos total de ventas de ese barbero en ese período
      const { data: bSales } = await supabase
        .from('sales')
        .select('amount')
        .eq('barbershop_id', shopId)
        .eq('barber_id', barber.id)
        .gte('date', fmt(ps))
        .lte('date', fmt(pe))

      const total = (bSales ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
      const comm  = Math.round(total * barber.commission_pct / 100)

      payrolls.push({
        barbershop_id:     shopId,
        barber_id:         barber.id,
        period_start:      fmt(ps),
        period_end:        fmt(pe),
        total_sales:       total,
        commission_pct:    barber.commission_pct,
        commission_amount: comm,
        status:            'paid',
        paid_at:           new Date(pe).toISOString(),
      })
    }
  }

  const { error: payErr } = await supabase.from('payrolls').insert(payrolls)
  if (payErr) { console.error(payErr); process.exit(1) }
  console.log(`   ✓ ${payrolls.length} nóminas`)

  console.log('\n✅ Seed completo!')
  console.log('   Email:    demo@filodesk.com')
  console.log('   Password: FiloDesk2024!')
}

main().catch(console.error)

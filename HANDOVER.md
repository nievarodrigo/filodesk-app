# Handover — feature/ux-sidebar-refactor

## Qué se hizo en esta rama

Refactor completo de UX/UI del dashboard. Todo está comitteado y pusheado. La rama sale de `develop`.

### Cambios por commit

| Commit | Descripción |
|--------|-------------|
| `ed8873e` | Sidebar agrupado: secciones "Negocio" y "Equipo", link Configuración al fondo (owner-only) |
| `f3e9315` | /ventas redirige a /finanzas?tab=movimientos. MovimientosTab es server component. FiltroFechas tiene prop `basePath` opcional |
| `54e06c5` | /gastos → /egresos, /nominas → /egresos?tab=nominas. Nueva página /egresos unifica ambos con tabs |
| `bc23bee` | Nueva página /configuracion (owner-only): editar datos del local, ver plan, links a equipo |
| `6926022` | Espaciado home estandarizado a 24px en todos los widgets |
| `8c4d855` | /suscripcion siempre muestra selector de planes primero. Plan Intermedio aparece como "Próximamente" hardcodeado |
| `faf5364` | Limpieza CLAUDE.md |

---

## Arquitectura relevante

- **Permisos**: `canAccess(role, permission)` — Configuración usa `change_plan` (owner only)
- **Tabs server-side**: early return pattern en page.tsx según `searchParams.tab`
- **Acciones**: `updateBarbershop` en `src/app/actions/barbershop.ts` — valida, actualiza, revalida paths
- **MovimientosTab**: server component en `/finanzas/`, importa componentes de `../ventas/` con imports relativos
- **Egresos**: importa componentes de `../gastos/` y `../nominas/` con sus propios CSS modules

---

## Pendiente / próximas funcionalidades

### Cierre de caja (deferred)
- Card en Inicio + historial en tab "Resumen" de Finanzas
- Requiere tabla `daily_closings` en Supabase (aún no existe)
- Diseño acordado: el encargado cierra desde home, el owner ve el historial en finanzas

### Plan Intermedio
- El card en /suscripcion está hardcodeado como "Próximamente"
- Cuando esté listo: agregar fila en tabla `plans` con `id: 'intermedio'`, el card se renderiza solo
- Features del card actual (placeholder): reportes avanzados, múltiples sucursales, soporte prioritario — confirmar con producto

### Otras ideas mencionadas pero no implementadas
- Notificaciones en sidebar
- Onboarding para nuevas barberías

---

## Archivos clave

```
src/components/dashboard/Sidebar.tsx              — navegación principal
src/components/dashboard/sidebar.module.css
src/app/dashboard/[barbershopId]/
  page.tsx                                         — home del dashboard
  configuracion/page.tsx                           — config owner-only
  configuracion/UpdateBarbershopForm.tsx
  finanzas/page.tsx                                — tabs: Resumen | Movimientos
  finanzas/MovimientosTab.tsx                      — ex-ventas como server component
  egresos/page.tsx                                 — tabs: Gastos | Nóminas
  ventas/FiltroFechas.tsx                          — tiene prop basePath opcional
src/app/actions/barbershop.ts                      — updateBarbershop server action
src/app/suscripcion/SuscripcionClient.tsx          — flujo de suscripción con selector de planes
```

---

## Para mergear

```bash
git checkout develop
git merge feature/ux-sidebar-refactor
```

No hay conflictos esperados — todos los archivos tocados son exclusivos de esta rama.

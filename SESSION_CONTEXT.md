# 💈 FiloDesk: Contexto de Desarrollo (Handover)
**Última actualización:** 2026-03-29 22:30 (Senior QA & Technical Reviewer)

## 🎯 Objetivo de la Sesión
Transformar el proyecto de un MVP básico a un SaaS robusto con múltiples planes (Base, Pro, Premium IA), gestión de equipos (RBAC) y seguridad operativa.

## 🚀 Hitos Logrados (Tanda de 22 Tickets)
1.  **Seguridad & Roles (RBAC):** Implementación de roles 'owner', 'manager' y 'barber' vinculados a la tabla `barbershop_members`.
2.  **Sistema de Planes:** Orquestación de features por plan (Base: 6 barberos max, Pro: Ilimitado + Roles + Excel).
3.  **Atomicidad en Pagos:** Migración de lógica manual a Postgres RPC (`approve_subscription_v1`) para evitar estados inconsistentes.
4.  **Anti-Fraude:** Flujo de aprobación de ventas. Los barberos registran en 'pending' y el dueño aprueba en el Home para que sume a finanzas.
5.  **Automatización de Equipo:** Vinculación automática Barbero <-> Usuario vía email al primer login.
6.  **Login Social:** Implementación de Google OAuth unificado.
7.  **Comunicación Dinámica:** Botones de WhatsApp con mensajes pre-armados para Nóminas e Invitaciones.
8.  **Testing & Monitoreo:** Suite de Vitest (7/7 tests OK) e integración completa con Sentry.
9.  **Build Recovery:** Solución de múltiples errores de TypeScript y cache de Vercel (Rutas obsoletas eliminadas).

## 🛡️ Reglas Técnicas Críticas (No Romper)
- **Sidebar Sagrado:** PROHIBIDO modificar la estructura de `Sidebar.tsx`. Solo añadir links condicionales vía `canAccess`.
- **Autorización Unificada:** Usar siempre `getServerAuthContext(supabase, barbershopId, userId, privilegedSupabase)` para validar acceso.
- **RLS Bypass Seguro:** En páginas de suscripción o registro, usar `privilegedSupabase` (createServiceClient) solo para comprobaciones de identidad, pasando luego el cliente al service de auth.
- **Plan Pro Locked:** El Plan Pro está bloqueado para el público general. Solo está habilitado para la barbería de test: `bba517b8-ea61-45d0-8b70-adb41298d54f`.

## 📅 Próximos Pasos (Pendientes)
- **Fase Plan Base (Simple):** Aprolijar UX/UI para que sea "espejo" (perfecto).
- **Mobile UX:** Revisar tablas y formularios en pantallas pequeñas del Plan Base.
- **Exportación Pro:** El botón de CSV en Plan Base debe seguir funcionando como gancho de marketing (Upgrade UI).

## 🔑 Credenciales de Test
- **Barbershop ID (Testing Pro):** `bba517b8-ea61-45d0-8b70-adb41298d54f`
- **Database vinculada via CLI:** `usprinycrhtkcolkleaa`

---
*Este contexto asegura que la siguiente sesión mantenga la misma línea arquitectónica y de negocio.*

# FiloDesk — Project Brief

## 1. Resumen Ejecutivo
**FiloDesk** es un SaaS de gestión integral para barberías. Permite a dueños y encargados controlar ingresos, gastos, comisiones de barberos, stock de productos, y genera reportes en tiempo real. Monetización por suscripción con 3 planes.

**Ubicación:** Argentina (ARS, española)
**Usuarios:** Barberos, dueños, encargados de barberías
**MVP Status:** En desarrollo activo, features base completas, planes avanzados por venir

---

## 2. Problema que Resuelve
Las barberías pequeñas/medianas operan con:
- Cuadernos o hojas de cálculo para registrar ventas
- Sin visibilidad de ingresos/gastos en tiempo real
- Comisiones calculadas manualmente (error-prone)
- Sin control de stock
- Sin reportes históricos

**Resultado:** Toman decisiones sin datos, pierden dinero por ineficiencia, no saben cuál es su ganancia real.

---

## 3. Objetivo Principal
Ser **la plataforma SaaS estándar** para gestión de barberías en Latinoamérica (empezando Argentina), reemplazando cuadernos/Excel con software inteligente que:
- Automatiza registro de ventas/servicios
- Calcula comisiones en tiempo real
- Muestra ganancia neta (ingresos - comisiones - gastos)
- Genera reportes
- Accede desde celular sin instalar nada (web first)

---

## 4. Tipo de Usuario / Cliente Ideal
**Primario:** Dueños de barberías (2-10 barberos)
- Edad: 25-50 años
- Presupuesto: Pueden pagar $12-30k ARS/mes por herramienta
- Pain: No saben cuánto ganan realmente
- Motivación: Tomar mejores decisiones, dormir tranquilo sabiendo números

**Secundario:** Encargados/gerentes de barberías
- Usan el sistema día a día
- Registran ventas, controlan barberos
- No ven financiero (eso lo ve el dueño)

---

## 5. Casos de Uso Principales

### Caso 1: Dueño revisa ganancia del día
1. Abre dashboard al cerrar barbería
2. Ve: Servicios hoy, Ingresos, Comisiones, Ganancia neta
3. Exporta reporte si quiere contable

### Caso 2: Nuevo servicio/producto en la barbería
1. Dueño crea servicio "Corte + Barba" = $200 ARS
2. Sistema le propone precio sugerido basado en histórico
3. Barbero lo registra en el celular cuando lo hace

### Caso 3: Calcular comisión a un barbero
1. Sistema ve: Barbero X hizo $5,000 en servicios
2. Comisión = 15% = $750 (configurable por barbero)
3. Muestra desglosado por servicio

### Caso 4: Control de stock
1. Stock bajo de un producto → alerta
2. Dueño recibe notificación
3. Reordena antes de que falte

### Caso 5: Análisis histórico
1. Dueño quiere ver: "¿Qué día de la semana gano más?"
2. Sistema muestra gráficos de últimos 30/90 días
3. Identifica patrones

---

## 6. Propuesta de Valor
- **Para dueño:** Automatización, datos reales, decisiones mejores, menos fraude
- **Para barbero:** Transparencia de comisiones, pago justo
- **Para usuario:** Acceso desde celular, gratis 14 días, sin compromiso
- **Vs Excel:** Tiempo real, automático, reportes, mobile
- **Vs papeleta:** Histórico completo, búsqueda, 0 errores

---

## 7. Flujo General del Negocio

```
Usuario aún no registrado
  ↓
Landing page → Signup gratis (14 días trial)
  ↓
Onboarding: Crea barbería, agrega barberos
  ↓
Dashboard activo (Trial)
  ├→ Registra ventas diarias
  ├→ Ve ingresos/comisiones en tiempo real
  └→ Al día 14 o vencimiento de trial
     ↓
     Paga suscripción (Plan Base/Pro/Premium)
     ├→ Método 1: MercadoPago Checkout (pago único)
     ├→ Método 2: Débito automático mensual (MP)
     └→ Método 3: Transferencia bancaria (GalioPay)
     ↓
Plan activo indefinidamente
  ├→ Renueva cada mes automáticamente
  └→ Si no paga → Plan vence → Redirige a suscripción nuevamente
```

---

## 8. Estado Actual del Proyecto

### Última actualización: 27 de marzo de 2026

**Rama activa:** `main` (deployada en Vercel)
**Tech Stack:**
- Frontend: Next.js 15+ (App Router), React
- Backend: Next.js Server Actions + Supabase
- BD: Supabase PostgreSQL
- Pagos: MercadoPago API + GalioPay API
- Hosting: Vercel

**Cambios recientes (esta sesión):**
1. ✅ Rediseño completo página de suscripción (UX/UI nivel mundial)
   - Selector de meses (1/3/6/12) con descuentos automáticos (-8%, -13%, -20%)
   - 3 métodos de pago visuales: MP Checkout / Débito automático / Transferencia
   - Badges coloreados por plan
   - Top borders diferenciados
2. ✅ Integración GalioPay para transferencias bancarias
3. ✅ Header en suscripción y dashboard con fecha de hoy y cuándo vence plan/trial

---

## 9. Qué ya está Implementado

### Auth & Onboarding
- ✅ Login/signup con Supabase Auth
- ✅ Email verification
- ✅ Onboarding inicial (crear barbería, agregar barberos)
- ✅ Trial automático de 14 días

### Dashboard Principal
- ✅ KPIs de hoy: Servicios, Ingresos, Comisiones, Ganancia neta
- ✅ Registro de ventas (servicios + productos)
- ✅ Lista de ventas recientes del día
- ✅ Gestión de barberos (crear, editar, activo/inactivo)
- ✅ Gestión de servicios (precio, activo/inactivo)
- ✅ Gestión de productos (stock, precio venta)
- ✅ Registro de gastos diarios
- ✅ Cálculo automático de comisiones (por barbero, configurable)

### Suscripción & Pagos
- ✅ Landing page con 3 planes visibles
- ✅ Trial automático (14 días)
- ✅ Página de suscripción rediseñada (UX/UI nivel mundial)
- ✅ Selector de duración (1/3/6/12 meses) con descuentos
- ✅ 3 métodos de pago:
  - MercadoPago Checkout (pago único, cualquier duración)
  - MercadoPago Suscripción automática (mensual, 1 mes solo)
  - GalioPay Transferencia bancaria (cualquier duración)
- ✅ Webhook de MercadoPago para confirmar pagos
- ✅ Estados: trial, active, expired

### Admin
- ✅ Panel admin para ver clientes, estado suscripción, fechas
- ✅ Búsqueda y filtros básicos

### UX/UI
- ✅ Tema dark/light toggle
- ✅ Responsive mobile-first
- ✅ Landing page profesional
- ✅ Componentes de pricing con badges/estados visuales claros

---

## 10. Qué falta Construir

### Fase 2: Features Avanzadas (Pro Plan)
- ❌ Roles: Dueño (acceso total) / Encargado (sin ver finanzas) / Barbero (solo sus datos)
- ❌ Barberos ilimitados (Plan Base = 5 máximo)
- ❌ Reportes exportables (PDF/Excel)
- ❌ Historial completo sin límite (Plan Base = últimos 90 días)
- ❌ Estadísticas avanzadas (por barbero, por servicio, tendencias)

### Fase 3: Features IA (Premium Plan)
- ❌ Predicción de demanda (qué día/hora viene más gente)
- ❌ Alertas inteligentes (caída de ingresos, barbero con bajo rendimiento)
- ❌ Recomendaciones de precios por temporada
- ❌ Sugerencias de inversión en publicidad

### Integraciones
- ❌ WhatsApp notificaciones (recordatorio de pago vencido)
- ❌ Email automáticos (resumen semanal, alerta de vencimiento)
- ❌ Webhook de GalioPay para confirmación de transferencias

### Mejoras Operacionales
- ❌ Sistema de turnos/reservas (opcional para barberías)
- ❌ Multi-barbería (dueño con varias sucursales)
- ❌ Integración con Google Calendar/Calendly

---

## 11. Decisiones Importantes ya Tomadas

1. **Stack:** Next.js + Supabase (elegido por velocidad, no necesita backend separado)
2. **Monetización:** Suscripción por plan, no por features (todo incluido en cada plan)
3. **Divisor Base/Pro:** 5 barberos (Base) → ilimitados (Pro)
4. **Pagos:**
   - Primario: MercadoPago (dominante en Latam)
   - Secundario: GalioPay (transferencias sin retención)
   - No incluir crypto, no integrar Stripe por ahora
5. **Lenguaje:** Español (es-AR) como principal
6. **Trial:** 14 días automático (sin tarjeta requerida)
7. **UX de suscripción:** Multi-plan visible en landing, no ocultar Pro/Premium
   - Pro/Premium marcan "próximamente" si aún no están implementados
8. **Comisiones:** Configurables por barbero, no globales
9. **No incluir inicialmente:** Sistema de turnos, multi-barbería, SMS

---

## 12. Restricciones Técnicas o de Negocio

### Técnicas
- Supabase tiene límites de RLS (Row Level Security) complejos con múltiples roles
- GalioPay es nuevo, documentación limitada en algunos aspectos
- MercadoPago webhooks pueden tener delays (hasta 10min en sandbox)

### Negocio
- No tenemos tráfico pagante aún (fase MVP)
- Dependencia de MercadoPago (riesgo: cambios de API, políticas)
- Argentina: Inestabilidad económica, dólar variable (afecta precios)
- Competencia directa: no existe en Latam actualmente (oportunidad)

---

## 13. Riesgos o Dudas Abiertas

### Riesgos
1. **Churn alto en trial:** Si dueño no entiende beneficios, no paga
   - Mitiga: Onboarding mejor, email de educación durante trial
2. **MercadoPago rechaza cuenta:** Varias reasons (fraude, documentación)
   - Mitiga: Tener plan B (Stripe?) listo
3. **GalioPay escala mal:** Infraestructura débil si crecemos mucho
   - Mitiga: Monitorear, tener contacto directo

### Dudas Abiertas
1. ¿Cuál es el price point óptimo? ($11,999 es hipótesis, no validada
2. ¿Cuántas barberías hay en Argentina? ¿Cuál es TAM?
3. ¿Qué % de dueños tienen smartphone con internet?
4. ¿Debemos incluir sistema de turnos desde inicio?

---

## 14. Prioridades Actuales

### Sprint Actual (Semana del 27 de marzo)
1. **COMPLETADO:** Rediseño suscripción UX/UI nivel mundial
2. **COMPLETADO:** Integración GalioPay básica
3. **COMPLETADO:** Header con fecha de vencimiento en dashboard y suscripción

### Próximos Sprints (Orden de prioridad)
1. **Testing & Bug fixes** → Usar 14 días de trial para encontrar problemas
2. **Webhook GalioPay** → Confirmar pagos por transferencia automáticamente
3. **Email transaccionales** → Confirmación pago, recordatorio trial vencido, factura
4. **Documentación de usuario** → Guía, FAQ, video onboarding
5. **Beta abierto** → Invitar 10-20 barberías amigas, recolectar feedback
6. **Análisis de comportamiento** → Qué users pagan, cuál es churn
7. **Pro Plan MVP** → Comenzar a implementar: roles, barberos ilimitados, reportes
8. **Growth inicial** → LinkedIn, comunidades de barberos, referencias

---

## 15. Cómo Definiríamos que el Proyecto fue Exitoso

### MVP (Ahora)
- ✅ Producto funcional sin crashes
- ✅ 50 usuarios en trial (early adopters)
- ✅ 10 usuarios pagando (conversión 20%+)
- ✅ NPS > 40

### Year 1 (Target)
- 500 barberías usando FiloDesk
- 50% conversión trial → pago
- $200k ARR (500 × $12k/año promedio)
- Expansion a otro país (Uruguay/Chile)
- Pro Plan completamente funcional

### Year 3 (Vision)
- 5,000+ barberías en Latam
- $2M+ ARR
- App móvil nativa
- Integración con sistema POS de terceros
- Posibilidad de venta/acuerdo estratégico

---

## 16. Instrucciones para un Nuevo Asistente (Ej: Codex)

### Qué Debes Entender Primero (En Orden)
1. **El negocio:** Es SaaS de suscripción para barberías. No es plataforma de marketplace.
2. **El usuario primario:** Dueño de barbería, decisor financiero, no tech-savvy necesariamente.
3. **El stack:** Next.js + Supabase + Vercel. Todo en TypeScript.
4. **Los ficheros clave:**
   - `src/app/dashboard/[barbershopId]/page.tsx` - Dashboard principal
   - `src/app/suscripcion/SuscripcionClient.tsx` - Página de compra (recientemente rediseñada)
   - `src/repositories/barbershop.repository.ts` - Queries a BD
   - `src/services/subscription.service.ts` - Lógica de suscripción
5. **Los flujos críticos:**
   - Trial → Suscripción → Pago → Activo
   - Registro de venta → Comisión calculada → Ganancia actualizada

### Qué NO Debes Tocar Sin Revisar
- ❌ Webhooks de MercadoPago (son críticos, producción vive de esto)
- ❌ Esquema de BD (cambios pueden romper usuario existentes)
- ❌ Precios/descuentos (decisión de negocio, no técnica)
- ❌ Flujo de autenticación (RLS de Supabase es complejo)
- ❌ Reducción de campos consultados a BD (aumenta latencia)

### Qué Objetivos Deberías Priorizar
1. **Estabilidad:** No bugs que rompan dashboard o pago
2. **Performance:** Dashboard carga en <2s
3. **UX:** El flujo trial→pago es intuitivo
4. **Escalabilidad:** Preparar para 1000+ usuarios
5. **Datos:** Garantizar integridad de ventas/comisiones

### Qué Contexto Falta Confirmar
- [ ] ¿Hay usuarios beta reales usando el sistema?
- [ ] ¿Cuáles son los logs de producción?
- [ ] ¿Hay métricas de uso/conversión establecidas?
- [ ] ¿Cuál es el presupuesto para desarrollo?
- [ ] ¿Hay timeline/deadline definido?
- [ ] ¿Quién es responsable de decisiones de producto?

---

## 17. Cómo Contactar al Owner / PM
**Owner:** rodrigonieva (GitHub/chat)
**Preguntas de producto:** Preguntar directamente
**Cambios mayores:** Pasar por plan mode antes de código

---

## 18. Enlaces Útiles
- Repo: https://github.com/nievarodrigo/filodesk-app
- Deploy: https://filodesk.app
- Admin panel: https://filodesk.app/admin

---

**Documento actualizado:** 27 de marzo de 2026
**Versión:** 1.0

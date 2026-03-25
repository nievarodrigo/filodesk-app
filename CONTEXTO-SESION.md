# Contexto de sesión — FiloDesk

## Estado actual (25/03/2026)

### Dominio
- Comprado `filodesk.app` en Namecheap ($13.18/año)
- Nameservers apuntando a Cloudflare: `eric.ns.cloudflare.com` / `lilyana.ns.cloudflare.com`
- **DNS todavía propagando** — puede tardar hasta 24hs. Mientras tanto `filodesk.app` no carga.
- En Vercel: `filodesk.app` configurado como dominio principal de producción ✓
- `filodesk-app.vercel.app` redirige 307 → `filodesk.app`

### Email
- Pendiente: cuando propague Cloudflare, ir a Email → Email Routing y crear `hola@filodesk.app` con reenvío a Gmail (gratis)

### Screenshots mobile para el carousel
- El carousel ya tiene el toggle 🖥/📱 implementado y deployado
- **Falta**: screenshots reales de cada sección en mobile (390px)
- Bloqueado porque Playwright no puede loguear mientras el dominio no propague
- Cuando `filodesk.app` esté activo, correr este script:

```
cd /tmp && node take_mobile_screens4.js
```
(el script ya existe en /tmp, pero apunta a filodesk-app.vercel.app — cambiar a filodesk.app cuando ande)

- Una vez capturados, copiar a `/public/mockups/mobile/` y actualizar los 5 paths en `src/components/landing/MockupCarousel.tsx` (líneas con `imageMobile:`)

---

## Lo que se hizo en esta sesión

### Landing page
- **Hero**: nuevo copy "Sabé exactamente cuánto ganás" / "La herramienta que tu barbería necesitaba..."
- **Features**: reescrita con features reales (quitamos "control de caja" y "rendimiento" que no existen). Agregamos "Armá tu equipo", quitamos "Análisis de ventas"
- **MockupCarousel**: fix crítico — slides pasaron de `flex: 0 0 100%` + `max-width: 1100px` a `flex: 0 0 100vw` + `translateX(-Nvw)`. Ahora funciona en cualquier resolución
- **HowItWorks**: fix mobile — `stepsGrid` ahora 1 columna en mobile
- **Carousel mobile**: tilt removido en <=480px
- **UserMenu dropdown**: fondo era `#1a1a1a` hardcodeado, cambiado a `var(--surface)` para respetar light mode
- **Botón "Ver demo"**: removido (no tenía destino)

### Dashboard
- `NuevaVentaForm`: campo fecha removido (siempre es hoy), agregado campo cantidad (multiplicador)
- `venta.ts` action: inserta N registros por unidad para mantener ticket promedio preciso

---

## Stack
- Next.js App Router + Supabase + Vercel
- CSS Modules, tema dark/light con variables CSS
- Repo: `~/proyectos/filodesk-app`
- Deploy: Vercel auto-deploy desde `main`

## Cuenta demo
- `demo@filodesk.com` / `FiloDesk2024!`
- barbershopId demo: `0ad25ede-c018-4792-8e7e-6c95e8d993e1`

## Pendiente general
- Screenshots mobile del carousel (bloqueado por DNS)
- Email `hola@filodesk.app` via Cloudflare Email Routing (cuando propague)
- Rol barbero (feature anotada para después, no implementar aún)
- Cloudflare Turnstile: reactivar cuando el dominio esté confirmado

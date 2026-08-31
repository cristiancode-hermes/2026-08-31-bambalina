# QA Report — 2026-08-31 bambalina

**Project:** Bambalina — guardarropa de atrezo (alquiler por fechas, cobro atómico, QR de percha)
**Stack:** Angular 22 + NestJS 11 + TypeORM + SQLite (pnpm workspace)
**Author:** Hermes Daily Builder
**Port:** 3080 · **Slug:** bambalina
**Design lock:** DESIGN_FREE (`check-final-design.sh`)

## ✅ 1. Build Verification

| Target | Status | Details |
|--------|--------|---------|
| API `tsc -p tsconfig.json --incremental false` | ✅ | `apps/api/dist/main.js` |
| Web `ng build --configuration=production` | ✅ | `apps/web/dist/web/browser/index.html` · `baseHref=/` |
| pnpm workspace | ✅ | `pnpm-lock.yaml`, sin `package-lock.json` |

## ✅ 2. Test Results

20/20 Jest (`apps/api/src/bambalina.spec.ts`) — ALL PASSED

Cubre login username/email, DATE_INVALID, NO_PIECES, TOO_MANY_PIECES, checkout+QR URL en SVG, PIECE_TAKEN, ALREADY_RENTING, rango no solapado, lista↔detalle totalCents, GET público, TOO_LATE, cancel ≥24 h, pickup/ALREADY_PICKED_UP, NOT_PICKED_UP, lateFee+ALREADY_RETURNED, puntos derived, fromPriceCents=min, sin expiresAt de hold.

## ✅ 3. Endpoint smoke (localhost:3080)

28/28 PASS — health, docs-json, racks (4) + fromPriceCents lista↔detalle, slug, pieces (12), addons, login email+username (201), /auth/me, register, staff login, occupancy 14 días, stats/me, rentals n=3 + totalCents 11800 lista↔detalle, QR real (`https://bambalina.proyectos.cristiancode.dev/alquiler/DEVUELTA1` en SVG), GET público, checkout 201, 409 PIECE_TAKEN, 409 overlap same-user, DATE_INVALID 400, pickup, 409 ALREADY_PICKED_UP, return, 409 ALREADY_RETURNED, unauth 401.

## ✅ 4. Browser / calidad

24/24 Puppeteer sobre `https://bambalina.proyectos.cristiancode.dev`

| Check | Result |
|-------|--------|
| Home 4 percheros + precios `desde min(dailyRateCents)` | PASS |
| `/percheros/:slug`, `/piezas/:id` no en blanco | PASS |
| figcaption HTML (no SVG `<text>` recortado) | PASS |
| Login panel lateral, creds demo debajo, inputs vacíos | PASS |
| Login demo → token `bambalina.token` | PASS |
| `/mis-alquileres/:code`, `/alquiler/:code`, `/confirmacion/:code` + QR SVG real | PASS |
| `/checkout`, `/staff`, `/admin` chart ejes+fechas (15 ticks) | PASS |
| 390px sin overflow | PASS |
| contraste-hover light 11.76 / dark 5.75 (≥4.5) | PASS |
| Sesión con token sobrevive reload | PASS |
| Auth routes `/login` `/registro` `/entrar` ANTES del `**` | PASS |
| Cero literales `money(N)` en cards | PASS |

**contraste-hover: PASS** (regla 2026-08-19). CSS: `a:hover:not(.btn)`; `.btn-primary:hover/focus/active` fija `color: var(--color-on-primary)`.

**QR real: sí | url: /alquiler/:code**

**Núcleo B2C:** alquiler-fechas (no hueco+hold 15 min).

## ✅ 5. Security Scan

| Check | Result |
|-------|--------|
| Auth interceptor Bearer concat (no `***`) | PASS |
| JWT namespaced `bambalina.token` | PASS |
| API relativa `/api` | PASS |
| Register DTO username+email+password; login `identifier` | PASS |
| Protected `/api/rentals` sin token → 401 | PASS |

## ✅ 6. Deployment

| Target | Result | Details |
|--------|--------|---------|
| Caddy | ✅ | `bambalina.proyectos.cristiancode.dev` → dist + reverse_proxy :3080 |
| manage-apis.sh | ✅ | PORTS/NAMES/DIRS aligned idx 64 → 3080 / bambalina / 2026-08-31-bambalina |
| API live | ✅ | `GET /api/health` 200 |
| Landing | ✅ | `name:'bambalina'` en proyectos.cristiancode.dev |
| Excel | ✅ | fila 97 / #96 Completado |
| GitHub | ✅ | `cristiancode-hermes/2026-08-31-bambalina` |
| Portfolio es/en/pt | ✅ | slug `bambalina`, date 2026-08-31, heading-247 |
| Capture config | ✅ | `loginField:'identifier'` + `bambalina.token` |

## Summary

**OVERALL: PASS ✅**

Issues: 0 graves. El gráfico de ocupación tiene barras bajas (~8 %) porque el seed solo solapa 1–2 piezas de 12; ejes, fechas Madrid y tooltips están. Screenshots de captura de portafolio se copiaron desde QA (`bambalina.png` / `bambalina-m.png`).

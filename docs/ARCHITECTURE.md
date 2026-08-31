# Architecture — Bambalina

Monorepo pnpm: `apps/api` NestJS 11 + TypeORM (SQLite / Neon) · `apps/web` Angular 22 zoneless.

Transacción: `POST /api/rentals/checkout` mutex + `FOR UPDATE` (Postgres) + exclusión de rangos `startOn`/`endOn` sobre pieza única. Estados `paid → picked_up → returned`. Sin `expiresAt` de hold ni sweeper.

QR: paquete `qrcode`, payload URL absoluta `WEB_ORIGIN/alquiler/:code`.

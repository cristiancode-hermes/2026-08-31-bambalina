export const API = '/api';
export const TOKEN_KEY = 'bambalina.token';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'client' | 'staff' | 'admin' | string;
  displayName?: string;
  points?: number;
}

export interface AuthResponse {
  token: string;
  accessToken?: string;
  user: User;
}

export interface Rack {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  photoUrl: string;
  fromPriceCents: number;
  tags?: string[];
  pieces?: Piece[];
}

export interface Piece {
  id: string;
  rackId: string;
  name: string;
  sizeLabel: string;
  dailyRateCents: number;
  depositCents: number;
  photoUrl: string;
  fabricNotes?: Record<string, string>;
  available?: boolean;
  rack?: Rack;
}

export interface Addon {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
}

export interface Rental {
  id: string;
  code: string;
  startOn: string;
  endOn: string;
  status: string;
  depositCents: number;
  lateFeeCents: number;
  depositReleased: boolean;
  totalCents: number;
  computedTotal?: number;
  lines: Array<{
    id?: string;
    pieceId: string;
    name?: string;
    photoUrl?: string;
    dailyRateCents: number;
    days: number;
    lineTotalCents: number;
  }>;
  addons?: Array<{ addonId: string; name?: string; priceCents: number }>;
  qrSvg?: string;
  qrUrl?: string;
}

export function money(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

export function humanizeApiError(err: unknown): string {
  const e = err as { error?: { code?: string; message?: string }; message?: string };
  const code = e?.error?.code;
  const map: Record<string, string> = {
    PIECE_TAKEN: 'Esa prenda ya cuelga en otro guardarropa esas fechas. Elige otra o mueve los días.',
    ALREADY_RENTING: 'Ya tienes esta prenda en esas fechas. Ábrela en Mis alquileres.',
    DATE_INVALID: 'Elige un rango de 1 a 14 días, con devolución el mismo día o después.',
    TOO_MANY_PIECES: 'Máximo 4 prendas por alquiler.',
    TOO_LATE: 'Faltan menos de 24 h; no se puede cancelar.',
    ALREADY_PICKED_UP: 'Esta prenda ya salió de la percha.',
    NOT_PICKED_UP: 'Todavía no se ha recogido.',
    ALREADY_RETURNED: 'Esta prenda ya volvió al perchero.',
    ALREADY_REVIEWED: 'Ya contaste esta prenda.',
    NO_PIECES: 'Elige al menos una prenda.',
  };
  if (code && map[code]) return map[code];
  const msg = e?.error?.message || e?.message || '';
  const stripped = String(msg).replace(/^[A-Z_]+:\s*/, '');
  return stripped || 'No se pudo completar. Prueba de nuevo.';
}

export function madridToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
}

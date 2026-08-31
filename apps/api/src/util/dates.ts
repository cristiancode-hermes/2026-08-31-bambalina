/** Civil dates in Europe/Madrid. No hold TTL. */

export function madridToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
}

export function isYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s || '');
}

export function daysInclusive(startOn: string, endOn: string): number {
  const a = Date.parse(startOn + 'T00:00:00Z');
  const b = Date.parse(endOn + 'T00:00:00Z');
  if (!Number.isFinite(a) || !Number.isFinite(b)) return -1;
  return Math.round((b - a) / 86400000) + 1;
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export function addDays(ymd: string, n: number): string {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function hoursUntilStart(startOn: string, now = new Date()): number {
  const start = new Date(startOn + 'T00:00:00+02:00');
  return (start.getTime() - now.getTime()) / 3600000;
}

export function lateDays(endOn: string, today = madridToday()): number {
  if (today <= endOn) return 0;
  return daysInclusive(endOn, today) - 1;
}

import * as QRCode from 'qrcode';

export function webOrigin(): string {
  return (process.env.WEB_ORIGIN || 'https://bambalina.proyectos.cristiancode.dev').replace(/\/$/, '');
}

export function rentalPublicUrl(code: string): string {
  return `${webOrigin()}/alquiler/${code}`;
}

export async function buildRentalQrSvg(code: string): Promise<{ qrSvg: string; qrUrl: string }> {
  const qrUrl = rentalPublicUrl(code);
  let svg = await QRCode.toString(qrUrl, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 });
  if (!svg.includes('data-session-url=')) {
    svg = svg.replace('<svg', `<svg data-session-url="${qrUrl}"`);
  }
  return { qrSvg: svg, qrUrl };
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function randomCode(len = 8): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CROCKFORD[Math.floor(Math.random() * CROCKFORD.length)];
  }
  return out;
}

export function extractRentalCode(codeOrUrl: string): string {
  const raw = (codeOrUrl || '').trim();
  const m = raw.match(/alquiler\/([A-Za-z0-9]+)/i);
  if (m) return m[1].toUpperCase();
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

let chain: Promise<unknown> = Promise.resolve();

export function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

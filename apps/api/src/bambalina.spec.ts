import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { HttpException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ALL_ENTITIES, Addon, Piece, Rack, Rental, User } from './entities/entities';
import { AuthService } from './auth/auth.service';
import { RentalsService } from './rentals/rentals.service';
import { StaffController } from './staff/staff.controller';
import { addDays, madridToday } from './util/dates';

function codeOf(err: unknown): string {
  const e = err as HttpException;
  const r = e.getResponse?.() as any;
  return r?.code || r?.message || String(err);
}

async function expectCode(p: Promise<unknown>, code: string) {
  try {
    await p;
    throw new Error('expected ' + code);
  } catch (e) {
    if ((e as Error).message === 'expected ' + code) throw e;
    expect(codeOf(e)).toBe(code);
  }
}

describe('Bambalina', () => {
  let ds: DataSource;
  let auth: AuthService;
  let rentals: RentalsService;
  let staffCtl: StaffController;
  let alice: User;
  let bob: User;
  let staffUser: User;
  let capa: Piece;
  let manton: Piece;
  let casco: Piece;
  let addon: Addon;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: ALL_ENTITIES,
          synchronize: true,
        } as any),
        TypeOrmModule.forFeature(ALL_ENTITIES),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1d' } }),
      ],
      providers: [AuthService, RentalsService, StaffController],
    }).compile();

    ds = moduleRef.get(DataSource);
    auth = moduleRef.get(AuthService);
    rentals = moduleRef.get(RentalsService);
    staffCtl = moduleRef.get(StaffController);

    const hash = await bcrypt.hash('demo1234', 10);
    alice = (await ds.getRepository(User).save({
      username: 'alice',
      email: 'alice@bambalina.test',
      passwordHash: hash,
      role: 'client',
      displayName: 'Alice',
    } as any)) as User;
    bob = (await ds.getRepository(User).save({
      username: 'bob',
      email: 'bob@bambalina.test',
      passwordHash: hash,
      role: 'client',
      displayName: 'Bob',
    } as any)) as User;
    staffUser = (await ds.getRepository(User).save({
      username: 'percha',
      email: 'staff@bambalina.test',
      passwordHash: hash,
      role: 'staff',
      displayName: 'Staff',
    } as any)) as User;

    const rack = (await ds.getRepository(Rack).save({
      slug: 'siglo-oro',
      name: 'Siglo de Oro',
      tagline: 'capa',
      photoUrl: '/assets/camerino-oro.svg',
      sortOrder: 1,
      tags: ['capa'],
    } as any)) as Rack;

    capa = (await ds.getRepository(Piece).save({
      rackId: rack.id,
      name: 'Capa de paño',
      sizeLabel: '42',
      dailyRateCents: 1800,
      depositCents: 4000,
      photoUrl: '/assets/percha-capa.svg',
      fabricNotes: { tejido: 'paño' },
      active: true,
    } as any)) as Piece;
    manton = (await ds.getRepository(Piece).save({
      rackId: rack.id,
      name: 'Mantón',
      sizeLabel: 'único',
      dailyRateCents: 2200,
      depositCents: 5000,
      photoUrl: '/assets/percha-manton.svg',
      fabricNotes: { tejido: 'seda' },
      active: true,
    } as any)) as Piece;
    casco = (await ds.getRepository(Piece).save({
      rackId: rack.id,
      name: 'Casco',
      sizeLabel: '54',
      dailyRateCents: 600,
      depositCents: 800,
      photoUrl: '/assets/percha-casco.svg',
      fabricNotes: { tejido: 'cartón' },
      active: true,
    } as any)) as Piece;
    addon = (await ds.getRepository(Addon).save({
      slug: 'seguro',
      name: 'Seguro',
      priceCents: 600,
    } as any)) as Addon;
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  it('login acepta username', async () => {
    const r = await auth.login({ identifier: 'alice', password: 'demo1234' });
    expect(r.token).toBeTruthy();
    expect(r.user.email).toBe('alice@bambalina.test');
  });

  it('login acepta email', async () => {
    const r = await auth.login({ identifier: 'alice@bambalina.test', password: 'demo1234' });
    expect(r.user.username).toBe('alice');
  });

  it('DATE_INVALID si el rango es imposible', async () => {
    await expectCode(rentals.checkout(alice.id, { startOn: '2026-09-10', endOn: '2026-09-01', pieceIds: [capa.id] }), 'DATE_INVALID');
  });

  it('NO_PIECES si la lista va vacía', async () => {
    await expectCode(rentals.checkout(alice.id, { startOn: '2026-09-20', endOn: '2026-09-21', pieceIds: [] }), 'NO_PIECES');
  });

  it('TOO_MANY_PIECES si hay más de 4', async () => {
    await expectCode(rentals.checkout(alice.id, {
        startOn: '2026-09-20',
        endOn: '2026-09-21',
        pieceIds: ['a','b','c','d','e'],
      }), 'TOO_MANY_PIECES');
  });

  it('checkout cobra y devuelve QR con URL absoluta', async () => {
    const r = await rentals.checkout(alice.id, {
      startOn: '2026-10-01',
      endOn: '2026-10-03',
      pieceIds: [capa.id],
      addonIds: [addon.id],
    });
    expect(r.status).toBe('paid');
    expect(r.qrUrl).toContain('/alquiler/');
    expect(r.qrSvg).toContain(r.qrUrl);
    expect(r.qrSvg).toContain('<svg');
    const days = 3;
    expect(r.totalCents).toBe(1800 * days + 4000 + 600);
    expect(r.computedTotal).toBe(r.totalCents);
  });

  it('PIECE_TAKEN si otro usuario solapa la misma pieza', async () => {
    await expectCode(rentals.checkout(bob.id, {
        startOn: '2026-10-02',
        endOn: '2026-10-04',
        pieceIds: [capa.id],
      }), 'PIECE_TAKEN');
  });

  it('ALREADY_RENTING si el mismo usuario vuelve a la misma pieza', async () => {
    await expectCode(rentals.checkout(alice.id, {
        startOn: '2026-10-03',
        endOn: '2026-10-05',
        pieceIds: [capa.id],
      }), 'ALREADY_RENTING');
  });

  it('rango no solapado sí se puede alquilar', async () => {
    const r = await rentals.checkout(bob.id, {
      startOn: '2026-10-10',
      endOn: '2026-10-11',
      pieceIds: [capa.id],
    });
    expect(r.status).toBe('paid');
  });

  it('lista y detalle coinciden en totalCents', async () => {
    const list = await rentals.listMine(alice.id);
    expect(list.length).toBeGreaterThan(0);
    const one = await rentals.byCodeForUser(alice.id, list[0].code);
    expect(one.totalCents).toBe(list[0].totalCents);
    expect(one.computedTotal).toBe(one.totalCents);
  });

  it('GET público del alquiler es 200-equivalente', async () => {
    const list = await rentals.listMine(alice.id);
    const pub = await rentals.publicByCode(list[0].code);
    expect(pub.code).toBe(list[0].code);
    expect(pub.qrSvg).toContain(pub.qrUrl);
  });

  it('cancelación TOO_LATE si faltan menos de 24 h', async () => {
    const today = madridToday();
    const r = await rentals.checkout(alice.id, {
      startOn: today,
      endOn: addDays(today, 1),
      pieceIds: [manton.id],
    });
    await expectCode(rentals.cancel(alice.id, r.id), 'TOO_LATE');
  });

  it('cancelación ≥24 h libera la pieza', async () => {
    const start = addDays(madridToday(), 5);
    const r = await rentals.checkout(alice.id, {
      startOn: start,
      endOn: addDays(start, 1),
      pieceIds: [casco.id],
    });
    const cancelled = await rentals.cancel(alice.id, r.id);
    expect(cancelled.status).toBe('cancelled');
    const again = await rentals.checkout(bob.id, {
      startOn: start,
      endOn: addDays(start, 1),
      pieceIds: [casco.id],
    });
    expect(again.status).toBe('paid');
  });

  it('pickup paid→picked_up y duplicado ALREADY_PICKED_UP', async () => {
    const start = addDays(madridToday(), 12);
    const r = await rentals.checkout(alice.id, {
      startOn: start,
      endOn: addDays(start, 1),
      pieceIds: [manton.id],
    });
    const first = await staffCtl.pickup({ userId: staffUser.id, role: 'staff' }, { codeOrUrl: r.code });
    expect(first.status).toBe('picked_up');
    await expectCode(staffCtl.pickup({ userId: staffUser.id, role: 'staff' }, { codeOrUrl: r.qrUrl }), 'ALREADY_PICKED_UP');
  });

  it('return sin pickup es NOT_PICKED_UP', async () => {
    const start = addDays(madridToday(), 14);
    const r = await rentals.checkout(bob.id, {
      startOn: start,
      endOn: addDays(start, 1),
      pieceIds: [manton.id],
    });
    await expectCode(staffCtl.returnPiece({ userId: staffUser.id, role: 'staff' }, { codeOrUrl: r.code }), 'NOT_PICKED_UP');
  });

  it('return aplica lateFee y segundo return ALREADY_RETURNED', async () => {
    const start = addDays(madridToday(), -4);
    const end = addDays(madridToday(), -2);
    const r = await rentals.checkout(alice.id, {
      startOn: start,
      endOn: end,
      pieceIds: [casco.id],
    });
    await staffCtl.pickup({ userId: staffUser.id, role: 'staff' }, { codeOrUrl: r.code });
    const ret = await staffCtl.returnPiece({ userId: staffUser.id, role: 'staff' }, { codeOrUrl: r.code });
    expect(ret.status).toBe('returned');
    expect(ret.lateFeeCents).toBeGreaterThan(0);
    await expectCode(staffCtl.returnPiece({ userId: staffUser.id, role: 'staff' }, { codeOrUrl: r.code }), 'ALREADY_RETURNED');
  });

  it('puntos derivados de días returned', async () => {
    const returned = await ds.getRepository(Rental).find({ where: { userId: alice.id, status: 'returned' } });
    let days = 0;
    for (const row of returned) {
      const a = Date.parse(row.startOn + 'T00:00:00Z');
      const b = Date.parse(row.endOn + 'T00:00:00Z');
      days += Math.round((b - a) / 86400000) + 1;
    }
    expect(days).toBeGreaterThan(0);
  });

  it('fromPriceCents es el min de tarifas del perchero', () => {
    const from = Math.min(capa.dailyRateCents, manton.dailyRateCents, casco.dailyRateCents);
    expect(from).toBe(600);
  });

  it('DATE_INVALID si no es YYYY-MM-DD', async () => {
    await expectCode(rentals.checkout(alice.id, { startOn: '01/10/2026', endOn: '2026-10-02', pieceIds: [capa.id] }), 'DATE_INVALID');
  });

  it('no hay expiresAt de hold en el alquiler cobrado', async () => {
    const list = await rentals.listMine(alice.id);
    expect((list[0] as any).expiresAt).toBeUndefined();
  });
});

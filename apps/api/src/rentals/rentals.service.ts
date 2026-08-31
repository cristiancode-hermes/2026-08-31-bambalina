import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Addon, Piece, Rental, RentalAddon, RentalLine } from '../entities/entities';
import { badRequest, conflict } from '../util/http-error';
import { daysInclusive, hoursUntilStart, isYmd, rangesOverlap } from '../util/dates';
import { buildRentalQrSvg, randomCode, withLock } from '../util/qr';

const ACTIVE = ['paid', 'picked_up'];

@Injectable()
export class RentalsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Rental) private readonly rentals: Repository<Rental>,
    @InjectRepository(RentalLine) private readonly lines: Repository<RentalLine>,
    @InjectRepository(RentalAddon) private readonly rentalAddons: Repository<RentalAddon>,
    @InjectRepository(Piece) private readonly pieces: Repository<Piece>,
    @InjectRepository(Addon) private readonly addons: Repository<Addon>,
  ) {}

  checkout(userId: string, dto: { startOn: string; endOn: string; pieceIds: string[]; addonIds?: string[] }) {
    return withLock(() => this.checkoutLocked(userId, dto));
  }

  private async checkoutLocked(
    userId: string,
    dto: { startOn: string; endOn: string; pieceIds: string[]; addonIds?: string[] },
  ) {
    const startOn = (dto.startOn || '').trim();
    const endOn = (dto.endOn || '').trim();
    if (!isYmd(startOn) || !isYmd(endOn)) throw badRequest('DATE_INVALID');
    const days = daysInclusive(startOn, endOn);
    if (days < 1 || days > 14 || endOn < startOn) throw badRequest('DATE_INVALID');

    const pieceIds = [...new Set(dto.pieceIds || [])];
    if (!pieceIds.length) throw badRequest('NO_PIECES');
    if (pieceIds.length > 4) throw conflict('TOO_MANY_PIECES');

    const addonIds = [...new Set(dto.addonIds || [])];

    return this.dataSource.transaction(async (manager) => {
      const pieceRepo = manager.getRepository(Piece);
      const rentalRepo = manager.getRepository(Rental);
      const lineRepo = manager.getRepository(RentalLine);
      const raRepo = manager.getRepository(RentalAddon);
      const addonRepo = manager.getRepository(Addon);

      const supportsLock = this.dataSource.options.type !== 'better-sqlite3';
      const locked: Piece[] = [];
      for (const id of pieceIds) {
        const qb = pieceRepo.createQueryBuilder('p').where('p.id = :id', { id });
        const p = supportsLock ? await qb.setLock('pessimistic_write').getOne() : await qb.getOne();
        if (!p || !p.active) throw badRequest('NO_PIECES');
        locked.push(p);
      }

      const active = await rentalRepo.find({
        where: [{ status: 'paid' }, { status: 'picked_up' }],
        relations: { lines: true },
      });

      for (const piece of locked) {
        for (const r of active) {
          if (!rangesOverlap(r.startOn, r.endOn, startOn, endOn)) continue;
          const hit = (r.lines || []).some((l) => l.pieceId === piece.id);
          if (!hit) continue;
          if (r.userId === userId) throw conflict('ALREADY_RENTING');
          throw conflict('PIECE_TAKEN');
        }
      }

      const addonRows: Addon[] = [];
      if (addonIds.length) {
        const found = await addonRepo.find({ where: { id: In(addonIds) } });
        addonRows.push(...found);
      }

      const depositCents = locked.reduce((s, p) => s + p.depositCents, 0);
      const lineSnaps = locked.map((p) => ({
        pieceId: p.id,
        dailyRateCents: p.dailyRateCents,
        days,
        lineTotalCents: p.dailyRateCents * days,
      }));
      const addonTotal = addonRows.reduce((s, a) => s + a.priceCents, 0);
      const linesTotal = lineSnaps.reduce((s, l) => s + l.lineTotalCents, 0);
      const totalCents = linesTotal + addonTotal + depositCents;

      let code = randomCode();
      while (await rentalRepo.findOne({ where: { code } })) code = randomCode();

      const rental = (await rentalRepo.save({
        userId,
        code,
        startOn,
        endOn,
        status: 'paid',
        depositCents,
        lateFeeCents: 0,
        depositReleased: false,
        totalCents,
        cancelledAt: null,
      } as any)) as Rental;

      for (const snap of lineSnaps) {
        await lineRepo.save({ rentalId: rental.id, ...snap } as any);
      }
      for (const a of addonRows) {
        await raRepo.save({ rentalId: rental.id, addonId: a.id, priceCents: a.priceCents } as any);
      }

      return this.serialize(rental.id, manager);
    });
  }

  async listMine(userId: string) {
    const rows = await this.rentals.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: { lines: { piece: true }, addons: { addon: true } },
    });
    const out = [];
    for (const r of rows) out.push(await this.withQr(this.toDto(r)));
    return out;
  }

  async byCodeForUser(userId: string, code: string) {
    const r = await this.rentals.findOne({
      where: { userId, code: code.toUpperCase() },
      relations: { lines: { piece: true }, addons: { addon: true } },
    });
    if (!r) return null;
    return this.withQr(this.toDto(r));
  }

  async publicByCode(code: string) {
    const r = await this.rentals.findOne({
      where: { code: code.toUpperCase() },
      relations: { lines: { piece: true }, addons: { addon: true } },
    });
    if (!r) throw new NotFoundException('Alquiler no encontrado');
    const dto = this.toDto(r);
    return this.withQr({
      code: dto.code,
      status: dto.status,
      startOn: dto.startOn,
      endOn: dto.endOn,
      totalCents: dto.totalCents,
      lines: dto.lines,
    });
  }

  async cancel(userId: string, id: string) {
    const r = await this.rentals.findOne({ where: { id, userId } });
    if (!r) throw new NotFoundException('Alquiler no encontrado');
    if (r.status !== 'paid') throw conflict('TOO_LATE');
    if (hoursUntilStart(r.startOn) < 24) throw conflict('TOO_LATE');
    r.status = 'cancelled';
    r.cancelledAt = new Date();
    await this.rentals.save(r);
    return this.serialize(r.id);
  }

  async serialize(id: string, manager?: { getRepository: (t: any) => Repository<any> }) {
    const repo = manager ? manager.getRepository(Rental) : this.rentals;
    const r = await repo.findOne({
      where: { id },
      relations: { lines: { piece: true }, addons: { addon: true } },
    });
    if (!r) throw new NotFoundException('Alquiler no encontrado');
    return this.withQr(this.toDto(r));
  }

  toDto(r: Rental) {
    const lines = (r.lines || []).map((l) => ({
      id: l.id,
      pieceId: l.pieceId,
      name: l.piece?.name,
      photoUrl: l.piece?.photoUrl,
      dailyRateCents: l.dailyRateCents,
      days: l.days,
      lineTotalCents: l.lineTotalCents,
    }));
    const addons = (r.addons || []).map((a) => ({
      addonId: a.addonId,
      name: a.addon?.name,
      priceCents: a.priceCents,
    }));
    const linesSum = lines.reduce((s, l) => s + l.lineTotalCents, 0);
    const addonsSum = addons.reduce((s, a) => s + a.priceCents, 0);
    const computedTotal = linesSum + addonsSum + r.depositCents + (r.lateFeeCents || 0);
    return {
      id: r.id,
      code: r.code,
      userId: r.userId,
      startOn: r.startOn,
      endOn: r.endOn,
      status: r.status,
      depositCents: r.depositCents,
      lateFeeCents: r.lateFeeCents,
      depositReleased: r.depositReleased,
      totalCents: r.totalCents,
      computedTotal,
      lines,
      addons,
      createdAt: r.createdAt,
    };
  }

  private async withQr<T extends { code: string }>(dto: T) {
    const qr = await buildRentalQrSvg(dto.code);
    return { ...dto, ...qr };
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Addon, Piece, Rack, Rental, RentalLine } from '../entities/entities';
import { isYmd, rangesOverlap } from '../util/dates';

@Controller()
export class CatalogController {
  constructor(
    @InjectRepository(Rack) private readonly racks: Repository<Rack>,
    @InjectRepository(Piece) private readonly pieces: Repository<Piece>,
    @InjectRepository(Addon) private readonly addons: Repository<Addon>,
    @InjectRepository(Rental) private readonly rentals: Repository<Rental>,
    @InjectRepository(RentalLine) private readonly lines: Repository<RentalLine>,
  ) {}

  @Get('racks')
  async listRacks() {
    const racks = await this.racks.find({ order: { sortOrder: 'ASC' } });
    const pieces = await this.pieces.find({ where: { active: true } });
    return racks.map((r) => this.withFromPrice(r, pieces.filter((p) => p.rackId === r.id)));
  }

  @Get('racks/:id')
  async getRack(@Param('id') id: string) {
    const rack = await this.racks.findOne({ where: [{ id }, { slug: id }] as any });
    if (!rack) return { error: 'not_found' };
    const pieces = await this.pieces.find({ where: { rackId: rack.id, active: true } });
    return { ...this.withFromPrice(rack, pieces), pieces };
  }

  @Get('pieces')
  async listPieces(
    @Query('startOn') startOn?: string,
    @Query('endOn') endOn?: string,
    @Query('rackId') rackId?: string,
  ) {
    const where: any = { active: true };
    if (rackId) where.rackId = rackId;
    const pieces = await this.pieces.find({ where, relations: { rack: true } });
    const busy = await this.busyPieceIds(startOn, endOn);
    return pieces.map((p) => ({
      ...p,
      available: !busy.has(p.id),
    }));
  }

  @Get('pieces/:id')
  async getPiece(
    @Param('id') id: string,
    @Query('startOn') startOn?: string,
    @Query('endOn') endOn?: string,
  ) {
    const piece = await this.pieces.findOne({ where: { id }, relations: { rack: true } });
    if (!piece) return { error: 'not_found' };
    const busy = await this.busyPieceIds(startOn, endOn);
    return { ...piece, available: !busy.has(piece.id) };
  }

  @Get('addons')
  listAddons() {
    return this.addons.find({ order: { priceCents: 'ASC' } });
  }

  private withFromPrice(rack: Rack, pieces: Piece[]) {
    const rates = pieces.map((p) => p.dailyRateCents);
    const fromPriceCents = rates.length ? Math.min(...rates) : 0;
    return { ...rack, fromPriceCents };
  }

  private async busyPieceIds(startOn?: string, endOn?: string): Promise<Set<string>> {
    if (!startOn || !endOn || !isYmd(startOn) || !isYmd(endOn)) return new Set();
    const active = await this.rentals.find({
      where: [{ status: 'paid' }, { status: 'picked_up' }],
    });
    const overlapping = active.filter((r) => rangesOverlap(r.startOn, r.endOn, startOn, endOn));
    if (!overlapping.length) return new Set();
    const lines = await this.lines.find({
      where: { rentalId: In(overlapping.map((r) => r.id)) },
    });
    return new Set(lines.map((l) => l.pieceId));
  }
}

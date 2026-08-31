import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard, StaffGuard, CurrentUser } from '../auth/auth.controller';
import type { Authed } from '../auth/auth.controller';
import { Piece, Rental, RentalLine } from '../entities/entities';
import { addDays, madridToday, rangesOverlap } from '../util/dates';

@Controller('stats')
export class StatsController {
  constructor(
    @InjectRepository(Rental) private readonly rentals: Repository<Rental>,
    @InjectRepository(RentalLine) private readonly lines: Repository<RentalLine>,
    @InjectRepository(Piece) private readonly pieces: Repository<Piece>,
  ) {}

  @Get('occupancy')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffGuard)
  async occupancy() {
    const today = madridToday();
    const totalPieces = await this.pieces.count({ where: { active: true } });
    const active = await this.rentals.find({
      where: [{ status: 'paid' }, { status: 'picked_up' }],
      relations: { lines: true },
    });
    const days: { date: string; busy: number; total: number; pct: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const busyIds = new Set<string>();
      for (const r of active) {
        if (!rangesOverlap(r.startOn, r.endOn, date, date)) continue;
        for (const l of r.lines || []) busyIds.add(l.pieceId);
      }
      const busy = busyIds.size;
      days.push({
        date,
        busy,
        total: totalPieces,
        pct: totalPieces ? Math.round((busy / totalPieces) * 100) : 0,
      });
    }
    return days;
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: Authed) {
    return this.pointsFor(user.userId);
  }

  async pointsFor(userId: string) {
    const returned = await this.rentals.find({ where: { userId, status: 'returned' } });
    let returnedDays = 0;
    for (const r of returned) {
      const a = Date.parse(r.startOn + 'T00:00:00Z');
      const b = Date.parse(r.endOn + 'T00:00:00Z');
      returnedDays += Math.round((b - a) / 86400000) + 1;
    }
    return { points: returnedDays, returnedDays };
  }
}

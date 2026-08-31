import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtAuthGuard, StaffGuard, CurrentUser } from '../auth/auth.controller';
import type { Authed } from '../auth/auth.controller';
import { Rental, ScanEvent } from '../entities/entities';
import { conflict } from '../util/http-error';
import { extractRentalCode } from '../util/qr';
import { lateDays } from '../util/dates';
import { RentalsService } from '../rentals/rentals.service';

class ScanDto {
  @ApiProperty()
  @IsString()
  codeOrUrl: string;
}

@Controller('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffGuard)
export class StaffController {
  constructor(
    @InjectRepository(Rental) private readonly rentals: Repository<Rental>,
    @InjectRepository(ScanEvent) private readonly scans: Repository<ScanEvent>,
    private readonly rentalsSvc: RentalsService,
  ) {}

  @Post('pickup')
  async pickup(@CurrentUser() staff: Authed, @Body() dto: ScanDto) {
    const rental = await this.findByCode(dto.codeOrUrl);
    if (rental.status === 'picked_up' || rental.status === 'returned') throw conflict('ALREADY_PICKED_UP');
    if (rental.status !== 'paid') throw conflict('ALREADY_PICKED_UP');
    rental.status = 'picked_up';
    await this.rentals.save(rental);
    await this.scans.save({ rentalId: rental.id, staffId: staff.userId, kind: 'pickup' } as any);
    const full = await this.rentalsSvc.serialize(rental.id);
    return { rental: full, status: 'picked_up' };
  }

  @Post('return')
  async returnPiece(@CurrentUser() staff: Authed, @Body() dto: ScanDto) {
    const rental = await this.findByCode(dto.codeOrUrl);
    if (rental.status === 'returned') throw conflict('ALREADY_RETURNED');
    if (rental.status !== 'picked_up') throw conflict('NOT_PICKED_UP');

    const full = await this.rentalsSvc.serialize(rental.id);
    const late = lateDays(rental.endOn);
    const dailySum = (full.lines || []).reduce((s: number, l: { dailyRateCents: number }) => s + l.dailyRateCents, 0);
    const lateFeeCents = late * dailySum;
    rental.status = 'returned';
    rental.lateFeeCents = lateFeeCents;
    rental.depositReleased = true;
    rental.totalCents = rental.totalCents - 0 + lateFeeCents;
    // totalCents already includes deposit + lines + addons; add late
    const base = full.computedTotal - (full.lateFeeCents || 0);
    rental.totalCents = base + lateFeeCents;
    await this.rentals.save(rental);
    await this.scans.save({ rentalId: rental.id, staffId: staff.userId, kind: 'return' } as any);
    const updated = await this.rentalsSvc.serialize(rental.id);
    return { rental: updated, status: 'returned', lateFeeCents };
  }

  private async findByCode(codeOrUrl: string) {
    const code = extractRentalCode(codeOrUrl);
    const rental = await this.rentals.findOne({ where: { code } });
    if (!rental) throw new NotFoundException('Alquiler no encontrado');
    return rental;
  }
}

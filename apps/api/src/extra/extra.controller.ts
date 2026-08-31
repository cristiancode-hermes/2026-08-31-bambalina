import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.controller';
import type { Authed } from '../auth/auth.controller';
import { Review, Rental, RentalLine, User } from '../entities/entities';
import { conflict } from '../util/http-error';
import { AuthService } from '../auth/auth.service';
import { StatsController } from '../stats/stats.controller';

class ReviewDto {
  @ApiProperty()
  @IsString()
  pieceId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;
}

class PatchMeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;
}

@Controller()
export class ExtraController {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(Rental) private readonly rentals: Repository<Rental>,
    @InjectRepository(RentalLine) private readonly lines: Repository<RentalLine>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly auth: AuthService,
    private readonly stats: StatsController,
  ) {}

  @Post('reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createReview(@CurrentUser() user: Authed, @Body() dto: ReviewDto) {
    const existing = await this.reviews.findOne({ where: { userId: user.userId, pieceId: dto.pieceId } });
    if (existing) throw conflict('ALREADY_REVIEWED');
    const returned = await this.rentals.find({ where: { userId: user.userId, status: 'returned' } });
    const ids = returned.map((r) => r.id);
    if (!ids.length) throw conflict('NOT_RETURNED');
    const hit = await this.lines.findOne({ where: ids.map((rentalId) => ({ rentalId, pieceId: dto.pieceId })) as any });
    if (!hit) throw conflict('NOT_RETURNED');
    const row = (await this.reviews.save({
      userId: user.userId,
      pieceId: dto.pieceId,
      rating: dto.rating,
      body: dto.body || null,
    } as any)) as Review;
    return row;
  }

  @Get('reviews/piece/:pieceId')
  listReviews(@Param('pieceId') pieceId: string) {
    return this.reviews.find({ where: { pieceId }, order: { createdAt: 'DESC' } });
  }

  @Get('users/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: Authed) {
    const u = await this.auth.me(user.userId);
    const pts = await this.stats.pointsFor(user.userId);
    return { ...u, ...pts };
  }

  @Patch('users/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async patchMe(@CurrentUser() user: Authed, @Body() dto: PatchMeDto) {
    const u = await this.users.findOne({ where: { id: user.userId } });
    if (!u) return u;
    if (dto.displayName) u.displayName = dto.displayName;
    await this.users.save(u);
    return this.auth.toAuthUser(u);
  }
}

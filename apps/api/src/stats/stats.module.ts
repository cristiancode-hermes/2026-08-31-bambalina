import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Piece, Rental, RentalLine } from '../entities/entities';
import { StatsController } from './stats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rental, RentalLine, Piece]), AuthModule],
  controllers: [StatsController],
  providers: [StatsController],
  exports: [StatsController],
})
export class StatsModule {}

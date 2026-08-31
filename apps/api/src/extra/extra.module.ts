import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { StatsModule } from '../stats/stats.module';
import { Rental, RentalLine, Review, User } from '../entities/entities';
import { ExtraController } from './extra.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Rental, RentalLine, User]), AuthModule, StatsModule],
  controllers: [ExtraController],
})
export class ExtraModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Addon, Piece, Rental, RentalAddon, RentalLine } from '../entities/entities';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rental, RentalLine, RentalAddon, Piece, Addon]), AuthModule],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Addon, Piece, Rack, Rental, RentalAddon, RentalLine, User } from '../entities/entities';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Rack, Piece, Addon, Rental, RentalLine, RentalAddon])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}

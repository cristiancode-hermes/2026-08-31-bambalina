import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Addon, Piece, Rack, Rental, RentalLine } from '../entities/entities';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rack, Piece, Addon, Rental, RentalLine])],
  controllers: [CatalogController],
})
export class CatalogModule {}

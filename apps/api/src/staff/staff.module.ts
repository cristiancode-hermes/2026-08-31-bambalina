import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RentalsModule } from '../rentals/rentals.module';
import { Rental, ScanEvent } from '../entities/entities';
import { StaffController } from './staff.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rental, ScanEvent]), AuthModule, RentalsModule],
  controllers: [StaffController],
})
export class StaffModule {}

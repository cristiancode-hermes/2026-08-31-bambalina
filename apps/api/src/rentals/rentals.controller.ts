import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.controller';
import type { Authed } from '../auth/auth.controller';
import { RentalsService } from './rentals.service';

export class CheckoutDto {
  @ApiProperty()
  @IsString()
  startOn: string;

  @ApiProperty()
  @IsString()
  endOn: string;

  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  pieceIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addonIds?: string[];
}

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentals: RentalsService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: Authed, @Body() dto: CheckoutDto) {
    return this.rentals.checkout(user.userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: Authed) {
    return this.rentals.listMine(user.userId);
  }

  @Get('public/:code')
  publicByCode(@Param('code') code: string) {
    return this.rentals.publicByCode(code);
  }

  @Get(':code')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async mineOne(@CurrentUser() user: Authed, @Param('code') code: string) {
    const row = await this.rentals.byCodeForUser(user.userId, code);
    if (!row) throw new NotFoundException('Alquiler no encontrado');
    return row;
  }

  @Post(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: Authed, @Param('id') id: string) {
    return this.rentals.cancel(user.userId, id);
  }
}

import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  CanActivate,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty()
  @IsString()
  identifier: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export type Authed = { userId: string; role: string };

export const CurrentUser = createParamDecorator((_d: unknown, ctx: ExecutionContext): Authed => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user as Authed | undefined;
    if (!user) throw new ForbiddenException();
    if (user.role !== 'staff' && user.role !== 'admin') {
      throw new ForbiddenException('Solo el guardarropa puede escanear');
    }
    return true;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: Authed) {
    return this.auth.me(user.userId);
  }
}
